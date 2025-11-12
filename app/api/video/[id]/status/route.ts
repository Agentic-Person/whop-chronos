/**
 * Video Processing Status API
 *
 * GET /api/video/[id]/status - Get current processing status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import {
  calculateProgress,
  getEstimatedTimeRemaining,
  getProcessingDuration,
  getStageMetadata,
  isTerminalState,
} from '@/lib/video/processor';
import type { Database } from '@/lib/db/types';

type VideoRow = Database['public']['Tables']['videos']['Row'];

// =====================================================
// TYPES
// =====================================================

interface ProcessingStatusResponse {
  videoId: string;
  status: VideoRow['status'];
  progress: number;
  currentStage: {
    name: string;
    description: string;
    retryable: boolean;
    timeoutMinutes: number;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    processingStartedAt: string | null;
    processingCompletedAt: string | null;
  };
  duration: {
    totalSeconds: number | null;
    estimatedRemainingMinutes: number | null;
  };
  error: {
    message: string | null;
    stage: string | null;
    timestamp: string | null;
    retryCount: number;
  } | null;
  metadata: {
    fileSize: number | null;
    durationSeconds: number | null;
    transcriptLanguage: string | null;
    chunkCount: number | null;
  };
  isTerminal: boolean;
  nextSteps: string[];
}

interface ErrorResponse {
  error: string;
  message: string;
  videoId?: string;
}

// =====================================================
// API HANDLER
// =====================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ProcessingStatusResponse | ErrorResponse>> {
  const { id: videoId } = await params;

  try {
    // Validate video ID
    if (!videoId || typeof videoId !== 'string') {
      return NextResponse.json(
        {
          error: 'ValidationError',
          message: 'Invalid video ID',
        },
        { status: 400 }
      );
    }

    // Get video details
    const supabase = getServiceSupabase();
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('[StatusAPI] Database error:', videoError);
      return NextResponse.json(
        {
          error: 'DatabaseError',
          message: 'Failed to fetch video status',
          videoId,
        },
        { status: 500 }
      );
    }

    if (!video) {
      return NextResponse.json(
        {
          error: 'NotFound',
          message: 'Video not found',
          videoId,
        },
        { status: 404 }
      );
    }

    // Check if video is deleted
    if (video.is_deleted) {
      return NextResponse.json(
        {
          error: 'NotFound',
          message: 'Video has been deleted',
          videoId,
        },
        { status: 404 }
      );
    }

    // Get chunk count if completed
    let chunkCount: number | null = null;
    if (video.status === 'completed') {
      const { count } = await supabase
        .from('video_chunks')
        .select('*', { count: 'exact', head: true })
        .eq('video_id', videoId);

      chunkCount = count;
    }

    // Build stage metadata
    const stageMetadata = getStageMetadata(video.status);

    // Build error information
    const errorInfo = video.error_message
      ? {
          message: video.error_message,
          stage: (video.metadata as any)?.last_error?.stage || null,
          timestamp: (video.metadata as any)?.last_error?.timestamp || null,
          retryCount: (video.metadata as any)?.retry_count || 0,
        }
      : null;

    // Build response
    const response: ProcessingStatusResponse = {
      videoId: video.id,
      status: video.status,
      progress: calculateProgress(video.status),
      currentStage: {
        name: stageMetadata.name,
        description: stageMetadata.description,
        retryable: stageMetadata.retryable,
        timeoutMinutes: stageMetadata.timeoutMinutes,
      },
      timestamps: {
        createdAt: video.created_at,
        updatedAt: video.updated_at,
        processingStartedAt: video.processing_started_at,
        processingCompletedAt: video.processing_completed_at,
      },
      duration: {
        totalSeconds: getProcessingDuration(
          video.processing_started_at,
          video.processing_completed_at
        ),
        estimatedRemainingMinutes: getEstimatedTimeRemaining(
          video.status,
          video.processing_started_at
        ),
      },
      error: errorInfo,
      metadata: {
        fileSize: video.file_size_bytes,
        durationSeconds: video.duration_seconds,
        transcriptLanguage: video.transcript_language,
        chunkCount,
      },
      isTerminal: isTerminalState(video.status),
      nextSteps: getNextSteps(video.status),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[StatusAPI] Unexpected error:', error);

    return NextResponse.json(
      {
        error: 'InternalError',
        message: error instanceof Error ? error.message : 'Unknown error',
        videoId,
      },
      { status: 500 }
    );
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get next steps based on current status
 */
function getNextSteps(status: VideoRow['status']): string[] {
  switch (status) {
    case 'pending':
      return ['Video will be uploaded to storage'];
    case 'uploading':
      return ['Upload will complete', 'Transcription will begin'];
    case 'transcribing':
      return ['Transcript will be generated', 'Text will be chunked'];
    case 'processing':
      return ['Transcript chunks will be created', 'Embeddings will be generated'];
    case 'embedding':
      return ['Vector embeddings will be stored', 'Processing will complete'];
    case 'completed':
      return ['Video is ready for AI chat'];
    case 'failed':
      return ['Retry processing', 'Check error logs', 'Contact support'];
    default:
      return [];
  }
}

// =====================================================
// OPTIONAL: ANALYTICS ENDPOINT
// =====================================================

/**
 * GET /api/video/[id]/status/analytics - Get processing analytics
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { id: videoId } = await params;

  try {
    const supabase = getServiceSupabase();

    // Get video with full metadata
    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Extract stage timings from metadata
    const metadata = video.metadata as any || {};
    const stageTimings = {
      upload: metadata.upload_duration_ms || null,
      transcription: metadata.transcription_duration_ms || null,
      chunking: metadata.chunking_duration_ms || null,
      embedding: metadata.embedding_duration_ms || null,
    };

    // Calculate total processing time
    const totalDuration = getProcessingDuration(
      video.processing_started_at,
      video.processing_completed_at
    );

    // Build analytics response
    const analytics = {
      videoId: video.id,
      processingTime: {
        total: totalDuration,
        byStage: stageTimings,
      },
      performance: {
        bottleneck: identifyBottleneck(stageTimings),
        avgProcessingSpeed: calculateAvgSpeed(video.duration_seconds, totalDuration),
      },
      errors: {
        count: metadata.retry_count || 0,
        lastError: metadata.last_error || null,
      },
      resources: {
        fileSize: video.file_size_bytes,
        chunkCount: await getChunkCount(videoId),
        transcriptLength: video.transcript?.length || 0,
      },
    };

    return NextResponse.json(analytics, { status: 200 });
  } catch (error) {
    console.error('[Analytics API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}

/**
 * Identify processing bottleneck
 */
function identifyBottleneck(timings: Record<string, number | null>): string {
  let maxStage = '';
  let maxTime = 0;

  for (const [stage, time] of Object.entries(timings)) {
    if (time && time > maxTime) {
      maxTime = time;
      maxStage = stage;
    }
  }

  return maxStage || 'unknown';
}

/**
 * Calculate average processing speed
 */
function calculateAvgSpeed(
  videoDuration: number | null,
  processingTime: number | null
): number | null {
  if (!videoDuration || !processingTime) return null;
  return videoDuration / processingTime;
}

/**
 * Get chunk count for video
 */
async function getChunkCount(videoId: string): Promise<number> {
  const supabase = getServiceSupabase();
  const { count } = await supabase
    .from('video_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('video_id', videoId);

  return count || 0;
}
