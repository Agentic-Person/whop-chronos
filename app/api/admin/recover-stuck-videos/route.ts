/**
 * Admin Endpoint: Manual Video Recovery
 *
 * Allows administrators to manually trigger stuck video recovery.
 * Same logic as the cron job but callable on-demand for debugging.
 *
 * @route POST /api/admin/recover-stuck-videos
 * @access Admin only (requires ADMIN_API_KEY)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStuckVideos } from '@/lib/video/processor';
import { getServiceSupabase } from '@/lib/db/client';
import { inngest } from '@/inngest/client';
import { logger } from '@/lib/logger';

// Maximum recovery attempts before giving up
const MAX_RECOVERY_ATTEMPTS = 3;

// Minimum time between recovery attempts (can be overridden with force flag)
const MIN_RETRY_INTERVAL_MS = 60 * 60 * 1000;

interface RecoveryResult {
  videoId: string;
  status: 'recovered' | 'failed' | 'skipped';
  reason: string;
  action?: string;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  // =========================================
  // STEP 1: VERIFY AUTHORIZATION
  // =========================================
  const authHeader = request.headers.get('authorization');
  const adminApiKey = process.env['ADMIN_API_KEY'];

  if (!adminApiKey) {
    logger.error('ADMIN_API_KEY not configured', null, { component: 'admin-recovery' });
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${adminApiKey}`) {
    logger.warn('Unauthorized admin access attempt', { component: 'admin-recovery' });
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // =========================================
  // STEP 2: PARSE REQUEST OPTIONS
  // =========================================
  let options: {
    force?: boolean;
    videoIds?: string[];
    dryRun?: boolean;
  } = {};

  try {
    const body = await request.json();
    options = body;
  } catch {
    // No body provided, use defaults
  }

  const { force = false, videoIds, dryRun = false } = options;

  logger.info('Starting manual recovery', {
    component: 'admin-recovery',
    force,
    dryRun,
    targetVideos: videoIds?.length || 'all'
  });

  // =========================================
  // STEP 3: GET STUCK VIDEOS
  // =========================================
  let stuckVideos;
  try {
    if (videoIds && videoIds.length > 0) {
      // Get specific videos
      const supabase = getServiceSupabase();
      const { data, error } = await (supabase as any)
        .from('videos')
        .select('*')
        .in('id', videoIds);

      if (error) throw error;
      stuckVideos = data || [];
    } else {
      // Get all stuck videos
      stuckVideos = await getStuckVideos();
    }

    logger.info('Found videos for recovery', {
      component: 'admin-recovery',
      count: stuckVideos.length
    });
  } catch (error) {
    logger.error('Failed to retrieve videos', error, { component: 'admin-recovery' });
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve videos',
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
      message: videoIds ? 'No matching videos found' : 'No stuck videos found',
      executionTimeMs: Date.now() - startTime
    });
  }

  // =========================================
  // STEP 4: DRY RUN MODE
  // =========================================
  if (dryRun) {
    const dryRunResults = await Promise.all(
      stuckVideos.map(async (video: any) => {
        const action = await determineRecoveryAction(video);
        const metadata = (video.metadata || {}) as any;
        const recoveryAttempts = metadata.recovery_attempts || 0;

        return {
          videoId: video.id,
          title: video.title,
          status: video.status,
          updatedAt: video.updated_at,
          wouldRecover: action !== null && recoveryAttempts < MAX_RECOVERY_ATTEMPTS,
          proposedAction: action,
          recoveryAttempts,
          reason: action
            ? `Would trigger: ${action}`
            : 'No viable recovery action'
        };
      })
    );

    return NextResponse.json({
      success: true,
      dryRun: true,
      total: stuckVideos.length,
      wouldRecover: dryRunResults.filter(r => r.wouldRecover).length,
      results: dryRunResults,
      executionTimeMs: Date.now() - startTime
    });
  }

  // =========================================
  // STEP 5: PROCESS EACH STUCK VIDEO
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

      // Skip if max attempts reached (unless forced)
      if (!force && recoveryAttempts >= MAX_RECOVERY_ATTEMPTS) {
        logger.warn('Max recovery attempts reached', {
          component: 'admin-recovery',
          videoId: video.id,
          attempts: recoveryAttempts
        });

        results.push({
          videoId: video.id,
          status: 'skipped',
          reason: `Max recovery attempts (${MAX_RECOVERY_ATTEMPTS}) reached. Use force=true to override.`
        });
        continue;
      }

      // Skip if too soon since last attempt (unless forced)
      if (!force && lastRecoveryAttempt && (now - lastRecoveryAttempt) < MIN_RETRY_INTERVAL_MS) {
        const remainingMinutes = Math.ceil((MIN_RETRY_INTERVAL_MS - (now - lastRecoveryAttempt)) / 60000);
        results.push({
          videoId: video.id,
          status: 'skipped',
          reason: `Rate limited: retry in ${remainingMinutes} minutes. Use force=true to override.`
        });
        continue;
      }

      // Determine recovery strategy based on video state
      const recoveryAction = await determineRecoveryAction(video);

      if (!recoveryAction) {
        // No viable action - mark as failed
        await (supabase as any)
          .from('videos')
          .update({
            status: 'failed',
            error_message: 'No viable recovery action (missing transcript)',
            updated_at: new Date().toISOString()
          })
          .eq('id', video.id);

        results.push({
          videoId: video.id,
          status: 'failed',
          reason: 'No viable recovery action (missing transcript)'
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

      logger.info('Manual recovery action triggered', {
        component: 'admin-recovery',
        videoId: video.id,
        action: recoveryAction,
        attempt: recoveryAttempts + 1,
        forced: force
      });

    } catch (error) {
      logger.error('Failed to recover video', error, {
        component: 'admin-recovery',
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
  // STEP 6: SUMMARIZE RESULTS
  // =========================================
  const summary = {
    success: true,
    recovered: results.filter(r => r.status === 'recovered').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    total: stuckVideos.length,
    results,
    options: {
      force,
      dryRun,
      targetVideos: videoIds?.length || 'all'
    },
    executionTimeMs: Date.now() - startTime
  };

  logger.info('Manual recovery completed', {
    component: 'admin-recovery',
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
    // No transcript → cannot recover
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
