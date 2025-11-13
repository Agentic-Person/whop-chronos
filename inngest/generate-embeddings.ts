/**
 * Inngest Function: Generate Embeddings
 *
 * Background job for converting transcribed video chunks into vector embeddings.
 * - Triggered when video transcription is complete
 * - Chunks transcript into optimal segments
 * - Generates embeddings in batches
 * - Updates video status throughout process
 * - Tracks costs in usage_metrics
 */

import { inngest } from './client';
import { getServiceSupabase } from '@/lib/db/client';
import { chunkTranscript, getChunkingStats, validateChunks } from '@/lib/video/chunking';
import { generateEmbeddings } from '@/lib/video/embeddings';

/**
 * Generate embeddings for a video's transcript
 */
export const generateEmbeddingsFunction = inngest.createFunction(
  {
    id: 'generate-embeddings',
    name: 'Generate Video Embeddings',
    retries: 2,
  },
  { event: 'video/transcription.completed' },
  async ({ event, step }) => {
    const { video_id, creator_id, transcript, skip_if_exists } = event.data;

    console.log(`[Embeddings] Starting embedding generation for video ${video_id}`);

    // Step 1: Validate video exists and get current status
    const video: any = await step.run('validate-video', async () => {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase
        .from('videos')
        .select('id, title, status, transcript')
        .eq('id', video_id)
        .single();

      if (error || !data) {
        throw new Error(`Video not found: ${video_id}`);
      }

      // Check if embeddings already exist
      if (skip_if_exists) {
        const { count } = await supabase
          .from('video_chunks')
          .select('id', { count: 'exact', head: true })
          .eq('video_id', video_id)
          .not('embedding', 'is', null);

        if (count && count > 0) {
          console.log(`[Embeddings] Embeddings already exist for video ${video_id}, skipping`);
          return { skip: true, video: data };
        }
      }

      return { skip: false, video: data };
    });

    if (video.skip) {
      return { success: true, skipped: true, reason: 'Embeddings already exist' };
    }

    // Step 2: Update status to processing
    await step.run('update-status-processing', async () => {
      const supabase = getServiceSupabase();

      await (supabase as any)
        .from('videos')
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString(),
        })
        .eq('id', video_id);
    });

    // Step 3: Chunk the transcript
    const chunks = await step.run('chunk-transcript', async () => {
      console.log(`[Embeddings] Chunking transcript for video ${video_id}`);

      const transcriptData = transcript || video.video.transcript;
      if (!transcriptData) {
        throw new Error(`No transcript available for video ${video_id}`);
      }

      // Chunk the transcript
      const chunks = chunkTranscript(transcriptData, {
        min_words: 500,
        max_words: 1000,
        overlap_words: 100,
        preserve_sentences: true,
      });

      // Validate chunks
      const validation = validateChunks(chunks);
      if (!validation.valid) {
        console.warn(`[Embeddings] Chunk validation warnings:`, validation.warnings);
      }

      // Log chunking statistics
      const stats = getChunkingStats(chunks);
      console.log(`[Embeddings] Chunking stats:`, stats);

      return chunks;
    });

    // Step 4: Store chunks in database (without embeddings first)
    await step.run('store-chunks', async () => {
      const supabase = getServiceSupabase();

      console.log(`[Embeddings] Storing ${chunks.length} chunks for video ${video_id}`);

      // Delete existing chunks for this video (in case of reprocessing)
      await supabase
        .from('video_chunks')
        .delete()
        .eq('video_id', video_id);

      // Insert new chunks
      const chunksToInsert = chunks.map(chunk => ({
        video_id,
        chunk_index: chunk.chunk_index,
        chunk_text: chunk.chunk_text,
        start_time_seconds: chunk.start_time_seconds,
        end_time_seconds: chunk.end_time_seconds,
        word_count: chunk.word_count,
        metadata: chunk.metadata,
      }));

      const { error } = await (supabase as any)
        .from('video_chunks')
        .insert(chunksToInsert);

      if (error) {
        throw new Error(`Failed to store chunks: ${error.message}`);
      }
    });

    // Step 5: Update status to embedding
    await step.run('update-status-embedding', async () => {
      const supabase = getServiceSupabase();

      await (supabase as any)
        .from('videos')
        .update({ status: 'embedding' })
        .eq('id', video_id);
    });

    // Step 6: Generate embeddings in batches
    const embeddingResult = await step.run('generate-embeddings', async () => {
      console.log(`[Embeddings] Generating embeddings for ${chunks.length} chunks`);

      const result = await generateEmbeddings(chunks, {
        batch_size: 20,
        max_retries: 3,
        retry_delay_ms: 1000,
      });

      console.log(
        `[Embeddings] Generated ${result.embeddings.length} embeddings`,
        `(${result.total_tokens} tokens, $${result.total_cost_usd.toFixed(4)}, ${result.processing_time_ms}ms)`
      );

      return result;
    });

    // Step 7: Update chunks with embeddings
    await step.run('update-chunks-with-embeddings', async () => {
      const supabase = getServiceSupabase();

      console.log(`[Embeddings] Storing embeddings in database`);

      // Update chunks in batches to avoid overwhelming the database
      const batchSize = 50;
      for (let i = 0; i < embeddingResult.embeddings.length; i += batchSize) {
        const batch = embeddingResult.embeddings.slice(i, i + batchSize);

        for (const embedding of batch) {
          const { error } = await (supabase as any)
            .from('video_chunks')
            .update({
              embedding: embedding.embedding,
            })
            .eq('video_id', video_id)
            .eq('chunk_index', embedding.chunk_index);

          if (error) {
            console.error(`Failed to update chunk ${embedding.chunk_index}:`, error);
            throw new Error(`Failed to update embeddings: ${error.message}`);
          }
        }

        console.log(`[Embeddings] Updated ${Math.min(i + batchSize, embeddingResult.embeddings.length)}/${embeddingResult.embeddings.length} chunks`);
      }
    });

    // Step 8: Update usage metrics
    await step.run('update-usage-metrics', async () => {
      const supabase = getServiceSupabase();

      const today = new Date().toISOString().split('T')[0];

      // Get current metrics
      const { data: existingMetrics } = await (supabase as any)
        .from('usage_metrics')
        .select('*')
        .eq('creator_id', creator_id)
        .eq('date', today)
        .single();

      const aiCreditsUsed = Math.ceil(embeddingResult.total_cost_usd * 1000); // Convert to credits (1 credit = $0.001)

      if (existingMetrics) {
        // Update existing metrics
        await (supabase as any)
          .from('usage_metrics')
          .update({
            ai_credits_used: existingMetrics.ai_credits_used + aiCreditsUsed,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingMetrics.id);
      } else {
        // Create new metrics
        await (supabase as any)
          .from('usage_metrics')
          .insert({
            creator_id,
            date: today,
            ai_credits_used: aiCreditsUsed,
            storage_used_bytes: 0,
            videos_uploaded: 0,
            total_video_duration_seconds: 0,
            transcription_minutes: 0,
            chat_messages_sent: 0,
            active_students: 0,
            metadata: {
              embedding_costs: {
                video_id,
                cost_usd: embeddingResult.total_cost_usd,
                tokens: embeddingResult.total_tokens,
                chunks: embeddingResult.chunks_processed,
              },
            },
          });
      }

      console.log(`[Embeddings] Updated usage metrics: ${aiCreditsUsed} credits`);
    });

    // Step 9: Update video status to completed
    await step.run('update-status-completed', async () => {
      const supabase = getServiceSupabase();

      await (supabase as any)
        .from('videos')
        .update({
          status: 'completed',
          processing_completed_at: new Date().toISOString(),
          metadata: {
            embedding_stats: {
              total_chunks: embeddingResult.chunks_processed,
              total_tokens: embeddingResult.total_tokens,
              cost_usd: embeddingResult.total_cost_usd,
              processing_time_ms: embeddingResult.processing_time_ms,
              model: embeddingResult.model,
            },
          },
        })
        .eq('id', video_id);

      console.log(`[Embeddings] Video ${video_id} processing completed`);
    });

    return {
      success: true,
      video_id,
      chunks_created: chunks.length,
      embeddings_generated: embeddingResult.embeddings.length,
      total_tokens: embeddingResult.total_tokens,
      cost_usd: embeddingResult.total_cost_usd,
      processing_time_ms: embeddingResult.processing_time_ms,
    };
  }
);

/**
 * Error handler for embedding generation failures
 */
export const handleEmbeddingFailure = inngest.createFunction(
  {
    id: 'handle-embedding-failure',
    name: 'Handle Embedding Generation Failure',
  },
  { event: 'inngest/function.failed' },
  async ({ event }) => {
    if (event.data.function_id !== 'generate-embeddings') {
      return;
    }

    const videoId = event.data.event.data.video_id;
    const error = event.data.error;

    console.error(`[Embeddings] Failed to generate embeddings for video ${videoId}:`, error);

    // Update video status to failed
    const supabase = getServiceSupabase();
    await (supabase as any)
      .from('videos')
      .update({
        status: 'failed',
        error_message: `Embedding generation failed: ${error.message || 'Unknown error'}`,
        processing_completed_at: new Date().toISOString(),
      })
      .eq('id', videoId);

    // TODO: Send notification to creator
    console.log(`[Embeddings] Marked video ${videoId} as failed`);
  }
);

/**
 * Batch reprocess embeddings for multiple videos
 */
export const batchReprocessEmbeddings = inngest.createFunction(
  {
    id: 'batch-reprocess-embeddings',
    name: 'Batch Reprocess Video Embeddings',
  },
  { event: 'video/embeddings.batch-reprocess' },
  async ({ event, step }) => {
    const { video_ids } = event.data;

    console.log(`[Embeddings] Batch reprocessing ${video_ids.length} videos`);

    const results = await step.run('reprocess-videos', async () => {
      const supabase = getServiceSupabase();

      const processed: string[] = [];
      const failed: string[] = [];

      for (const videoId of video_ids) {
        try {
          // Get video data
          const { data: video } = await (supabase as any)
            .from('videos')
            .select('id, transcript, creator_id')
            .eq('id', videoId)
            .single();

          if (!video || !video.transcript) {
            console.warn(`[Embeddings] Skipping video ${videoId}: no transcript`);
            failed.push(videoId);
            continue;
          }

          // Trigger embedding generation
          await inngest.send({
            name: 'video/transcription.completed',
            data: {
              video_id: videoId,
              creator_id: video.creator_id,
              transcript: video.transcript,
              skip_if_exists: false,
            },
          });

          processed.push(videoId);
          console.log(`[Embeddings] Triggered reprocessing for video ${videoId}`);
        } catch (error) {
          console.error(`[Embeddings] Failed to trigger reprocessing for video ${videoId}:`, error);
          failed.push(videoId);
        }
      }

      return { processed, failed };
    });

    return {
      success: true,
      total_requested: video_ids.length,
      processed_count: results.processed.length,
      failed_count: results.failed.length,
      processed: results.processed,
      failed: results.failed,
    };
  }
);
