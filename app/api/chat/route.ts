/**
 * Enhanced RAG Chat API Route
 *
 * POST /api/chat - Send a message and get AI response with streaming
 *
 * This endpoint uses the enhanced RAG infrastructure with:
 * - Advanced vector search with ranking (lib/rag/search.ts)
 * - Context builder with token management (lib/rag/context-builder.ts)
 * - Session management with auto-creation (lib/rag/sessions.ts)
 * - Comprehensive cost tracking (lib/rag/cost-calculator.ts)
 * - Message persistence (lib/rag/messages.ts)
 */

import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// RAG Infrastructure
import { searchWithinCourse, searchCreatorContent } from '@/lib/rag/search';
import { buildContext, buildSystemPrompt, estimateTokens } from '@/lib/rag/context-builder';
import {
  getOrCreateSession,
  generateAndSetTitle,
  touchSession,
  getSession
} from '@/lib/rag/sessions';
import { createMessage, getMessages } from '@/lib/rag/messages';
import {
  calculateCompleteCost,
  formatCost
} from '@/lib/rag/cost-calculator';
import type { CostBreakdown } from '@/lib/rag/types';

// AI Integration
import { createSSEStream, createStreamingResponse } from '@/lib/ai/streaming';

// Database
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Claude 3.5 Haiku model
const CLAUDE_MODEL = 'claude-3-5-haiku-20241022';
const MAX_OUTPUT_TOKENS = 4096;

// Lazy-initialize Anthropic client to ensure env vars are available in Edge Runtime
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env['ANTHROPIC_API_KEY'];
    if (!apiKey) {
      console.error('[Chat API] ANTHROPIC_API_KEY not set!');
      throw new Error('ANTHROPIC_API_KEY environment variable is not configured');
    }
    console.log('[Chat API] Initializing Anthropic client...');
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

interface ChatRequest {
  message: string;
  sessionId?: string; // Optional - will auto-create if not provided
  creatorId: string;
  studentId?: string; // Optional for anonymous/demo mode
  courseId?: string; // Optional - restrict search to course videos
  stream?: boolean; // Default: true
}

interface ChatResponse {
  content: string;
  sessionId: string;
  videoReferences: Array<{
    video_id: string;
    video_title: string;
    video_thumbnail?: string;
    timestamp: number;
    timestamp_formatted: string;
    chunk_text: string;
    relevance_score: number;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    embedding_queries: number;
    total_tokens: number;
    cost_breakdown: CostBreakdown;
    cost_formatted: string;
  };
  cached: boolean;
}

/**
 * POST /api/chat
 * Send a chat message and receive AI response with video references
 */
export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    console.log('[Chat API] ========== REQUEST START ==========');

    const body = (await req.json()) as ChatRequest;
    const {
      message,
      sessionId,
      creatorId,
      studentId,
      courseId,
      stream = true
    } = body;

    console.log('[Chat API] Request body:', JSON.stringify({ message: message?.substring(0, 50), sessionId, creatorId, studentId, courseId, stream }));

    // Validate request
    if (!message || !message.trim()) {
      console.log('[Chat API] ❌ Validation failed: Message is required');
      return Response.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!creatorId) {
      console.log('[Chat API] ❌ Validation failed: Creator ID is required');
      return Response.json(
        { error: 'Creator ID is required' },
        { status: 400 }
      );
    }

    console.log(`[Chat API] ✅ Validation passed. Processing message for creator ${creatorId}, session ${sessionId || 'NEW'}`);

    // Check API keys
    console.log('[Chat API] API Keys check:');
    console.log(`  - ANTHROPIC_API_KEY: ${process.env['ANTHROPIC_API_KEY'] ? 'SET (' + process.env['ANTHROPIC_API_KEY']?.substring(0, 10) + '...)' : '❌ NOT SET'}`);
    console.log(`  - OPENAI_API_KEY: ${process.env['OPENAI_API_KEY'] ? 'SET (' + process.env['OPENAI_API_KEY']?.substring(0, 10) + '...)' : '❌ NOT SET'}`);

    // Get or create session
    let session;

    if (sessionId) {
      console.log('[Chat API] Loading existing session...');
      // Load existing session
      session = await getSession(sessionId, false);

      if (!session) {
        console.log('[Chat API] ❌ Session not found:', sessionId);
        return Response.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      // Verify session belongs to this creator
      if (session.creator_id !== creatorId) {
        console.log('[Chat API] ❌ Unauthorized access to session');
        return Response.json(
          { error: 'Unauthorized access to session' },
          { status: 403 }
        );
      }
      console.log('[Chat API] ✅ Existing session loaded:', session.id);
    } else {
      // Create new session
      if (!studentId) {
        console.log('[Chat API] ❌ Student ID required for new session');
        return Response.json(
          { error: 'Student ID required for new session' },
          { status: 400 }
        );
      }

      console.log(`[Chat API] Creating new session for student ${studentId}, creator ${creatorId}...`);
      try {
        session = await getOrCreateSession(studentId, creatorId);
        console.log(`[Chat API] ✅ Session created: ${session.id}`);
      } catch (sessionError) {
        console.error('[Chat API] ❌ Failed to create session:', sessionError);
        throw new Error(`Session creation failed: ${sessionError instanceof Error ? sessionError.message : 'Unknown error'}`);
      }
    }

    // Perform vector search
    console.log(`[Chat API] Performing vector search for: "${message.substring(0, 50)}..."`);

    let searchResults;
    try {
      if (courseId) {
        // Search within specific course
        console.log(`[Chat API] Searching within course: ${courseId}`);
        searchResults = await searchWithinCourse(courseId, message, {
          match_count: 5,
          similarity_threshold: 0.7,
          boost_viewed_by_student: studentId || undefined,
        });
      } else {
        // Search all creator's content
        console.log(`[Chat API] Searching all creator content for: ${creatorId}`);
        searchResults = await searchCreatorContent(creatorId, message, {
          match_count: 5,
          similarity_threshold: 0.7,
          boost_viewed_by_student: studentId || undefined,
        });
      }
      console.log(`[Chat API] ✅ Vector search completed. Found ${searchResults.length} relevant chunks`);
    } catch (searchError) {
      console.error('[Chat API] ❌ Vector search failed:', searchError);
      throw new Error(`Vector search failed: ${searchError instanceof Error ? searchError.message : 'Unknown error'}`);
    }

    if (searchResults.length === 0) {
      // No relevant context found
      const noContextResponse = "I couldn't find any relevant information in the video content to answer your question. Could you try rephrasing or asking about a different topic covered in the course?";

      // Save user message
      await createMessage({
        session_id: session.id,
        role: 'user',
        content: message,
      });

      // Save assistant response
      await createMessage({
        session_id: session.id,
        role: 'assistant',
        content: noContextResponse,
        video_references: [],
        token_count: estimateTokens(message + noContextResponse),
        model: CLAUDE_MODEL,
      });

      return Response.json({
        content: noContextResponse,
        sessionId: session.id,
        videoReferences: [],
        usage: {
          input_tokens: 0,
          output_tokens: 0,
          embedding_queries: 1, // Query embedding was generated
          total_tokens: 0,
          cost_breakdown: calculateCompleteCost({ embedding_queries: 1 }),
          cost_formatted: formatCost(calculateCompleteCost({ embedding_queries: 1 }).total_cost),
        },
        cached: false,
      });
    }

    // Build context from search results
    const context = buildContext(searchResults, {
      max_tokens: 8000,
      format: 'markdown',
      include_timestamps: true,
      include_video_titles: true,
      deduplicate_content: true,
    });

    console.log(`[Chat API] Built context: ${context.total_chunks} chunks, ${context.total_tokens} tokens`);

    // Build system prompt
    const systemPrompt = buildSystemPrompt(context, `
You are an AI learning assistant helping students understand video course content.

Important guidelines:
- ONLY use information from the provided video transcripts
- Cite specific videos and timestamps when referencing information
- Format citations as: [Video Title @ timestamp]
- If information isn't in the transcripts, clearly state that
- Be concise, helpful, and educational
- Use markdown formatting for better readability
`);

    // Get recent conversation history (last 5 messages)
    const recentMessages = await getMessages(session.id, { limit: 10 });
    const conversationHistory = recentMessages
      .slice(-5) // Last 5 messages (10 messages = 5 pairs)
      .map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

    // Estimate input tokens
    const inputTokens =
      estimateTokens(systemPrompt) +
      conversationHistory.reduce((sum, msg) => sum + estimateTokens(msg.content), 0) +
      estimateTokens(message);

    console.log(`[Chat API] Estimated input tokens: ${inputTokens}`);

    // Save user message
    await createMessage({
      session_id: session.id,
      role: 'user',
      content: message,
    });

    // Generate AI response (streaming or non-streaming)
    if (stream) {
      // === STREAMING RESPONSE ===
      return handleStreamingResponse(
        session.id,
        message,
        systemPrompt,
        conversationHistory,
        context,
        inputTokens,
        creatorId
      );
    } else {
      // === NON-STREAMING RESPONSE ===
      return handleNonStreamingResponse(
        session.id,
        message,
        systemPrompt,
        conversationHistory,
        searchResults,
        context,
        inputTokens,
        creatorId
      );
    }
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error('[Chat API] ========== ERROR ==========');
    console.error('[Chat API] Error after', elapsed, 'ms');
    console.error('[Chat API] Error type:', error?.constructor?.name);
    console.error('[Chat API] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[Chat API] Error stack:', error instanceof Error ? error.stack : 'No stack trace');

    return Response.json(
      {
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
        debug: {
          elapsed_ms: elapsed,
          error_type: error?.constructor?.name,
        }
      },
      { status: 500 }
    );
  }
}

/**
 * Handle streaming response
 */
async function handleStreamingResponse(
  sessionId: string,
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  context: any,
  inputTokens: number,
  creatorId: string
): Promise<Response> {
  let fullContent = '';
  let outputTokens = 0;

  async function* streamGenerator() {
    try {
      // Start Claude streaming
      const stream = await getAnthropicClient().messages.stream({
        model: CLAUDE_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          ...conversationHistory,
          { role: 'user', content: userMessage },
        ],
      });

      // Stream content chunks
      for await (const event of stream) {
        if (event.type === 'content_block_delta') {
          if (event.delta.type === 'text_delta') {
            const chunk = event.delta.text;
            fullContent += chunk;

            yield {
              type: 'content' as const,
              content: chunk,
            };
          }
        }
      }

      // Get final message with usage stats
      const finalMessage = await stream.finalMessage();
      outputTokens = finalMessage.usage.output_tokens;

      // Calculate cost
      const costBreakdown = calculateCompleteCost({
        model: CLAUDE_MODEL,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        embedding_queries: 1, // One query embedding
      });

      console.log(`[Chat API] Stream complete: ${outputTokens} output tokens, cost: ${formatCost(costBreakdown.total_cost)}`);

      // Extract video references from response
      const videoReferences = context.sources.map((source: any) => ({
        video_id: source.video_id,
        video_title: source.video_title,
        video_url: source.video_url,
        timestamps: source.timestamps,
      }));

      // Save assistant message
      await createMessage({
        session_id: sessionId,
        role: 'assistant',
        content: fullContent,
        video_references: videoReferences,
        token_count: inputTokens + outputTokens,
        model: CLAUDE_MODEL,
        metadata: {
          cost_usd: costBreakdown.total_cost,
          chunks_used: context.total_chunks,
        },
      });

      // Update session timestamp
      await touchSession(sessionId);

      // Track cost in usage metrics (if creator ID provided)
      if (creatorId) {
        await trackCostInDatabase(creatorId, costBreakdown);
      }

      // Generate session title if this is the first message
      const supabase = getServiceSupabase();
      const { data: session } = await supabase
        .from('chat_sessions')
        .select('title')
        .eq('id', sessionId)
        .single();

      if (!(session as any)?.title) {
        await generateAndSetTitle(sessionId, userMessage);
      }

      // Send final metadata
      yield {
        type: 'done' as const,
        usage: {
          inputTokens: inputTokens,
          outputTokens: outputTokens,
        },
        cost: costBreakdown,
        videoReferences: videoReferences,
      };
    } catch (error) {
      console.error('[Chat API] Streaming error:', error);
      yield {
        type: 'error' as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  const sseStream = createSSEStream(streamGenerator());
  return createStreamingResponse(sseStream);
}

/**
 * Handle non-streaming response
 */
async function handleNonStreamingResponse(
  sessionId: string,
  userMessage: string,
  systemPrompt: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
  searchResults: any[],
  context: any,
  inputTokens: number,
  creatorId: string
): Promise<Response> {
  // Generate response
  const response = await getAnthropicClient().messages.create({
    model: CLAUDE_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    temperature: 0.7,
    system: systemPrompt,
    messages: [
      ...conversationHistory,
      { role: 'user', content: userMessage },
    ],
  });

  // Extract text content
  const content = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as { type: 'text'; text: string }).text)
    .join('\n');

  const outputTokens = response.usage.output_tokens;

  // Calculate cost
  const costBreakdown = calculateCompleteCost({
    model: CLAUDE_MODEL,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    embedding_queries: 1,
  });

  console.log(`[Chat API] Response complete: ${outputTokens} output tokens, cost: ${formatCost(costBreakdown.total_cost)}`);

  // Extract video references
  const videoReferences = context.sources.map((source: any) => {
    const firstTimestamp = source.timestamps[0];
    return {
      video_id: source.video_id,
      video_title: source.video_title,
      video_thumbnail: source.video_thumbnail,
      timestamp: firstTimestamp.start,
      timestamp_formatted: formatTimestamp(firstTimestamp.start),
      chunk_text: searchResults.find(r => r.video_id === source.video_id)?.chunk_text.substring(0, 150) || '',
      relevance_score: searchResults.find(r => r.video_id === source.video_id)?.rank_score || 0,
    };
  });

  // Save assistant message
  await createMessage({
    session_id: sessionId,
    role: 'assistant',
    content: content,
    video_references: videoReferences,
    token_count: inputTokens + outputTokens,
    model: CLAUDE_MODEL,
    metadata: {
      cost_usd: costBreakdown.total_cost,
      chunks_used: context.total_chunks,
    },
  });

  // Update session timestamp
  await touchSession(sessionId);

  // Track cost in database
  if (creatorId) {
    await trackCostInDatabase(creatorId, costBreakdown);
  }

  // Generate session title if this is the first message
  const supabase = getServiceSupabase();
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('title')
    .eq('id', sessionId)
    .single();

  if (!(session as any)?.title) {
    await generateAndSetTitle(sessionId, userMessage);
  }

  const responseData: ChatResponse = {
    content,
    sessionId,
    videoReferences,
    usage: {
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      embedding_queries: 1,
      total_tokens: inputTokens + outputTokens,
      cost_breakdown: costBreakdown,
      cost_formatted: formatCost(costBreakdown.total_cost),
    },
    cached: false,
  };

  return Response.json(responseData);
}

/**
 * Track cost in database (usage_metrics table)
 */
async function trackCostInDatabase(creatorId: string, costBreakdown: CostBreakdown): Promise<void> {
  const supabase = getServiceSupabase();
  const today = new Date().toISOString().split('T')[0]!;

  try {
    // Check if entry exists for today
    const { data: existing } = await supabase
      .from('usage_metrics')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('date', today)
      .single();

    if (existing) {
      // Update existing entry
      await (supabase as any)
        .from('usage_metrics')
        .update({
          ai_credits_used: (existing as any).ai_credits_used + 1,
          chat_messages_sent: (existing as any).chat_messages_sent + 1,
          metadata: {
            ...(existing as any).metadata,
            total_input_tokens: ((existing as any).metadata?.total_input_tokens || 0) + costBreakdown.input_tokens,
            total_output_tokens: ((existing as any).metadata?.total_output_tokens || 0) + costBreakdown.output_tokens,
            total_ai_cost_usd: ((existing as any).metadata?.total_ai_cost_usd || 0) + costBreakdown.total_cost,
          },
        })
        .eq('creator_id', creatorId)
        .eq('date', today);
    } else {
      // Create new entry
      await (supabase as any).from('usage_metrics').insert({
        creator_id: creatorId,
        date: today,
        ai_credits_used: 1,
        chat_messages_sent: 1,
        metadata: {
          total_input_tokens: costBreakdown.input_tokens,
          total_output_tokens: costBreakdown.output_tokens,
          total_ai_cost_usd: costBreakdown.total_cost,
          model: CLAUDE_MODEL,
        },
      });
    }

    console.log(`[Cost Tracking] Tracked ${formatCost(costBreakdown.total_cost)} for creator ${creatorId}`);
  } catch (error) {
    console.error('[Cost Tracking] Failed to track cost:', error);
    // Don't throw - cost tracking failure shouldn't break the app
  }
}

/**
 * Format timestamp as MM:SS
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * GET /api/chat?sessionId=xxx
 * Get chat history for a session
 */
export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    if (!sessionId) {
      return Response.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get session with messages
    const session = await getSession(sessionId, true);

    if (!session) {
      return Response.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    return Response.json(session);
  } catch (error) {
    console.error('[Chat API] Error fetching history:', error);

    return Response.json(
      {
        error: 'Failed to fetch chat history',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
