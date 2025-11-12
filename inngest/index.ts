/**
 * Inngest Functions
 *
 * Background jobs for video processing pipeline
 */

export { inngest } from './client';

// Transcription functions (legacy Whisper-only)
export { transcribeVideoFunction } from './transcribe-video';

// NEW: Unified transcript extraction (multi-source routing)
export {
  extractTranscriptFunction,
  handleTranscriptExtractionError,
} from './extract-transcript';

// Embedding functions
export {
  generateEmbeddingsFunction,
  handleEmbeddingFailure,
  batchReprocessEmbeddings,
} from './generate-embeddings';

/**
 * All Inngest functions for registration
 */
import { transcribeVideoFunction } from './transcribe-video';
import {
  extractTranscriptFunction,
  handleTranscriptExtractionError,
} from './extract-transcript';
import {
  generateEmbeddingsFunction,
  handleEmbeddingFailure,
  batchReprocessEmbeddings,
} from './generate-embeddings';

export const functions = [
  // Legacy Whisper-only transcription (keep for backwards compatibility)
  transcribeVideoFunction,
  // NEW: Unified transcript extraction (recommended)
  extractTranscriptFunction,
  handleTranscriptExtractionError,
  // Embedding generation
  generateEmbeddingsFunction,
  handleEmbeddingFailure,
  batchReprocessEmbeddings,
];
