/**
 * Inngest Functions
 *
 * Background jobs for video processing pipeline
 */

export { inngest } from './client';

// Transcription functions
export { transcribeVideoFunction } from './transcribe-video';

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
  generateEmbeddingsFunction,
  handleEmbeddingFailure,
  batchReprocessEmbeddings,
} from './generate-embeddings';

export const functions = [
  transcribeVideoFunction,
  generateEmbeddingsFunction,
  handleEmbeddingFailure,
  batchReprocessEmbeddings,
];
