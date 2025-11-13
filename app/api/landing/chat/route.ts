/**
 * Landing Page Chat API Endpoint
 *
 * Handles chat queries for the landing page interactive demo.
 * Uses RAG (Retrieval Augmented Generation) over the demo video transcript.
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { rateLimiter } from '@/lib/rate-limit';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const anthropic = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

interface TranscriptChunk {
  id: string;
  text: string;
  startTime?: string;
  endTime?: string;
  startSeconds?: number;
  endSeconds?: number;
  embedding: number[];
}

interface SearchResult {
  chunk: TranscriptChunk;
  similarity: number;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have same length');
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i]! * b[i]!;
    magnitudeA += a[i]! * a[i]!;
    magnitudeB += b[i]! * b[i]!;
  }

  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Search transcript chunks for relevant content
 */
async function searchTranscript(
  query: string,
  chunks: TranscriptChunk[],
  topK = 3
): Promise<SearchResult[]> {
  // Generate embedding for query
  const queryEmbeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
  });

  const queryEmbedding = queryEmbeddingResponse.data[0]!.embedding;

  // Calculate similarities
  const results: SearchResult[] = chunks.map((chunk) => ({
    chunk,
    similarity: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by similarity and return top K
  results.sort((a, b) => b.similarity - a.similarity);

  return results.slice(0, topK);
}

/**
 * Generate response using Claude with RAG context
 */
async function generateResponse(query: string, searchResults: SearchResult[]): Promise<string> {
  // Build context from search results
  const context = searchResults
    .map((result, index) => {
      const timeInfo = result.chunk.startTime
        ? ` [Timestamp: ${result.chunk.startTime}]`
        : '';
      return `Context ${index + 1}${timeInfo}:\n${result.chunk.text}`;
    })
    .join('\n\n');

  const prompt = `You are Chronos AI, an AI teaching assistant helping users understand video content.

A user is watching a video about "How To Make $100,000 Per Month With Whop" and has a question.

Here are the most relevant parts of the video transcript:

${context}

User question: ${query}

Please provide a helpful, conversational answer based on the video content. If you reference specific information from the video, include the timestamp in square brackets like [3:45]. Keep your response concise (2-3 sentences max) and actionable.

If the question cannot be answered from the provided context, politely say so and suggest what the user might search for instead.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 300,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0]!;
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text;
}

/**
 * Load processed chunks from file system
 */
async function loadProcessedChunks(): Promise<TranscriptChunk[]> {
  const chunksPath = path.join(process.cwd(), 'data', 'landing-page', 'processed-chunks.json');

  try {
    const chunksData = await fs.readFile(chunksPath, 'utf-8');
    return JSON.parse(chunksData);
  } catch (error) {
    throw new Error(
      'Processed chunks not found. Run "npm run process-landing-transcript" first.'
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 2 questions per hour per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown';

    const RATE_LIMIT = 2; // 2 questions max
    const WINDOW_MS = 60 * 60 * 1000; // 1 hour

    const rateLimit = rateLimiter.check(ip, RATE_LIMIT, WINDOW_MS);

    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000 / 60); // minutes
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          message: `You've reached the demo limit of ${RATE_LIMIT} questions. Try again in ${resetIn} minutes, or sign in to unlock unlimited questions.`,
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString(),
            'Retry-After': resetIn.toString(),
          }
        }
      );
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Validate API keys
    if (!process.env['OPENAI_API_KEY']) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!process.env['ANTHROPIC_API_KEY']) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      );
    }

    // Load processed chunks
    const chunks = await loadProcessedChunks();

    // Search for relevant chunks
    const searchResults = await searchTranscript(message, chunks, 3);

    // Generate response
    const response = await generateResponse(message, searchResults);

    // Extract timestamps from response for video seeking
    const timestampMatches = response.match(/\[(\d+:\d+(?::\d+)?)\]/g);
    const timestamps = timestampMatches
      ? timestampMatches.map((match) => match.replace(/[\[\]]/g, ''))
      : [];

    return NextResponse.json(
      {
        response,
        timestamps,
        relevantChunks: searchResults.map((result) => ({
          text: result.chunk.text.slice(0, 200) + '...',
          startTime: result.chunk.startTime,
          similarity: result.similarity,
        })),
      },
      {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.resetAt.toString(),
        }
      }
    );
  } catch (error) {
    console.error('Landing page chat error:', error);

    if (error instanceof Error && error.message.includes('Processed chunks not found')) {
      return NextResponse.json(
        {
          error: 'Demo not initialized',
          message:
            'The interactive demo needs to be set up. Please run: npm run process-landing-transcript',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process chat request', message: String(error) },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  try {
    const chunksPath = path.join(
      process.cwd(),
      'data',
      'landing-page',
      'processed-chunks.json'
    );

    const exists = await fs
      .access(chunksPath)
      .then(() => true)
      .catch(() => false);

    return NextResponse.json({
      status: exists ? 'ready' : 'not_initialized',
      message: exists
        ? 'Landing page demo is ready'
        : 'Run npm run process-landing-transcript to initialize',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: String(error) },
      { status: 500 }
    );
  }
}
