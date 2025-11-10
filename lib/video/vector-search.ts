/**
 * Vector Search using pgvector for RAG
 *
 * Search video chunks using cosine similarity with query embeddings.
 * - Uses Supabase's pgvector extension
 * - Returns top-k most relevant chunks
 * - Includes video metadata for citations
 * - Supports filtering by video IDs
 */

import { createClient } from '@/lib/db/client';
import { generateQueryEmbedding } from './embeddings';
import type { Database } from '@/lib/db/types';

export interface VectorSearchResult {
  chunk_id: string;
  video_id: string;
  video_title?: string;
  chunk_text: string;
  start_time_seconds: number;
  end_time_seconds: number;
  similarity: number;
  metadata?: {
    video_url?: string;
    video_thumbnail?: string;
    creator_id?: string;
  };
}

export interface VectorSearchOptions {
  match_count?: number; // Default: 5
  similarity_threshold?: number; // Default: 0.7 (0-1 scale, 1 = identical)
  filter_video_ids?: string[] | null; // Restrict search to specific videos
  include_video_metadata?: boolean; // Default: true
}

const DEFAULT_OPTIONS: Required<VectorSearchOptions> = {
  match_count: 5,
  similarity_threshold: 0.7,
  filter_video_ids: null,
  include_video_metadata: true,
};

/**
 * Search video chunks using semantic similarity
 *
 * @param query - User's search query text
 * @param options - Search configuration options
 * @returns Array of matching chunks sorted by relevance
 */
export async function searchVideoChunks(
  query: string,
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Generate embedding for the query
  console.log(`Generating embedding for query: "${query.substring(0, 50)}..."`);
  const queryEmbedding = await generateQueryEmbedding(query);

  // Use Supabase client to call the search function
  const supabase = createClient();

  const { data, error } = await supabase.rpc('search_video_chunks', {
    query_embedding: queryEmbedding,
    match_count: opts.match_count,
    similarity_threshold: opts.similarity_threshold,
    filter_video_ids: opts.filter_video_ids,
  });

  if (error) {
    console.error('Vector search error:', error);
    throw new Error(`Vector search failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    console.log('No matching chunks found');
    return [];
  }

  console.log(`Found ${data.length} matching chunks`);

  // Enrich results with video metadata if requested
  if (opts.include_video_metadata) {
    const videoIds = [...new Set(data.map(chunk => chunk.video_id))];
    const { data: videos, error: videoError } = await supabase
      .from('videos')
      .select('id, title, url, thumbnail_url, creator_id')
      .in('id', videoIds);

    if (videoError) {
      console.warn('Failed to fetch video metadata:', videoError);
    }

    // Map video metadata to chunks
    const videoMap = new Map(
      videos?.map(v => [v.id, v]) || []
    );

    return data.map(chunk => ({
      chunk_id: chunk.chunk_id,
      video_id: chunk.video_id,
      video_title: videoMap.get(chunk.video_id)?.title,
      chunk_text: chunk.chunk_text,
      start_time_seconds: chunk.start_time_seconds,
      end_time_seconds: chunk.end_time_seconds,
      similarity: chunk.similarity,
      metadata: {
        video_url: videoMap.get(chunk.video_id)?.url || undefined,
        video_thumbnail: videoMap.get(chunk.video_id)?.thumbnail_url || undefined,
        creator_id: videoMap.get(chunk.video_id)?.creator_id,
      },
    }));
  }

  // Return without video metadata
  return data.map(chunk => ({
    chunk_id: chunk.chunk_id,
    video_id: chunk.video_id,
    chunk_text: chunk.chunk_text,
    start_time_seconds: chunk.start_time_seconds,
    end_time_seconds: chunk.end_time_seconds,
    similarity: chunk.similarity,
  }));
}

/**
 * Search within a specific video's chunks
 */
export async function searchWithinVideo(
  videoId: string,
  query: string,
  options: Omit<VectorSearchOptions, 'filter_video_ids'> = {}
): Promise<VectorSearchResult[]> {
  return searchVideoChunks(query, {
    ...options,
    filter_video_ids: [videoId],
  });
}

/**
 * Search across multiple specific videos
 */
export async function searchAcrossVideos(
  videoIds: string[],
  query: string,
  options: Omit<VectorSearchOptions, 'filter_video_ids'> = {}
): Promise<VectorSearchResult[]> {
  return searchVideoChunks(query, {
    ...options,
    filter_video_ids: videoIds,
  });
}

/**
 * Get related chunks to a specific chunk (find similar content)
 */
export async function findRelatedChunks(
  chunkId: string,
  options: VectorSearchOptions = {}
): Promise<VectorSearchResult[]> {
  const supabase = createClient();

  // Get the chunk's embedding
  const { data: chunk, error: chunkError } = await supabase
    .from('video_chunks')
    .select('embedding, chunk_text')
    .eq('id', chunkId)
    .single();

  if (chunkError || !chunk || !chunk.embedding) {
    throw new Error(`Failed to get chunk embedding: ${chunkError?.message || 'Chunk not found'}`);
  }

  // Search using the chunk's embedding
  const opts = { ...DEFAULT_OPTIONS, ...options };

  const { data, error } = await supabase.rpc('search_video_chunks', {
    query_embedding: chunk.embedding,
    match_count: opts.match_count + 1, // +1 to exclude the original chunk
    similarity_threshold: opts.similarity_threshold,
    filter_video_ids: opts.filter_video_ids,
  });

  if (error) {
    throw new Error(`Vector search failed: ${error.message}`);
  }

  // Filter out the original chunk
  const relatedChunks = (data || []).filter(c => c.chunk_id !== chunkId);

  // Return top match_count results
  return relatedChunks.slice(0, opts.match_count).map(chunk => ({
    chunk_id: chunk.chunk_id,
    video_id: chunk.video_id,
    chunk_text: chunk.chunk_text,
    start_time_seconds: chunk.start_time_seconds,
    end_time_seconds: chunk.end_time_seconds,
    similarity: chunk.similarity,
  }));
}

/**
 * Format timestamp for display (MM:SS or HH:MM:SS)
 */
export function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Build video URL with timestamp
 */
export function buildVideoUrlWithTimestamp(
  videoUrl: string,
  startTimeSeconds: number
): string {
  const url = new URL(videoUrl);

  // Handle YouTube URLs
  if (url.hostname.includes('youtube.com') || url.hostname.includes('youtu.be')) {
    url.searchParams.set('t', Math.floor(startTimeSeconds).toString());
    return url.toString();
  }

  // Handle Vimeo URLs
  if (url.hostname.includes('vimeo.com')) {
    url.hash = `t=${Math.floor(startTimeSeconds)}s`;
    return url.toString();
  }

  // Generic approach: add #t= for HTML5 video players
  url.hash = `t=${Math.floor(startTimeSeconds)}`;
  return url.toString();
}

/**
 * Format search result for RAG context
 */
export function formatResultForRAG(result: VectorSearchResult): string {
  const timestamp = formatTimestamp(result.start_time_seconds);
  const videoTitle = result.video_title || 'Unknown Video';

  return `[${videoTitle} @ ${timestamp}]\n${result.chunk_text}`;
}

/**
 * Build RAG context from multiple search results
 */
export function buildRAGContext(
  results: VectorSearchResult[],
  maxChunks = 5
): string {
  const topResults = results.slice(0, maxChunks);

  const context = topResults
    .map((result, index) => {
      const header = `## Source ${index + 1}: ${result.video_title || 'Unknown Video'} (${formatTimestamp(result.start_time_seconds)})`;
      return `${header}\n${result.chunk_text}`;
    })
    .join('\n\n---\n\n');

  return context;
}

/**
 * Get search statistics and quality metrics
 */
export async function getSearchStats(): Promise<{
  total_chunks: number;
  chunks_with_embeddings: number;
  embedding_coverage_percent: number;
}> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('vector_index_stats')
    .select('*')
    .single();

  if (error) {
    console.error('Failed to get search stats:', error);
    return {
      total_chunks: 0,
      chunks_with_embeddings: 0,
      embedding_coverage_percent: 0,
    };
  }

  return {
    total_chunks: data.total_chunks || 0,
    chunks_with_embeddings: data.chunks_with_embeddings || 0,
    embedding_coverage_percent: data.embedding_coverage_percent || 0,
  };
}

/**
 * Test vector search functionality
 */
export async function testVectorSearch(
  query = 'How do I get started?'
): Promise<{
  success: boolean;
  results_count: number;
  results: VectorSearchResult[];
  error?: string;
}> {
  try {
    const results = await searchVideoChunks(query, {
      match_count: 3,
      similarity_threshold: 0.5,
    });

    return {
      success: true,
      results_count: results.length,
      results,
    };
  } catch (error) {
    return {
      success: false,
      results_count: 0,
      results: [],
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
