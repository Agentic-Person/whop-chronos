/**
 * Inngest function for video transcription
 * Background job that handles audio extraction and OpenAI Whisper transcription
 */

import { inngest } from './client';
import { transcribeVideo } from '@/lib/video/transcription';
import { createClient } from '@supabase/supabase-js';
import type { TranscribeVideoEvent } from './client';

// Initialize Supabase client with service role key
function getSupabaseClient() {
  const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase credentials');
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

export const transcribeVideoFunction = inngest.createFunction(
  {
    id: 'transcribe-video',
    name: 'Transcribe Video with Whisper',
    retries: 3,
    rateLimit: {
      limit: 10, // Max 10 concurrent transcriptions
      period: '1m',
      key: 'event.data.creatorId',
    },
  },
  { event: 'video/transcribe.requested' },
  async ({ event, step, logger }) => {
    const { videoId, creatorId, storagePath, originalFilename, language } = event.data;

    logger.info(`Starting transcription for video ${videoId}`);

    // Step 1: Update video status to "transcribing"
    await step.run('update-status-transcribing', async () => {
      const supabase = getSupabaseClient();

      const { error } = await supabase
        .from('videos')
        .update({
          status: 'transcribing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      if (error) {
        logger.error('Failed to update video status', { error });
        throw new Error(`Failed to update video status: ${error.message}`);
      }

      logger.info('Video status updated to transcribing');
    });

    // Step 2: Download video from Supabase Storage
    const videoBuffer = await step.run('download-video', async () => {
      const supabase = getSupabaseClient();

      logger.info(`Downloading video from storage: ${storagePath}`);

      const { data, error } = await supabase.storage
        .from('videos')
        .download(storagePath);

      if (error || !data) {
        logger.error('Failed to download video', { error });
        throw new Error(`Failed to download video: ${error?.message || 'No data'}`);
      }

      const buffer = Buffer.from(await data.arrayBuffer());
      logger.info(`Video downloaded: ${buffer.length} bytes`);

      return buffer;
    });

    // Step 3: Transcribe video with Whisper API
    const transcription = await step.run('transcribe-with-whisper', async () => {
      logger.info('Starting Whisper transcription');

      try {
        // Convert serialized buffer back to Buffer if needed
        const buffer = Buffer.isBuffer(videoBuffer)
          ? videoBuffer
          : Buffer.from((videoBuffer as any).data);

        const result = await transcribeVideo(buffer, originalFilename, {
          language,
          responseFormat: 'verbose_json', // Get segments for better chunking
          temperature: 0, // Deterministic output
        });

        logger.info('Transcription completed', {
          duration: result.duration,
          language: result.language,
          cost: result.cost,
          segmentCount: result.segments?.length || 0,
        });

        return result;
      } catch (error) {
        logger.error('Whisper transcription failed', { error });
        throw error;
      }
    });

    // Step 4: Save transcript to database
    await step.run('save-transcript', async () => {
      const supabase = getSupabaseClient();

      logger.info('Saving transcript to database');

      const { error } = await supabase
        .from('videos')
        .update({
          transcript: transcription.transcript,
          transcript_language: transcription.language,
          duration_seconds: transcription.duration,
          status: 'processing', // Move to next stage
          metadata: {
            transcription_cost: transcription.cost,
            segment_count: transcription.segments?.length || 0,
          },
        })
        .eq('id', videoId);

      if (error) {
        logger.error('Failed to save transcript', { error });
        throw new Error(`Failed to save transcript: ${error.message}`);
      }

      logger.info('Transcript saved successfully');
    });

    // Step 5: Update usage metrics
    await step.run('update-usage-metrics', async () => {
      const supabase = getSupabaseClient();
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      logger.info('Updating usage metrics');

      const transcriptionMinutes = transcription.duration / 60;

      // Upsert usage metrics for today
      const { error } = await supabase.from('usage_metrics').upsert(
        {
          creator_id: creatorId,
          date: today,
          transcription_minutes: transcriptionMinutes,
          metadata: {
            transcription_cost: transcription.cost,
          },
        },
        {
          onConflict: 'creator_id,date',
        },
      );

      if (error) {
        // Don't fail the job if metrics update fails
        logger.warn('Failed to update usage metrics', { error });
      } else {
        logger.info('Usage metrics updated', {
          transcriptionMinutes: transcriptionMinutes.toFixed(2),
          cost: transcription.cost,
        });
      }
    });

    // Step 6: Send notification on completion
    await step.run('send-completion-notification', async () => {
      // Future: Send webhook, email, or in-app notification
      logger.info('Transcription pipeline completed successfully', {
        videoId,
        duration: transcription.duration,
        cost: transcription.cost,
      });
    });

    // Step 7: Trigger chunking and embedding
    await step.sendEvent('trigger-chunking', {
      name: 'video/chunk.requested',
      data: {
        videoId,
        creatorId,
        transcript: transcription.transcript,
        segments: transcription.segments || [],
      },
    });

    return {
      success: true,
      videoId,
      duration: transcription.duration,
      language: transcription.language,
      cost: transcription.cost,
      segmentCount: transcription.segments?.length || 0,
    };
  },
);

// Error handler function
export const transcribeVideoErrorHandler = inngest.createFunction(
  {
    id: 'transcribe-video-error',
    name: 'Handle Transcription Errors',
  },
  { event: 'inngest/function.failed' },
  async ({ event, step, logger }) => {
    // Only handle failures from transcribe-video function
    if (event.data.function_id !== 'transcribe-video') {
      return;
    }

    const originalEvent = event.data.event as TranscribeVideoEvent;
    const { videoId, creatorId } = originalEvent.data;
    const error = event.data.error;

    logger.error('Transcription failed', {
      videoId,
      creatorId,
      error,
      attempt: event.data.run_id,
    });

    // Update video status to failed
    await step.run('update-status-failed', async () => {
      const supabase = getSupabaseClient();

      const { error: updateError } = await supabase
        .from('videos')
        .update({
          status: 'failed',
          error_message: error.message || 'Transcription failed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', videoId);

      if (updateError) {
        logger.error('Failed to update video status to failed', { updateError });
      }
    });

    // Send failure notification
    await step.run('send-failure-notification', async () => {
      // Future: Send webhook, email, or in-app notification
      logger.info('Failure notification sent', { videoId, creatorId });
    });

    return {
      handled: true,
      videoId,
      error: error.message,
    };
  },
);
