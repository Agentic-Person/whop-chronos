/**
 * Inngest client configuration
 * Central client for all background jobs
 */

import { Inngest } from 'inngest';

export const inngest = new Inngest({
  id: 'chronos',
  name: 'Chronos Video Processing',
  retryFunction: async (attempt) => ({
    delay: Math.min(1000 * Math.pow(2, attempt), 60000), // Exponential backoff, max 60s
    maxAttempts: 3,
  }),
});

// Event types for type safety
export interface TranscribeVideoEvent {
  name: 'video/transcribe.requested';
  data: {
    videoId: string;
    creatorId: string;
    storagePath: string;
    originalFilename: string;
    language?: string;
  };
}

export interface ChunkVideoEvent {
  name: 'video/chunk.requested';
  data: {
    videoId: string;
    creatorId: string;
    transcript: string;
    segments: Array<{
      id: number;
      start: number;
      end: number;
      text: string;
    }>;
  };
}

export interface EmbedChunksEvent {
  name: 'video/embed.requested';
  data: {
    videoId: string;
    creatorId: string;
    chunkIds: string[];
  };
}

export type InngestEvent =
  | TranscribeVideoEvent
  | ChunkVideoEvent
  | EmbedChunksEvent;
