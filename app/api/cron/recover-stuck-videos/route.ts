/**
 * Vercel Cron Job: Auto-Recovery for Stuck Videos
 *
 * This endpoint is called every 5 minutes by Vercel Cron to detect and retry stuck videos.
 * It identifies videos that have been in a processing state for longer than expected
 * and automatically retries them by sending the appropriate Inngest events.
 *
 * @route GET /api/cron/recover-stuck-videos
 * @access Vercel Cron (authorized via CRON_SECRET header)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStuckVideos } from '@/lib/video/processor';
import { getServiceSupabase } from '@/lib/db/client';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';

// Maximum recovery attempts before giving up
const MAX_RECOVERY_ATTEMPTS = 3;

// Minimum time between recovery attempts (1 hour)
const MIN_RETRY_INTERVAL_MS = 60 * 60 * 1000;

interface RecoveryResult {
  videoId: string;
  status: 'recovered' | 'failed' | 'skipped';
  reason: string;
  action?: string;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  // =========================================
  // STEP 1: VERIFY AUTHORIZATION
  // =========================================
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the cron secret
  if (process.env.NODE_ENV === 'production') {
    if (!cronSecret) {
      logger.error('CRON_SECRET not configured', null, { component: 'cron-recovery' });
      return NextResponse.json(
        { error: 'Server misconfiguration' },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized cron access attempt', { component: 'cron-recovery' });
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
  }

  logger.info('Starting auto-recovery job', { component: 'cron-recovery' });

  // =========================================
  // STEP 2: GET STUCK VIDEOS
  // =========================================
  let stuckVideos;
  try {
    stuckVideos = await getStuckVideos();
    logger.info('Found stuck videos', {
      component: 'cron-recovery',
      count: stuckVideos.length
    });
  } catch (error) {
    logger.error('Failed to retrieve stuck videos', error, { component: 'cron-recovery' });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve stuck videos',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }

  if (stuckVideos.length === 0) {
    return NextResponse.json({
      success: true,
      recovered: 0,
      failed: 0,
      skipped: 0,
      message: 'No stuck videos found',
      executionTimeMs: Date.now() - startTime
    });
  }

  // =========================================
  // STEP 3: PROCESS EACH STUCK VIDEO
  // =========================================
  const results: RecoveryResult[] = [];
  const supabase = getServiceSupabase();

  for (const video of stuckVideos) {
    try {
      // Check recovery attempts from metadata
      const metadata = (video.metadata || {}) as any;
      const recoveryAttempts = metadata.recovery_attempts || 0;
      const lastRecoveryAttempt = metadata.last_recovery_attempt
        ? new Date(metadata.last_recovery_attempt).getTime()
        : 0;
      const now = Date.now();

      // Skip if max attempts reached
      if (recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
        logger.warn('Max recovery attempts reached, marking as failed', {
          component: 'cron-recovery',
          videoId: video.id,
          attempts: recoveryAttempts
        });

        await (supabase as any)
          .from('videos')
          .update({
            status: 'failed',
            error_message: `Auto-recovery failed after ${recoveryAttempts} attempts`,
            updated_at: new Date().toISOString()
          })
          .eq('id', video.id);

        results.push({
          videoId: video.id,
          status: 'failed',
          reason: `Max recovery attempts (${MAX_RECOVERY_ATTEMPTS}) reached`
        });
        continue;
      }

      // Skip if too soon since last attempt (rate limiting)
      if (lastRecoveryAttempt && (now - lastRecoveryAttempt) < MIN_RETRY_INTERVAL_MS) {
        const remainingMinutes = Math.ceil((MIN_RETRY_INTERVAL_MS - (now - lastRecoveryAttempt)) / 60000);
        results.push({
          videoId: video.id,
          status: 'skipped',
          reason: `Rate limited: retry in ${remainingMinutes} minutes`
        });
        continue;
      }

      // Determine recovery strategy based on video state
      const recoveryAction = await determineRecoveryAction(video);

      if (!recoveryAction) {
        results.push({
          videoId: video.id,
          status: 'failed',
          reason: 'No viable recovery action'
        });
        continue;
      }

      // Execute recovery action
      await executeRecoveryAction(video.id, recoveryAction, recoveryAttempts + 1);

      results.push({
        videoId: video.id,
        status: 'recovered',
        reason: 'Recovery action triggered',
        action: recoveryAction
      });

      logger.info('Recovery action triggered', {
        component: 'cron-recovery',
        videoId: video.id,
        action: recoveryAction,
        attempt: recoveryAttempts + 1
      });

    } catch (error) {
      logger.error('Failed to recover video', error, {
        component: 'cron-recovery',
        videoId: video.id
      });

      results.push({
        videoId: video.id,
        status: 'failed',
        reason: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // =========================================
  // STEP 4: SUMMARIZE RESULTS
  // =========================================
  const summary = {
    success: true,
    recovered: results.filter(r => r.status === 'recovered').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    total: stuckVideos.length,
    results,
    executionTimeMs: Date.now() - startTime
  };

  logger.info('Auto-recovery job completed', {
    component: 'cron-recovery',
    ...summary
  });

  return NextResponse.json(summary);
}

/**
 * Determine the appropriate recovery action based on video state
 */
async function determineRecoveryAction(video: any): Promise<string | null> {
  const supabase = getServiceSupabase();

  // Check if video has a transcript
  const hasTranscript = video.transcript && video.transcript.trim().length > 0;

  // Check if video has chunks
  const { count: chunkCount } = await (supabase as any)
    .from('video_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('video_id', video.id);

  // Check if chunks have embeddings
  const { count: embeddingCount } = await (supabase as any)
    .from('video_chunks')
    .select('id', { count: 'exact', head: true })
    .eq('video_id', video.id)
    .not('embedding', 'is', null);

  const hasChunks = chunkCount && chunkCount > 0;
  const hasEmbeddings = embeddingCount && embeddingCount > 0;

  // Decision matrix
  if (!hasTranscript) {
    // No transcript → should be marked failed (cannot recover)
    return null;
  }

  if (hasTranscript && !hasChunks) {
    // Has transcript but no chunks → retry embedding generation
    return 'retry-embeddings';
  }

  if (hasChunks && !hasEmbeddings) {
    // Has chunks but no embeddings → retry embedding generation
    return 'retry-embeddings';
  }

  if (hasChunks && hasEmbeddings) {
    // Has everything but stuck in wrong status → fix status
    return 'fix-status';
  }

  return null;
}

/**
 * Execute the recovery action
 */
async function executeRecoveryAction(
  videoId: string,
  action: string,
  attemptNumber: number
): Promise<void> {
  const supabase = getServiceSupabase();

  // Get video details
  const { data: video } = await (supabase as any)
    .from('videos')
    .select('id, creator_id, transcript')
    .eq('id', videoId)
    .single();

  if (!video) {
    throw new Error('Video not found');
  }

  // Update recovery metadata
  const metadata = {
    recovery_attempts: attemptNumber,
    last_recovery_attempt: new Date().toISOString(),
    last_recovery_action: action
  };

  await (supabase as any)
    .from('videos')
    .update({ metadata })
    .eq('id', videoId);

  switch (action) {
    case 'retry-embeddings':
      // Re-trigger embedding generation
      await inngest.send({
        name: 'video/transcription.completed',
        data: {
          video_id: videoId,
          creator_id: video.creator_id,
          transcript: video.transcript,
          skip_if_exists: false
        }
      });
      break;

    case 'fix-status':
      // Simply update status to completed
      await (supabase as any)
        .from('videos')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString()
        })
        .eq('id', videoId);
      break;

    default:
      throw new Error(`Unknown recovery action: ${action}`);
  }
}
