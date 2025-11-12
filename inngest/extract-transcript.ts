/**
 * Inngest Function: Extract Transcript
 *
 * Unified transcript extraction using the transcript router.
 * Automatically detects source type and routes to appropriate processor.
 *
 * Routing Logic:
 * - YouTube → FREE (youtubei.js)
 * - Loom → FREE (Loom API)
 * - Mux → FREE (auto-captions if available)
 * - Upload → PAID (Whisper fallback)
 *
 * Background job that:
 * - Extracts transcript from video URL or uploaded file
 * - Tracks costs by source
 * - Updates video status throughout process
 * - Logs analytics events
 * - Triggers embedding generation on success
 */

import { inngest } from './client';
import { getServiceSupabase } from '@/lib/db/client';
import {
  extractTranscriptFromVideo,
  calculateEstimatedCost,
  type TranscriptResult,
  TranscriptRouterError,
} from '@/lib/video/transcript-router';

/**
 * Event payload for transcript extraction
 */
export interface ExtractTranscriptEvent {
  name: 'video/transcript.extract';
  data: {
    video_id: string;
    creator_id: string;
    source_type: 'youtube' | 'mux' | 'loom' | 'upload';
    // Optional fields depending on source
    url?: string;
    youtube_video_id?: string;
    embed_id?: string;
    mux_playback_id?: string;
    storage_path?: string;
    language?: string;
  };
}

/**
 * Extract transcript from video using unified router
 */
export const extractTranscriptFunction = inngest.createFunction(
  {
    id: 'extract-transcript',
    name: 'Extract Video Transcript',
    retries: 2,
    rateLimit: {
      limit: 20, // Max 20 concurrent extractions
      period: '1m',
      key: 'event.data.creator_id',
    },
  },
  { event: 'video/transcript.extract' },
  async ({ event, step, logger }) => {
    const { video_id, creator_id, source_type } = event.data;

    logger.info(`Starting transcript extraction for video ${video_id}`, {
      source_type,
      creator_id,
    });

    // Step 1: Get video record from database
    const video = await step.run('fetch-video-record', async () => {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', video_id)
        .single();

      if (error || !data) {
        throw new Error(`Video not found: ${video_id}`);
      }

      logger.info('Video record fetched', {
        title: data.title,
        status: data.status,
        source_type: data.source_type,
      });

      return data;
    });

    // Step 2: Estimate cost before processing
    const costEstimate = await step.run('estimate-cost', async () => {
      const durationSeconds = video.duration_seconds || 600; // Default to 10 min if unknown
      const estimate = calculateEstimatedCost(source_type, durationSeconds);

      logger.info('Cost estimated', {
        source_type,
        duration_seconds: durationSeconds,
        estimated_cost: estimate.cost_formatted,
        method: estimate.method,
      });

      return estimate;
    });

    // Step 3: Update video status to "transcribing"
    await step.run('update-status-transcribing', async () => {
      const supabase = getServiceSupabase();

      await supabase
        .from('videos')
        .update({
          status: 'transcribing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', video_id);

      logger.info('Video status updated to transcribing');
    });

    // Step 4: Download video buffer if needed (for uploads only)
    const videoBuffer = await step.run('download-video-buffer', async () => {
      if (source_type !== 'upload') {
        logger.info('Skipping buffer download (not an upload)');
        return null;
      }

      if (!video.storage_path) {
        throw new Error('Upload video missing storage_path');
      }

      const supabase = getServiceSupabase();

      logger.info(`Downloading video from storage: ${video.storage_path}`);

      const { data, error } = await supabase.storage
        .from('videos')
        .download(video.storage_path);

      if (error || !data) {
        throw new Error(`Failed to download video: ${error?.message || 'No data'}`);
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      logger.info(`Video downloaded: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);

      return buffer;
    });

    // Step 5: Extract transcript using router
    const transcriptResult = await step.run('extract-transcript', async () => {
      logger.info('Starting transcript extraction via router');

      try {
        const result: TranscriptResult = await extractTranscriptFromVideo(
          {
            source_type: video.source_type,
            url: video.url,
            embed_id: video.embed_id,
            mux_playback_id: video.mux_playback_id,
            youtube_video_id: video.youtube_video_id,
            storage_path: video.storage_path,
          },
          creator_id,
          videoBuffer || undefined
        );

        logger.info('Transcript extracted successfully', {
          method: result.transcript_method,
          duration: result.duration_seconds,
          transcript_length: result.transcript.length,
          cost: result.metadata.cost_usd,
          processing_time: result.metadata.processing_time_ms,
        });

        return result;
      } catch (error) {
        if (error instanceof TranscriptRouterError) {
          logger.error('Transcript extraction failed', {
            code: error.code,
            source: error.sourceType,
            message: error.message,
          });
        }
        throw error;
      }
    });

    // Step 6: Save transcript to database
    await step.run('save-transcript', async () => {
      const supabase = getServiceSupabase();

      logger.info('Saving transcript to database');

      const { error } = await supabase
        .from('videos')
        .update({
          transcript: transcriptResult.transcript,
          transcript_language: transcriptResult.metadata.language || 'en',
          duration_seconds: transcriptResult.duration_seconds,
          status: 'processing', // Move to next stage
          metadata: {
            ...video.metadata,
            transcript_method: transcriptResult.transcript_method,
            transcript_cost: transcriptResult.metadata.cost_usd,
            processing_time_ms: transcriptResult.metadata.processing_time_ms,
          },
        })
        .eq('id', video_id);

      if (error) {
        throw new Error(`Failed to save transcript: ${error.message}`);
      }

      logger.info('Transcript saved successfully');
    });

    // Step 7: Log analytics event
    await step.run('log-analytics-event', async () => {
      const supabase = getServiceSupabase();

      const { error } = await supabase
        .from('video_analytics_events')
        .insert({
          event_type: 'video_transcribed',
          video_id,
          creator_id,
          metadata: {
            source_type,
            transcript_method: transcriptResult.transcript_method,
            duration_seconds: transcriptResult.duration_seconds,
            cost_usd: transcriptResult.metadata.cost_usd,
            processing_time_ms: transcriptResult.metadata.processing_time_ms,
            transcript_length: transcriptResult.transcript.length,
            segment_count: transcriptResult.transcript_with_timestamps.length,
          },
        });

      if (error) {
        logger.warn('Failed to log analytics event', { error });
      } else {
        logger.info('Analytics event logged');
      }
    });

    // Step 8: Update usage metrics
    await step.run('update-usage-metrics', async () => {
      const supabase = getServiceSupabase();
      const today = new Date().toISOString().split('T')[0];

      logger.info('Updating usage metrics');

      const transcriptionMinutes = transcriptResult.duration_seconds / 60;
      const aiCreditsUsed = Math.ceil(transcriptResult.metadata.cost_usd * 1000); // Convert to credits

      // Get current metrics
      const { data: existingMetrics } = await supabase
        .from('usage_metrics')
        .select('*')
        .eq('creator_id', creator_id)
        .eq('date', today)
        .single();

      if (existingMetrics) {
        // Update existing metrics
        await supabase
          .from('usage_metrics')
          .update({
            transcription_minutes: existingMetrics.transcription_minutes + transcriptionMinutes,
            ai_credits_used: existingMetrics.ai_credits_used + aiCreditsUsed,
            metadata: {
              ...existingMetrics.metadata,
              transcript_costs: [
                ...(existingMetrics.metadata?.transcript_costs || []),
                {
                  video_id,
                  method: transcriptResult.transcript_method,
                  cost_usd: transcriptResult.metadata.cost_usd,
                  duration_minutes: transcriptionMinutes,
                },
              ],
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMetrics.id);
      } else {
        // Create new metrics
        await supabase.from('usage_metrics').insert({
          creator_id,
          date: today,
          transcription_minutes: transcriptionMinutes,
          ai_credits_used: aiCreditsUsed,
          storage_used_bytes: 0,
          videos_uploaded: 0,
          total_video_duration_seconds: 0,
          chat_messages_sent: 0,
          active_students: 0,
          metadata: {
            transcript_costs: [
              {
                video_id,
                method: transcriptResult.transcript_method,
                cost_usd: transcriptResult.metadata.cost_usd,
                duration_minutes: transcriptionMinutes,
              },
            ],
          },
        });
      }

      logger.info('Usage metrics updated', {
        transcription_minutes: transcriptionMinutes.toFixed(2),
        ai_credits_used: aiCreditsUsed,
      });
    });

    // Step 9: Trigger embedding generation
    await step.sendEvent('trigger-embedding', {
      name: 'video/transcription.completed',
      data: {
        video_id,
        creator_id,
        transcript: transcriptResult.transcript,
      },
    });

    logger.info('Transcript extraction completed successfully', {
      video_id,
      method: transcriptResult.transcript_method,
      cost: transcriptResult.metadata.cost_usd,
    });

    return {
      success: true,
      video_id,
      method: transcriptResult.transcript_method,
      duration_seconds: transcriptResult.duration_seconds,
      cost_usd: transcriptResult.metadata.cost_usd,
      transcript_length: transcriptResult.transcript.length,
      processing_time_ms: transcriptResult.metadata.processing_time_ms,
    };
  }
);

/**
 * Error handler for transcript extraction failures
 */
export const handleTranscriptExtractionError = inngest.createFunction(
  {
    id: 'handle-transcript-extraction-error',
    name: 'Handle Transcript Extraction Error',
  },
  { event: 'inngest/function.failed' },
  async ({ event, step, logger }) => {
    if (event.data.function_id !== 'extract-transcript') {
      return;
    }

    const originalEvent = event.data.event as ExtractTranscriptEvent;
    const { video_id, creator_id, source_type } = originalEvent.data;
    const error = event.data.error;

    logger.error('Transcript extraction failed', {
      video_id,
      creator_id,
      source_type,
      error_message: error.message,
      attempt: event.data.run_id,
    });

    // Update video status to failed
    await step.run('update-status-failed', async () => {
      const supabase = getServiceSupabase();

      await supabase
        .from('videos')
        .update({
          status: 'failed',
          error_message: error.message || 'Transcript extraction failed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', video_id);

      logger.info('Video status updated to failed');
    });

    // Log failure event
    await step.run('log-failure-event', async () => {
      const supabase = getServiceSupabase();

      await supabase
        .from('video_analytics_events')
        .insert({
          event_type: 'video_transcribed',
          video_id,
          creator_id,
          metadata: {
            source_type,
            error: error.message,
            failed: true,
          },
        });
    });

    return {
      handled: true,
      video_id,
      error: error.message,
    };
  }
);
