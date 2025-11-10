/**
 * OpenAI Embedding Generator for Video Chunks
 *
 * Generates vector embeddings for text chunks using OpenAI's ada-002 model (1536 dimensions).
 * - Batch processing for efficiency
 * - Rate limiting to avoid API throttling
 * - Retry logic with exponential backoff
 * - Cost tracking per video
 */

import OpenAI from 'openai';
import type { TranscriptChunk } from './chunking';

export interface EmbeddingResult {
  chunk_id: string;
  chunk_index: number;
  embedding: number[];
  model: string;
  tokens_used: number;
}

export interface BatchEmbeddingResult {
  embeddings: EmbeddingResult[];
  total_tokens: number;
  total_cost_usd: number;
  model: string;
  processing_time_ms: number;
  chunks_processed: number;
}

export interface EmbeddingOptions {
  batch_size?: number; // Default: 20 (OpenAI recommends max 2048 per request, we use conservative 20)
  max_retries?: number; // Default: 3
  retry_delay_ms?: number; // Default: 1000 (will increase exponentially)
  model?: string; // Default: 'text-embedding-ada-002'
}

const DEFAULT_OPTIONS: Required<EmbeddingOptions> = {
  batch_size: 20,
  max_retries: 3,
  retry_delay_ms: 1000,
  model: 'text-embedding-ada-002',
};

// Pricing for text-embedding-ada-002 (as of 2024)
// $0.0001 per 1K tokens
const COST_PER_1K_TOKENS = 0.0001;

/**
 * Initialize OpenAI client
 */
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate cost based on token usage
 */
function calculateCost(tokens: number): number {
  return (tokens / 1000) * COST_PER_1K_TOKENS;
}

/**
 * Generate embedding for a single text chunk with retry logic
 */
async function generateSingleEmbedding(
  client: OpenAI,
  text: string,
  options: Required<EmbeddingOptions>,
  attempt = 1
): Promise<{ embedding: number[]; tokens: number }> {
  try {
    const response = await client.embeddings.create({
      model: options.model,
      input: text,
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No embedding returned from OpenAI');
    }

    return {
      embedding: response.data[0].embedding,
      tokens: response.usage.total_tokens,
    };
  } catch (error) {
    if (attempt >= options.max_retries) {
      throw new Error(
        `Failed to generate embedding after ${options.max_retries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

    // Exponential backoff: 1s, 2s, 4s, etc.
    const delay = options.retry_delay_ms * Math.pow(2, attempt - 1);
    console.warn(
      `Embedding generation failed (attempt ${attempt}/${options.max_retries}), retrying in ${delay}ms...`,
      error
    );

    await sleep(delay);
    return generateSingleEmbedding(client, text, options, attempt + 1);
  }
}

/**
 * Generate embeddings for a batch of text chunks
 */
async function generateBatchEmbeddings(
  client: OpenAI,
  texts: string[],
  options: Required<EmbeddingOptions>
): Promise<{ embeddings: number[][]; total_tokens: number }> {
  try {
    const response = await client.embeddings.create({
      model: options.model,
      input: texts,
    });

    if (!response.data || response.data.length !== texts.length) {
      throw new Error(
        `Expected ${texts.length} embeddings but got ${response.data?.length || 0}`
      );
    }

    // Sort by index to ensure correct order
    const sortedData = response.data.sort((a, b) => a.index - b.index);

    return {
      embeddings: sortedData.map(item => item.embedding),
      total_tokens: response.usage.total_tokens,
    };
  } catch (error) {
    // If batch fails, fall back to individual processing
    console.warn('Batch embedding failed, falling back to individual processing:', error);

    let totalTokens = 0;
    const embeddings: number[][] = [];

    for (const text of texts) {
      const result = await generateSingleEmbedding(client, text, options);
      embeddings.push(result.embedding);
      totalTokens += result.tokens;

      // Small delay between individual requests to avoid rate limiting
      await sleep(100);
    }

    return { embeddings, total_tokens: totalTokens };
  }
}

/**
 * Generate embeddings for multiple chunks with batch processing
 *
 * @param chunks - Array of transcript chunks to embed
 * @param options - Embedding generation options
 * @returns Batch embedding result with embeddings, costs, and metadata
 */
export async function generateEmbeddings(
  chunks: TranscriptChunk[],
  options: EmbeddingOptions = {}
): Promise<BatchEmbeddingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const client = getOpenAIClient();
  const startTime = Date.now();

  const allEmbeddings: EmbeddingResult[] = [];
  let totalTokens = 0;

  // Process chunks in batches
  for (let i = 0; i < chunks.length; i += opts.batch_size) {
    const batch = chunks.slice(i, i + opts.batch_size);
    const texts = batch.map(chunk => chunk.chunk_text);

    console.log(
      `Processing embedding batch ${Math.floor(i / opts.batch_size) + 1}/${Math.ceil(chunks.length / opts.batch_size)} (${batch.length} chunks)`
    );

    const { embeddings, total_tokens } = await generateBatchEmbeddings(
      client,
      texts,
      opts
    );

    totalTokens += total_tokens;

    // Map embeddings to results
    for (let j = 0; j < batch.length; j++) {
      allEmbeddings.push({
        chunk_id: `chunk_${batch[j].chunk_index}`,
        chunk_index: batch[j].chunk_index,
        embedding: embeddings[j],
        model: opts.model,
        tokens_used: Math.ceil(total_tokens / batch.length), // Approximate tokens per chunk
      });
    }

    // Rate limiting: small delay between batches
    if (i + opts.batch_size < chunks.length) {
      await sleep(200);
    }
  }

  const processingTime = Date.now() - startTime;
  const totalCost = calculateCost(totalTokens);

  console.log(
    `Generated ${allEmbeddings.length} embeddings in ${processingTime}ms (${totalTokens} tokens, $${totalCost.toFixed(4)})`
  );

  return {
    embeddings: allEmbeddings,
    total_tokens: totalTokens,
    total_cost_usd: totalCost,
    model: opts.model,
    processing_time_ms: processingTime,
    chunks_processed: chunks.length,
  };
}

/**
 * Generate embedding for a single query text (for search)
 */
export async function generateQueryEmbedding(
  query: string,
  options: Partial<EmbeddingOptions> = {}
): Promise<number[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const client = getOpenAIClient();

  const result = await generateSingleEmbedding(client, query, opts);
  return result.embedding;
}

/**
 * Validate embedding dimensions
 */
export function validateEmbedding(embedding: number[]): boolean {
  // text-embedding-ada-002 produces 1536-dimensional vectors
  const expectedDimensions = 1536;

  if (!Array.isArray(embedding)) {
    return false;
  }

  if (embedding.length !== expectedDimensions) {
    console.warn(
      `Invalid embedding dimensions: expected ${expectedDimensions}, got ${embedding.length}`
    );
    return false;
  }

  // Check if all values are numbers
  if (!embedding.every(val => typeof val === 'number' && !Number.isNaN(val))) {
    console.warn('Embedding contains non-numeric or NaN values');
    return false;
  }

  return true;
}

/**
 * Estimate cost for embedding a given amount of text
 */
export function estimateEmbeddingCost(textLength: number): {
  estimated_tokens: number;
  estimated_cost_usd: number;
} {
  // Rough estimate: 1 token ≈ 4 characters for English text
  const estimatedTokens = Math.ceil(textLength / 4);
  const estimatedCost = calculateCost(estimatedTokens);

  return {
    estimated_tokens: estimatedTokens,
    estimated_cost_usd: estimatedCost,
  };
}

/**
 * Batch embeddings with rate limiting for large-scale processing
 */
export async function batchEmbeddingsWithRateLimit(
  chunks: TranscriptChunk[],
  options: EmbeddingOptions & {
    requests_per_minute?: number; // Default: 60 (conservative for tier 1)
  } = {}
): Promise<BatchEmbeddingResult> {
  const requestsPerMinute = options.requests_per_minute || 60;
  const delayBetweenBatches = (60 * 1000) / requestsPerMinute; // ms per batch

  const opts = { ...DEFAULT_OPTIONS, ...options };
  const client = getOpenAIClient();
  const startTime = Date.now();

  const allEmbeddings: EmbeddingResult[] = [];
  let totalTokens = 0;

  // Process chunks in batches with rate limiting
  for (let i = 0; i < chunks.length; i += opts.batch_size) {
    const batch = chunks.slice(i, i + opts.batch_size);
    const texts = batch.map(chunk => chunk.chunk_text);

    const batchStartTime = Date.now();

    console.log(
      `[Rate Limited] Processing embedding batch ${Math.floor(i / opts.batch_size) + 1}/${Math.ceil(chunks.length / opts.batch_size)} (${batch.length} chunks)`
    );

    const { embeddings, total_tokens } = await generateBatchEmbeddings(
      client,
      texts,
      opts
    );

    totalTokens += total_tokens;

    // Map embeddings to results
    for (let j = 0; j < batch.length; j++) {
      allEmbeddings.push({
        chunk_id: `chunk_${batch[j].chunk_index}`,
        chunk_index: batch[j].chunk_index,
        embedding: embeddings[j],
        model: opts.model,
        tokens_used: Math.ceil(total_tokens / batch.length),
      });
    }

    // Rate limiting: ensure we don't exceed requests per minute
    const batchProcessingTime = Date.now() - batchStartTime;
    const remainingDelay = delayBetweenBatches - batchProcessingTime;

    if (i + opts.batch_size < chunks.length && remainingDelay > 0) {
      console.log(`Rate limiting: waiting ${remainingDelay}ms before next batch`);
      await sleep(remainingDelay);
    }
  }

  const processingTime = Date.now() - startTime;
  const totalCost = calculateCost(totalTokens);

  console.log(
    `[Rate Limited] Generated ${allEmbeddings.length} embeddings in ${processingTime}ms (${totalTokens} tokens, $${totalCost.toFixed(4)})`
  );

  return {
    embeddings: allEmbeddings,
    total_tokens: totalTokens,
    total_cost_usd: totalCost,
    model: opts.model,
    processing_time_ms: processingTime,
    chunks_processed: chunks.length,
  };
}
