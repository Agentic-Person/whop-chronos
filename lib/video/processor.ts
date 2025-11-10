/**
 * Video Processing State Machine
 *
 * Manages the video processing pipeline with state transitions:
 * pending → uploading → transcribing → processing → embedding → completed
 *                                                              ↓
 *                                                           failed
 */

import { getServiceSupabase } from '@/lib/db/client';
import type { Database } from '@/lib/db/types';

type VideoStatus = Database['public']['Tables']['videos']['Row']['status'];

// =====================================================
// STATE MACHINE CONFIGURATION
// =====================================================

/**
 * Valid state transitions in the processing pipeline
 */
const VALID_TRANSITIONS: Record<VideoStatus, VideoStatus[]> = {
  pending: ['uploading', 'failed'],
  uploading: ['transcribing', 'failed'],
  transcribing: ['processing', 'failed'],
  processing: ['embedding', 'failed'],
  embedding: ['completed', 'failed'],
  completed: [], // Terminal state
  failed: ['pending'], // Allow retry from failed state
};

/**
 * Processing stage metadata
 */
interface StageMetadata {
  name: string;
  description: string;
  retryable: boolean;
  maxRetries: number;
  timeoutMinutes: number;
}

const STAGE_METADATA: Record<VideoStatus, StageMetadata> = {
  pending: {
    name: 'Pending',
    description: 'Video is queued for processing',
    retryable: false,
    maxRetries: 0,
    timeoutMinutes: 0,
  },
  uploading: {
    name: 'Uploading',
    description: 'Video is being uploaded to storage',
    retryable: true,
    maxRetries: 3,
    timeoutMinutes: 30,
  },
  transcribing: {
    name: 'Transcribing',
    description: 'Generating transcript with Whisper AI',
    retryable: true,
    maxRetries: 3,
    timeoutMinutes: 60,
  },
  processing: {
    name: 'Processing',
    description: 'Chunking transcript into segments',
    retryable: true,
    maxRetries: 3,
    timeoutMinutes: 15,
  },
  embedding: {
    name: 'Embedding',
    description: 'Generating vector embeddings',
    retryable: true,
    maxRetries: 3,
    timeoutMinutes: 30,
  },
  completed: {
    name: 'Completed',
    description: 'Video processing completed successfully',
    retryable: false,
    maxRetries: 0,
    timeoutMinutes: 0,
  },
  failed: {
    name: 'Failed',
    description: 'Processing failed with errors',
    retryable: true,
    maxRetries: 0,
    timeoutMinutes: 0,
  },
};

// =====================================================
// PROCESSING ERRORS
// =====================================================

export class ProcessingError extends Error {
  constructor(
    message: string,
    public readonly stage: VideoStatus,
    public readonly videoId: string,
    public readonly retryable: boolean = true,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export class StateTransitionError extends Error {
  constructor(
    message: string,
    public readonly currentState: VideoStatus,
    public readonly attemptedState: VideoStatus
  ) {
    super(message);
    this.name = 'StateTransitionError';
  }
}

// =====================================================
// STATE MACHINE FUNCTIONS
// =====================================================

/**
 * Validate if a state transition is allowed
 */
export function isValidTransition(
  currentStatus: VideoStatus,
  newStatus: VideoStatus
): boolean {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  return allowedTransitions.includes(newStatus);
}

/**
 * Get next valid states for current status
 */
export function getNextStates(currentStatus: VideoStatus): VideoStatus[] {
  return VALID_TRANSITIONS[currentStatus];
}

/**
 * Get stage metadata
 */
export function getStageMetadata(status: VideoStatus): StageMetadata {
  return STAGE_METADATA[status];
}

/**
 * Check if status is terminal (no further transitions)
 */
export function isTerminalState(status: VideoStatus): boolean {
  return VALID_TRANSITIONS[status].length === 0;
}

/**
 * Check if status is retryable
 */
export function isRetryableState(status: VideoStatus): boolean {
  return STAGE_METADATA[status].retryable;
}

// =====================================================
// DATABASE OPERATIONS
// =====================================================

/**
 * Update video status with validation
 */
export async function updateVideoStatus(
  videoId: string,
  newStatus: VideoStatus,
  errorMessage?: string | null
): Promise<void> {
  const supabase = getServiceSupabase();

  // Get current video status
  const { data: currentVideo, error: fetchError } = await supabase
    .from('videos')
    .select('status, metadata')
    .eq('id', videoId)
    .single();

  if (fetchError) {
    throw new ProcessingError(
      `Failed to fetch video: ${fetchError.message}`,
      newStatus,
      videoId,
      false,
      fetchError
    );
  }

  if (!currentVideo) {
    throw new ProcessingError(
      `Video not found: ${videoId}`,
      newStatus,
      videoId,
      false
    );
  }

  // Validate state transition
  if (!isValidTransition(currentVideo.status, newStatus)) {
    throw new StateTransitionError(
      `Invalid state transition from ${currentVideo.status} to ${newStatus}`,
      currentVideo.status,
      newStatus
    );
  }

  // Prepare update data
  const now = new Date().toISOString();
  const updateData: Database['public']['Tables']['videos']['Update'] = {
    status: newStatus,
    error_message: errorMessage || null,
    updated_at: now,
  };

  // Set processing timestamps
  if (newStatus === 'uploading' && !currentVideo.metadata?.processing_started_at) {
    updateData.processing_started_at = now;
    updateData.metadata = {
      ...(currentVideo.metadata as object || {}),
      processing_started_at: now,
    };
  }

  if (newStatus === 'completed') {
    updateData.processing_completed_at = now;
    updateData.metadata = {
      ...(currentVideo.metadata as object || {}),
      processing_completed_at: now,
    };
  }

  // Update video status
  const { error: updateError } = await supabase
    .from('videos')
    .update(updateData)
    .eq('id', videoId);

  if (updateError) {
    throw new ProcessingError(
      `Failed to update video status: ${updateError.message}`,
      newStatus,
      videoId,
      true,
      updateError
    );
  }
}

/**
 * Transition to next stage in pipeline
 */
export async function transitionToNextStage(videoId: string): Promise<VideoStatus> {
  const supabase = getServiceSupabase();

  // Get current status
  const { data: video, error } = await supabase
    .from('videos')
    .select('status')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    throw new ProcessingError(
      'Failed to fetch video for transition',
      'pending',
      videoId,
      true,
      error || undefined
    );
  }

  // Determine next status
  const nextStates = getNextStates(video.status);
  if (nextStates.length === 0) {
    throw new StateTransitionError(
      `No valid transitions from ${video.status}`,
      video.status,
      video.status
    );
  }

  // For failed state, allow retry to pending
  const nextStatus = video.status === 'failed' ? 'pending' : nextStates[0];

  // Update to next status
  await updateVideoStatus(videoId, nextStatus);

  return nextStatus;
}

/**
 * Mark video as failed with error details
 */
export async function markVideoAsFailed(
  videoId: string,
  currentStage: VideoStatus,
  errorMessage: string,
  error?: Error
): Promise<void> {
  const supabase = getServiceSupabase();

  // Validate current stage allows failure transition
  if (!isValidTransition(currentStage, 'failed')) {
    throw new StateTransitionError(
      `Cannot transition from ${currentStage} to failed`,
      currentStage,
      'failed'
    );
  }

  // Get current metadata
  const { data: video } = await supabase
    .from('videos')
    .select('metadata')
    .eq('id', videoId)
    .single();

  // Build error metadata
  const errorMetadata = {
    ...(video?.metadata as object || {}),
    last_error: {
      stage: currentStage,
      message: errorMessage,
      timestamp: new Date().toISOString(),
      error_type: error?.name || 'UnknownError',
      stack: error?.stack,
    },
    retry_count: ((video?.metadata as any)?.retry_count || 0) + 1,
  };

  // Update to failed status
  await supabase
    .from('videos')
    .update({
      status: 'failed',
      error_message: errorMessage,
      metadata: errorMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);
}

/**
 * Retry failed video processing
 */
export async function retryFailedVideo(videoId: string): Promise<void> {
  const supabase = getServiceSupabase();

  // Get video details
  const { data: video, error } = await supabase
    .from('videos')
    .select('status, metadata')
    .eq('id', videoId)
    .single();

  if (error || !video) {
    throw new ProcessingError(
      'Failed to fetch video for retry',
      'failed',
      videoId,
      false,
      error || undefined
    );
  }

  if (video.status !== 'failed') {
    throw new StateTransitionError(
      'Can only retry videos in failed state',
      video.status,
      'pending'
    );
  }

  // Check retry limit
  const retryCount = (video.metadata as any)?.retry_count || 0;
  const lastErrorStage = (video.metadata as any)?.last_error?.stage as VideoStatus | undefined;
  const maxRetries = lastErrorStage ? getStageMetadata(lastErrorStage).maxRetries : 3;

  if (retryCount >= maxRetries) {
    throw new ProcessingError(
      `Maximum retry attempts (${maxRetries}) exceeded`,
      'failed',
      videoId,
      false
    );
  }

  // Reset to pending with retry metadata
  await supabase
    .from('videos')
    .update({
      status: 'pending',
      error_message: null,
      metadata: {
        ...(video.metadata as object || {}),
        retried_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', videoId);
}

// =====================================================
// BATCH OPERATIONS
// =====================================================

/**
 * Get all videos in a specific status
 */
export async function getVideosByStatus(
  status: VideoStatus,
  creatorId?: string
): Promise<Database['public']['Tables']['videos']['Row'][]> {
  const supabase = getServiceSupabase();

  let query = supabase
    .from('videos')
    .select('*')
    .eq('status', status)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Get processing statistics
 */
export async function getProcessingStats(creatorId?: string) {
  const supabase = getServiceSupabase();

  let query = supabase
    .from('videos')
    .select('status')
    .eq('is_deleted', false);

  if (creatorId) {
    query = query.eq('creator_id', creatorId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  // Count by status
  const stats: Record<VideoStatus, number> = {
    pending: 0,
    uploading: 0,
    transcribing: 0,
    processing: 0,
    embedding: 0,
    completed: 0,
    failed: 0,
  };

  for (const video of data || []) {
    stats[video.status]++;
  }

  return stats;
}

/**
 * Get stuck videos (processing for too long)
 */
export async function getStuckVideos(): Promise<Database['public']['Tables']['videos']['Row'][]> {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .in('status', ['uploading', 'transcribing', 'processing', 'embedding'])
    .eq('is_deleted', false);

  if (error) {
    throw error;
  }

  const now = Date.now();
  const stuckVideos: Database['public']['Tables']['videos']['Row'][] = [];

  for (const video of data || []) {
    const stageMetadata = getStageMetadata(video.status);
    const updatedAt = new Date(video.updated_at).getTime();
    const elapsedMinutes = (now - updatedAt) / (1000 * 60);

    if (elapsedMinutes > stageMetadata.timeoutMinutes) {
      stuckVideos.push(video);
    }
  }

  return stuckVideos;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Calculate processing progress percentage
 */
export function calculateProgress(status: VideoStatus): number {
  const progressMap: Record<VideoStatus, number> = {
    pending: 0,
    uploading: 20,
    transcribing: 40,
    processing: 60,
    embedding: 80,
    completed: 100,
    failed: 0,
  };

  return progressMap[status];
}

/**
 * Get estimated time remaining for current stage
 */
export function getEstimatedTimeRemaining(
  status: VideoStatus,
  startedAt: string | null
): number | null {
  if (!startedAt || status === 'completed' || status === 'failed') {
    return null;
  }

  const metadata = getStageMetadata(status);
  const elapsedMinutes = (Date.now() - new Date(startedAt).getTime()) / (1000 * 60);
  const remainingMinutes = Math.max(0, metadata.timeoutMinutes - elapsedMinutes);

  return remainingMinutes;
}

/**
 * Get processing duration in seconds
 */
export function getProcessingDuration(
  startedAt: string | null,
  completedAt: string | null
): number | null {
  if (!startedAt) return null;

  const endTime = completedAt ? new Date(completedAt).getTime() : Date.now();
  const startTime = new Date(startedAt).getTime();

  return Math.floor((endTime - startTime) / 1000);
}
