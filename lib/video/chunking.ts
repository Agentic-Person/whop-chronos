/**
 * Text Chunking Algorithm for Transcripts
 *
 * Converts video transcripts into optimally-sized chunks for vector embeddings.
 * - Target: 500-1000 words per chunk
 * - Overlap: 100 words between chunks for context continuity
 * - Preserves sentence boundaries to maintain semantic coherence
 * - Includes timestamp metadata for video navigation
 */

export interface TranscriptSegment {
  text: string;
  start_time_seconds: number;
  end_time_seconds: number;
}

export interface TranscriptChunk {
  chunk_index: number;
  chunk_text: string;
  start_time_seconds: number;
  end_time_seconds: number;
  word_count: number;
  metadata: {
    has_overlap: boolean;
    overlap_word_count?: number;
    original_segment_count: number;
  };
}

export interface ChunkingOptions {
  min_words?: number; // Default: 500
  max_words?: number; // Default: 1000
  overlap_words?: number; // Default: 100
  preserve_sentences?: boolean; // Default: true
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  min_words: 500,
  max_words: 1000,
  overlap_words: 100,
  preserve_sentences: true,
};

/**
 * Split text into sentences while preserving sentence boundaries
 */
function splitIntoSentences(text: string): string[] {
  // Handle common abbreviations that shouldn't trigger sentence breaks
  const protectedText = text
    .replace(/Dr\./g, 'Dr~')
    .replace(/Mr\./g, 'Mr~')
    .replace(/Mrs\./g, 'Mrs~')
    .replace(/Ms\./g, 'Ms~')
    .replace(/Prof\./g, 'Prof~')
    .replace(/Sr\./g, 'Sr~')
    .replace(/Jr\./g, 'Jr~')
    .replace(/vs\./g, 'vs~')
    .replace(/etc\./g, 'etc~')
    .replace(/e\.g\./g, 'e~g~')
    .replace(/i\.e\./g, 'i~e~');

  // Split on sentence-ending punctuation followed by whitespace
  const sentences = protectedText
    .split(/([.!?]+\s+)/)
    .filter(s => s.trim().length > 0);

  // Restore protected abbreviations and recombine
  const result: string[] = [];
  let current = '';

  for (const segment of sentences) {
    current += segment;
    if (/[.!?]+\s+$/.test(segment)) {
      // This is a sentence ending - push and reset
      result.push(
        current
          .replace(/~/g, '.')
          .trim()
      );
      current = '';
    }
  }

  // Add any remaining text
  if (current.trim().length > 0) {
    result.push(current.replace(/~/g, '.').trim());
  }

  return result.filter(s => s.length > 0);
}

/**
 * Count words in a text string
 */
function countWords(text: string): number {
  return text.trim().split(/\s+/).length;
}

/**
 * Get the last N words from a text string
 */
function getLastNWords(text: string, n: number): string {
  const words = text.trim().split(/\s+/);
  return words.slice(-n).join(' ');
}

/**
 * Chunk a transcript into optimally-sized segments for embedding
 *
 * @param transcript - Full transcript text or array of timed segments
 * @param options - Chunking configuration options
 * @returns Array of chunks ready for embedding
 */
export function chunkTranscript(
  transcript: string | TranscriptSegment[],
  options: ChunkingOptions = {}
): TranscriptChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: TranscriptChunk[] = [];

  // Convert string transcript to segments if needed
  let segments: TranscriptSegment[];
  if (typeof transcript === 'string') {
    segments = [
      {
        text: transcript,
        start_time_seconds: 0,
        end_time_seconds: 0, // Will be calculated based on word count
      },
    ];
  } else {
    segments = transcript;
  }

  // Process segments into sentences
  let allSentences: Array<{
    text: string;
    start_time: number;
    end_time: number;
  }> = [];

  for (const segment of segments) {
    if (opts.preserve_sentences) {
      const sentences = splitIntoSentences(segment.text);
      const segmentDuration = segment.end_time_seconds - segment.start_time_seconds;
      const totalWords = countWords(segment.text);

      let currentTime = segment.start_time_seconds;
      for (const sentence of sentences) {
        const wordCount = countWords(sentence);
        const timePerWord = segmentDuration / totalWords;
        const sentenceDuration = wordCount * timePerWord;

        allSentences.push({
          text: sentence,
          start_time: currentTime,
          end_time: currentTime + sentenceDuration,
        });

        currentTime += sentenceDuration;
      }
    } else {
      allSentences.push({
        text: segment.text,
        start_time: segment.start_time_seconds,
        end_time: segment.end_time_seconds,
      });
    }
  }

  // Build chunks from sentences
  let chunkIndex = 0;
  let currentChunk: {
    sentences: typeof allSentences;
    text: string;
    wordCount: number;
  } = {
    sentences: [],
    text: '',
    wordCount: 0,
  };

  let previousChunkText = '';

  for (let i = 0; i < allSentences.length; i++) {
    const sentence = allSentences[i];
    if (!sentence) continue;
    const sentenceWords = countWords(sentence.text);

    // Check if adding this sentence would exceed max_words
    if (currentChunk.wordCount + sentenceWords > opts.max_words && currentChunk.wordCount >= opts.min_words) {
      // Finalize current chunk
      if (currentChunk.sentences.length > 0) {
        const chunkText = currentChunk.sentences.map(s => s.text).join(' ');

        // Add overlap from previous chunk if applicable
        let finalChunkText = chunkText;
        let hasOverlap = false;
        let overlapWordCount = 0;

        if (previousChunkText && opts.overlap_words > 0) {
          const overlapText = getLastNWords(previousChunkText, opts.overlap_words);
          overlapWordCount = countWords(overlapText);
          finalChunkText = `${overlapText} ${chunkText}`;
          hasOverlap = true;
        }

        chunks.push({
          chunk_index: chunkIndex,
          chunk_text: finalChunkText,
          start_time_seconds: currentChunk.sentences[0]!.start_time,
          end_time_seconds: currentChunk.sentences[currentChunk.sentences.length - 1]!.end_time,
          word_count: countWords(finalChunkText),
          metadata: {
            has_overlap: hasOverlap,
            overlap_word_count: hasOverlap ? overlapWordCount : undefined,
            original_segment_count: currentChunk.sentences.length,
          },
        });

        previousChunkText = chunkText;
        chunkIndex++;
      }

      // Start new chunk with current sentence
      currentChunk = {
        sentences: [sentence],
        text: sentence.text,
        wordCount: sentenceWords,
      };
    } else {
      // Add sentence to current chunk
      currentChunk.sentences.push(sentence);
      currentChunk.text = currentChunk.sentences.map(s => s.text).join(' ');
      currentChunk.wordCount = countWords(currentChunk.text);
    }
  }

  // Add final chunk if it has content
  if (currentChunk.sentences.length > 0) {
    const chunkText = currentChunk.sentences.map(s => s.text).join(' ');

    let finalChunkText = chunkText;
    let hasOverlap = false;
    let overlapWordCount = 0;

    if (previousChunkText && opts.overlap_words > 0) {
      const overlapText = getLastNWords(previousChunkText, opts.overlap_words);
      overlapWordCount = countWords(overlapText);
      finalChunkText = `${overlapText} ${chunkText}`;
      hasOverlap = true;
    }

    chunks.push({
      chunk_index: chunkIndex,
      chunk_text: finalChunkText,
      start_time_seconds: currentChunk.sentences[0]!.start_time,
      end_time_seconds: currentChunk.sentences[currentChunk.sentences.length - 1]!.end_time,
      word_count: countWords(finalChunkText),
      metadata: {
        has_overlap: hasOverlap,
        overlap_word_count: hasOverlap ? overlapWordCount : undefined,
        original_segment_count: currentChunk.sentences.length,
      },
    });
  }

  return chunks;
}

/**
 * Validate chunk quality and return warnings
 */
export function validateChunks(chunks: TranscriptChunk[]): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  if (chunks.length === 0) {
    return { valid: false, warnings: ['No chunks generated'] };
  }

  // Check for very small chunks (except last one)
  for (let i = 0; i < chunks.length - 1; i++) {
    if (chunks[i]!.word_count < 200) {
      warnings.push(`Chunk ${i} is very small (${chunks[i]!.word_count} words)`);
    }
  }

  // Check for timestamp continuity
  for (let i = 1; i < chunks.length; i++) {
    const prevEnd = chunks[i - 1]!.end_time_seconds;
    const currentStart = chunks[i]!.start_time_seconds;

    if (currentStart < prevEnd - 1) {
      warnings.push(`Chunk ${i} has overlapping timestamps with previous chunk`);
    }
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Get statistics about the chunking result
 */
export function getChunkingStats(chunks: TranscriptChunk[]): {
  total_chunks: number;
  total_words: number;
  avg_words_per_chunk: number;
  min_words: number;
  max_words: number;
  total_duration_seconds: number;
  chunks_with_overlap: number;
} {
  if (chunks.length === 0) {
    return {
      total_chunks: 0,
      total_words: 0,
      avg_words_per_chunk: 0,
      min_words: 0,
      max_words: 0,
      total_duration_seconds: 0,
      chunks_with_overlap: 0,
    };
  }

  const totalWords = chunks.reduce((sum, chunk) => sum + chunk.word_count, 0);
  const wordCounts = chunks.map(c => c.word_count);
  const lastChunk = chunks[chunks.length - 1]!;

  return {
    total_chunks: chunks.length,
    total_words: totalWords,
    avg_words_per_chunk: Math.round(totalWords / chunks.length),
    min_words: Math.min(...wordCounts),
    max_words: Math.max(...wordCounts),
    total_duration_seconds: lastChunk.end_time_seconds,
    chunks_with_overlap: chunks.filter(c => c.metadata.has_overlap).length,
  };
}
