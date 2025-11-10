/**
 * RAG Context Builder for Claude API
 *
 * Formats search results into optimized context for LLM prompts:
 * - Token-aware context construction
 * - Citation formatting with timestamps
 * - Deduplication of redundant information
 * - Source attribution and metadata
 */

import type { EnhancedSearchResult } from './search';
import { formatTimestamp } from '@/lib/video/vector-search';

export interface ContextBuilderOptions {
  max_tokens?: number; // Default: 8000 (leave room for system prompt + response)
  include_metadata?: boolean; // Default: true
  include_timestamps?: boolean; // Default: true
  include_video_titles?: boolean; // Default: true
  format?: 'markdown' | 'xml' | 'plain'; // Default: 'markdown'
  deduplicate_content?: boolean; // Default: true
  show_rank_scores?: boolean; // Default: false (for debugging)
}

export interface FormattedContext {
  context: string; // Formatted context ready for LLM
  sources: VideoSource[]; // Source attribution for citations
  total_chunks: number; // Number of chunks included
  total_tokens: number; // Approximate token count
  truncated: boolean; // Whether context was truncated to fit token limit
}

export interface VideoSource {
  video_id: string;
  video_title: string;
  video_url?: string;
  chunks_used: number;
  timestamps: { start: number; end: number; chunk_id: string }[];
}

const DEFAULT_OPTIONS: Required<ContextBuilderOptions> = {
  max_tokens: 8000,
  include_metadata: true,
  include_timestamps: true,
  include_video_titles: true,
  format: 'markdown',
  deduplicate_content: false,
  show_rank_scores: false,
};

/**
 * Estimate token count for text (rough approximation)
 * More accurate than character count, uses GPT tokenization heuristic
 */
export function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token for English text
  // More conservative: 3.5 to account for code, special chars
  return Math.ceil(text.length / 3.5);
}

/**
 * Deduplicate similar text content
 * Removes chunks that are very similar to already included ones
 */
function deduplicateContent(chunks: EnhancedSearchResult[]): EnhancedSearchResult[] {
  const unique: EnhancedSearchResult[] = [];
  const seenContent = new Set<string>();

  for (const chunk of chunks) {
    // Normalize text for comparison (lowercase, no extra whitespace)
    const normalized = chunk.chunk_text
      .toLowerCase()
      .replace(/\s+/g, ' ')
      .trim();

    // Create a fingerprint (first 100 chars)
    const fingerprint = normalized.substring(0, 100);

    if (!seenContent.has(fingerprint)) {
      unique.push(chunk);
      seenContent.add(fingerprint);
    }
  }

  return unique;
}

/**
 * Format a single chunk for context
 */
function formatChunk(
  chunk: EnhancedSearchResult,
  index: number,
  options: Required<ContextBuilderOptions>
): string {
  const { format, include_timestamps, include_video_titles, show_rank_scores } = options;

  const title = include_video_titles ? (chunk.video_title || 'Unknown Video') : `Video ${chunk.video_id.substring(0, 8)}`;
  const timestamp = include_timestamps ? formatTimestamp(chunk.start_time_seconds) : null;
  const rankInfo = show_rank_scores ? ` (rank: ${chunk.rank_score.toFixed(3)})` : '';

  switch (format) {
    case 'markdown':
      return `### Source ${index + 1}: ${title}${timestamp ? ` @ ${timestamp}` : ''}${rankInfo}\n\n${chunk.chunk_text}\n`;

    case 'xml':
      return `<source id="${index + 1}" video="${title}"${timestamp ? ` timestamp="${timestamp}"` : ''}${rankInfo ? ` rank="${chunk.rank_score.toFixed(3)}"` : ''}>
${chunk.chunk_text}
</source>\n`;

    case 'plain':
      return `[Source ${index + 1}: ${title}${timestamp ? ` @ ${timestamp}` : ''}${rankInfo}]\n${chunk.chunk_text}\n\n`;

    default:
      return chunk.chunk_text;
  }
}

/**
 * Build structured context from search results
 *
 * @param results - Ranked search results
 * @param options - Context formatting options
 * @returns Formatted context with metadata
 */
export function buildContext(
  results: EnhancedSearchResult[],
  options: ContextBuilderOptions = {}
): FormattedContext {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (results.length === 0) {
    return {
      context: 'No relevant information found.',
      sources: [],
      total_chunks: 0,
      total_tokens: 0,
      truncated: false,
    };
  }

  // Deduplicate if requested
  const chunks = opts.deduplicate_content ? deduplicateContent(results) : results;

  // Build context incrementally, respecting token limit
  const contextParts: string[] = [];
  const sources = new Map<string, VideoSource>();
  let totalTokens = 0;
  let truncated = false;

  // Add header
  const header = opts.format === 'markdown'
    ? `# Relevant Video Content\n\nThe following sections contain information from video transcripts relevant to the user's question:\n\n`
    : opts.format === 'xml'
    ? `<context>\n<description>Relevant video content from transcripts</description>\n\n`
    : `RELEVANT VIDEO CONTENT:\n\n`;

  contextParts.push(header);
  totalTokens += estimateTokens(header);

  // Add chunks until we hit token limit
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const formattedChunk = formatChunk(chunk, i, opts);
    const chunkTokens = estimateTokens(formattedChunk);

    // Check if adding this chunk would exceed token limit
    if (totalTokens + chunkTokens > opts.max_tokens) {
      truncated = true;
      console.warn(`Context truncated at chunk ${i + 1}/${chunks.length} (token limit: ${opts.max_tokens})`);
      break;
    }

    contextParts.push(formattedChunk);
    totalTokens += chunkTokens;

    // Track source metadata
    const videoId = chunk.video_id;
    if (!sources.has(videoId)) {
      sources.set(videoId, {
        video_id: videoId,
        video_title: chunk.video_title || 'Unknown Video',
        video_url: chunk.metadata?.video_url,
        chunks_used: 0,
        timestamps: [],
      });
    }

    const source = sources.get(videoId)!;
    source.chunks_used++;
    source.timestamps.push({
      start: chunk.start_time_seconds,
      end: chunk.end_time_seconds,
      chunk_id: chunk.chunk_id,
    });
  }

  // Add footer
  const footer = opts.format === 'xml' ? '</context>\n' : '';
  if (footer) {
    contextParts.push(footer);
    totalTokens += estimateTokens(footer);
  }

  const context = contextParts.join('\n');

  return {
    context,
    sources: Array.from(sources.values()),
    total_chunks: contextParts.length - 1 - (footer ? 1 : 0), // Exclude header and footer
    total_tokens: totalTokens,
    truncated,
  };
}

/**
 * Build a citation reference string for a specific chunk
 * Used in LLM responses to cite sources
 */
export function buildCitation(
  chunk: EnhancedSearchResult,
  includeUrl = false
): string {
  const title = chunk.video_title || 'Unknown Video';
  const timestamp = formatTimestamp(chunk.start_time_seconds);

  if (includeUrl && chunk.metadata?.video_url) {
    const url = new URL(chunk.metadata.video_url);
    url.searchParams.set('t', Math.floor(chunk.start_time_seconds).toString());
    return `[${title} @ ${timestamp}](${url.toString()})`;
  }

  return `${title} @ ${timestamp}`;
}

/**
 * Extract citations from search results for JSON response
 * Returns structured citation data for frontend rendering
 */
export function extractCitations(results: EnhancedSearchResult[]): Array<{
  video_id: string;
  video_title: string;
  video_url?: string;
  timestamp: number;
  timestamp_formatted: string;
  chunk_text: string;
  relevance_score: number;
}> {
  return results.map(result => ({
    video_id: result.video_id,
    video_title: result.video_title || 'Unknown Video',
    video_url: result.metadata?.video_url,
    timestamp: result.start_time_seconds,
    timestamp_formatted: formatTimestamp(result.start_time_seconds),
    chunk_text: result.chunk_text.substring(0, 200) + '...', // Preview
    relevance_score: result.rank_score,
  }));
}

/**
 * Build system prompt with context for Claude API
 */
export function buildSystemPrompt(
  context: FormattedContext,
  customInstructions?: string
): string {
  const basePrompt = `You are an AI learning assistant helping students understand video course content.

You have access to transcripts from relevant video segments. When answering questions:
1. Use ONLY the information provided in the video transcripts below
2. Cite specific videos and timestamps when referencing information
3. If the answer isn't in the provided context, say so clearly
4. Be concise and helpful
5. Use markdown formatting for better readability

${customInstructions || ''}

---

${context.context}`;

  return basePrompt;
}

/**
 * Build a conversation context for multi-turn chat
 * Includes previous messages and new context
 */
export interface ConversationContext {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  newContext: FormattedContext;
}

export function buildConversationPrompt(
  conversation: ConversationContext,
  maxHistoryMessages = 5
): string {
  // Include last N messages for context
  const recentMessages = conversation.messages.slice(-maxHistoryMessages);

  const historySection = recentMessages.length > 0
    ? `\n## Recent Conversation\n\n${recentMessages.map(m => `**${m.role}:** ${m.content}`).join('\n\n')}\n\n---\n\n`
    : '';

  return `${conversation.newContext.context}${historySection}`;
}

/**
 * Optimize context for specific use cases
 */
export function optimizeContextForUseCase(
  results: EnhancedSearchResult[],
  useCase: 'quick-answer' | 'detailed-explanation' | 'troubleshooting'
): ContextBuilderOptions {
  switch (useCase) {
    case 'quick-answer':
      return {
        max_tokens: 4000,
        format: 'plain',
        include_timestamps: false,
        deduplicate_content: true,
      };

    case 'detailed-explanation':
      return {
        max_tokens: 12000,
        format: 'markdown',
        include_timestamps: true,
        include_metadata: true,
        deduplicate_content: false,
      };

    case 'troubleshooting':
      return {
        max_tokens: 8000,
        format: 'markdown',
        include_timestamps: true,
        show_rank_scores: true,
        deduplicate_content: false,
      };

    default:
      return DEFAULT_OPTIONS;
  }
}

/**
 * Get statistics about context construction
 */
export function getContextStats(context: FormattedContext): {
  average_tokens_per_chunk: number;
  unique_videos: number;
  token_utilization: number; // Percentage of max_tokens used
} {
  const uniqueVideos = new Set(context.sources.map(s => s.video_id)).size;
  const avgTokensPerChunk = context.total_chunks > 0
    ? context.total_tokens / context.total_chunks
    : 0;

  // Estimate token utilization (assuming 8000 max)
  const tokenUtilization = (context.total_tokens / 8000) * 100;

  return {
    average_tokens_per_chunk: avgTokensPerChunk,
    unique_videos: uniqueVideos,
    token_utilization: tokenUtilization,
  };
}
