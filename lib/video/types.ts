/**
 * TypeScript types for video processing pipeline
 */

export type VideoStatus =
  | 'pending'
  | 'uploading'
  | 'transcribing'
  | 'processing'
  | 'embedding'
  | 'completed'
  | 'failed';

export type SubscriptionTier = 'basic' | 'pro' | 'enterprise';

export interface Video {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  url?: string;
  storage_path?: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  transcript?: string;
  transcript_language?: string;
  status: VideoStatus;
  error_message?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  file_size_bytes?: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface VideoChunk {
  id: string;
  video_id: string;
  chunk_index: number;
  chunk_text: string;
  embedding?: number[];
  start_time_seconds: number;
  end_time_seconds: number;
  word_count: number;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Creator {
  id: string;
  whop_company_id: string;
  whop_user_id: string;
  email: string;
  name?: string;
  subscription_tier: SubscriptionTier;
  settings?: {
    notifications_enabled?: boolean;
    ai_model?: string;
    auto_transcribe?: boolean;
    default_chunk_size?: number;
  };
  created_at: string;
  updated_at: string;
  last_login_at?: string;
  is_active: boolean;
}

export interface UsageMetric {
  id: string;
  creator_id: string;
  date: string;
  storage_used_bytes: number;
  videos_uploaded: number;
  total_video_duration_seconds: number;
  ai_credits_used: number;
  transcription_minutes: number;
  chat_messages_sent: number;
  active_students: number;
  metadata?: {
    transcription_cost?: number;
    embedding_cost?: number;
    chat_cost?: number;
    [key: string]: unknown;
  };
  created_at: string;
  updated_at: string;
}

export interface TranscriptionJob {
  videoId: string;
  creatorId: string;
  storagePath: string;
  originalFilename: string;
  language?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
  result?: {
    transcript: string;
    language: string;
    duration: number;
    cost: number;
    segmentCount: number;
  };
}

export interface ProcessingMetrics {
  videoId: string;
  totalDurationMs: number;
  stages: {
    download?: number;
    transcription?: number;
    chunking?: number;
    embedding?: number;
  };
  costs: {
    transcription: number;
    embedding: number;
    total: number;
  };
}

export interface TierLimits {
  transcriptionMinutes: number;
  aiCreditsUsed: number;
  storageBytes: number;
}

export interface UsageSummary {
  current: {
    transcriptionMinutes: number;
    aiCreditsUsed: number;
    storageUsedBytes: number;
  };
  limits: TierLimits;
  percentages: {
    transcription: number;
    aiCredits: number;
    storage: number;
  };
  withinLimits: boolean;
  nearingLimit: boolean; // > 80% of any limit
}
