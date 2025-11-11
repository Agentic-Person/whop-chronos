/**
 * Landing Page Transcript Processing Script
 *
 * Processes the demo video transcript for the landing page interactive chat:
 * 1. Reads transcript from data/landing-page/demo-video-transcript.txt
 * 2. Chunks into searchable segments with timestamps
 * 3. Generates embeddings via OpenAI
 * 4. Stores in data/landing-page/processed-chunks.json
 * 5. Extracts chapters to data/landing-page/chapters.json
 */

import fs from 'fs/promises';
import path from 'path';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
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

interface Chapter {
  title: string;
  start: string;
  end: string;
  startSeconds: number;
  summary: string;
}

const CHUNK_SIZE = 500; // words per chunk
const OVERLAP = 50; // word overlap between chunks

/**
 * Parse timestamp formats: [00:00:15], (0:15), 00:00:15, etc.
 */
function parseTimestamp(timestamp: string): number | null {
  // Remove brackets/parentheses
  const cleaned = timestamp.replace(/[\[\]()]/g, '').trim();

  // Match HH:MM:SS or MM:SS or SS
  const match = cleaned.match(/(?:(\d+):)?(\d+):(\d+)|(\d+)/);
  if (!match) return null;

  if (match[4]) {
    // Just seconds
    return parseInt(match[4], 10);
  }

  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = parseInt(match[2], 10);
  const seconds = parseInt(match[3], 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Split transcript into timestamped segments
 */
function parseTranscript(transcriptText: string): Array<{ text: string; timestamp?: number }> {
  const lines = transcriptText.split('\n');
  const segments: Array<{ text: string; timestamp?: number }> = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Check if line starts with timestamp
    const timestampMatch = line.match(/^[\[\(]?(\d+:?\d*:?\d+)[\]\)]?\s+(.+)$/);

    if (timestampMatch) {
      const timestamp = parseTimestamp(timestampMatch[1]);
      const text = timestampMatch[2].trim();
      if (text) {
        segments.push({ text, timestamp: timestamp || undefined });
      }
    } else {
      // No timestamp, add as plain text
      segments.push({ text: line.trim() });
    }
  }

  return segments;
}

/**
 * Chunk segments into searchable pieces
 */
function createChunks(segments: Array<{ text: string; timestamp?: number }>): Array<{
  text: string;
  startTime?: number;
  endTime?: number;
}> {
  const chunks: Array<{ text: string; startTime?: number; endTime?: number }> = [];
  let currentChunk: string[] = [];
  let chunkStartTime: number | undefined;
  let chunkEndTime: number | undefined;
  let wordCount = 0;

  for (const segment of segments) {
    const words = segment.text.split(/\s+/);

    // Start new chunk
    if (wordCount === 0 && segment.timestamp !== undefined) {
      chunkStartTime = segment.timestamp;
    }

    currentChunk.push(segment.text);
    wordCount += words.length;

    if (segment.timestamp !== undefined) {
      chunkEndTime = segment.timestamp;
    }

    // Chunk is full
    if (wordCount >= CHUNK_SIZE) {
      chunks.push({
        text: currentChunk.join(' '),
        startTime: chunkStartTime,
        endTime: chunkEndTime,
      });

      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-2).join(' ');
      currentChunk = [overlapText];
      wordCount = overlapText.split(/\s+/).length;
      chunkStartTime = chunkEndTime;
    }
  }

  // Add final chunk
  if (currentChunk.length > 0) {
    chunks.push({
      text: currentChunk.join(' '),
      startTime: chunkStartTime,
      endTime: chunkEndTime,
    });
  }

  return chunks;
}

/**
 * Generate embedding for text using OpenAI
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

/**
 * Use Claude to extract chapters from transcript
 */
async function extractChapters(transcriptText: string): Promise<Chapter[]> {
  console.log('Extracting chapters using Claude...');

  const Anthropic = await import('@anthropic-ai/sdk');
  const anthropic = new Anthropic.default({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `Analyze this video transcript and extract 5-6 logical chapters with timestamps that span the ENTIRE video.

IMPORTANT: The chapters must cover the complete video from start to finish. The last chapter should end at the actual end time of the video, not partway through.

For each chapter provide:
1. A clear, concise title (3-6 words)
2. Start timestamp
3. End timestamp (must be accurate - last chapter goes to video end)
4. A 1-2 sentence summary

Return as JSON array with format:
[
  {
    "title": "Chapter Title",
    "start": "0:00",
    "end": "3:45",
    "summary": "Brief description of what's covered"
  }
]

Full Transcript:
${transcriptText.slice(0, 50000)}

Return ONLY valid JSON, no other text.`;

  const response = await anthropic.messages.create({
    model: 'claude-3-5-haiku-20241022',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  // Extract JSON from response
  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error('Could not extract JSON from Claude response');
  }

  const chaptersData = JSON.parse(jsonMatch[0]);

  // Convert to Chapter format
  return chaptersData.map((ch: any) => ({
    title: ch.title,
    start: ch.start,
    end: ch.end,
    startSeconds: parseTimestamp(ch.start) || 0,
    summary: ch.summary,
  }));
}

/**
 * Main processing function
 */
async function processTranscript() {
  console.log('🎬 Processing landing page demo transcript...\n');

  const dataDir = path.join(process.cwd(), 'data', 'landing-page');
  const transcriptPath = path.join(dataDir, 'demo-video-transcript.txt');
  const chunksPath = path.join(dataDir, 'processed-chunks.json');
  const chaptersPath = path.join(dataDir, 'chapters.json');

  // 1. Read transcript
  console.log('📖 Reading transcript...');
  let transcriptText: string;
  try {
    transcriptText = await fs.readFile(transcriptPath, 'utf-8');
  } catch (error) {
    console.error('❌ Error reading transcript file:', error);
    console.log('\n💡 Make sure to place your transcript in:', transcriptPath);
    process.exit(1);
  }

  if (transcriptText.includes('PASTE YOUR TRANSCRIPT HERE')) {
    console.error('❌ Placeholder transcript detected.');
    console.log('\n💡 Please replace the content in:', transcriptPath);
    process.exit(1);
  }

  console.log(`✅ Read ${transcriptText.length} characters\n`);

  // 2. Parse and chunk
  console.log('✂️  Parsing and chunking transcript...');
  const segments = parseTranscript(transcriptText);
  const chunks = createChunks(segments);
  console.log(`✅ Created ${chunks.length} chunks\n`);

  // 3. Generate embeddings
  console.log('🧠 Generating embeddings (this may take a minute)...');
  const processedChunks: TranscriptChunk[] = [];

  let processed = 0;
  for (const chunk of chunks) {
    const embedding = await generateEmbedding(chunk.text);

    processedChunks.push({
      id: `chunk-${processed}`,
      text: chunk.text,
      startTime: chunk.startTime !== undefined ? formatTimestamp(chunk.startTime) : undefined,
      endTime: chunk.endTime !== undefined ? formatTimestamp(chunk.endTime) : undefined,
      startSeconds: chunk.startTime,
      endSeconds: chunk.endTime,
      embedding,
    });

    processed++;
    if (processed % 5 === 0) {
      console.log(`   Processed ${processed}/${chunks.length} chunks...`);
    }
  }
  console.log(`✅ Generated embeddings for ${processedChunks.length} chunks\n`);

  // 4. Extract chapters
  const chapters = await extractChapters(transcriptText);
  console.log(`✅ Extracted ${chapters.length} chapters\n`);

  // 5. Save processed data
  console.log('💾 Saving processed data...');
  await fs.writeFile(chunksPath, JSON.stringify(processedChunks, null, 2));
  await fs.writeFile(chaptersPath, JSON.stringify(chapters, null, 2));
  console.log(`✅ Saved to ${chunksPath}`);
  console.log(`✅ Saved to ${chaptersPath}\n`);

  // 6. Summary
  console.log('📊 Summary:');
  console.log(`   - Transcript: ${transcriptText.length} characters`);
  console.log(`   - Chunks: ${processedChunks.length}`);
  console.log(`   - Chapters: ${chapters.length}`);
  console.log(`   - Embeddings: ${processedChunks.length} vectors (${processedChunks[0]?.embedding.length || 0} dimensions)`);
  console.log('\n✨ Processing complete! The interactive demo is ready to use.\n');
}

// Run if called directly
if (require.main === module) {
  processTranscript().catch((error) => {
    console.error('❌ Error processing transcript:', error);
    process.exit(1);
  });
}

export { processTranscript };
