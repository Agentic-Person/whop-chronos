/**
 * Inngest Functions: Bulk Operations
 *
 * Background jobs for bulk video operations with progress tracking
 * - Bulk delete videos with cleanup
 * - Bulk export video metadata to CSV
 * - Bulk reprocess video embeddings
 */

import { inngest } from './client';
import { getServiceSupabase } from '@/lib/db/client';
import { deleteVideoFile, deleteThumbnailFile } from '@/lib/video/storage';
import { logger } from '@/lib/logger';

/**
 * Bulk delete videos
 * Processes in batches of 10 to avoid overwhelming database
 */
export const bulkDeleteVideosFunction = inngest.createFunction(
  {
    id: 'bulk-delete-videos',
    name: 'Bulk Delete Videos',
    retries: 1,
  },
  { event: 'videos/bulk.delete' },
  async ({ event, step }) => {
    const { operation_id, creator_id, video_ids } = event.data;

    logger.info('Starting bulk delete', {
      component: 'bulk-operations',
      operationId: operation_id,
      videoCount: video_ids.length,
    });

    // Step 1: Update operation status to in_progress
    await step.run('update-status-in-progress', async () => {
      const supabase = getServiceSupabase();

      await (supabase as any)
        .from('bulk_operations')
        .update({
          status: 'in_progress',
          progress_current: 0,
        })
        .eq('id', operation_id);
    });

    // Step 2: Process deletions in batches of 10
    const result = await step.run('process-deletions', async () => {
      const supabase = getServiceSupabase();
      const batchSize = 10;
      const deleted: string[] = [];
      const errors: Array<{ video_id: string; error: string }> = [];

      for (let i = 0; i < video_ids.length; i += batchSize) {
        const batch = video_ids.slice(i, i + batchSize);

        for (const videoId of batch) {
          try {
            // Fetch video to get storage paths
            const { data: video } = await supabase
              .from('videos')
              .select('*')
              .eq('id', videoId)
              .eq('creator_id', creator_id)
              .eq('is_deleted', false)
              .single();

            if (!video) {
              errors.push({ video_id: videoId, error: 'Video not found or already deleted' });
              continue;
            }

            // Delete storage files
            const deletePromises: Promise<boolean>[] = [];

            if ((video as any).storage_path) {
              deletePromises.push(deleteVideoFile((video as any).storage_path));
            }

            if ((video as any).thumbnail_url) {
              const thumbnailPath = (video as any).thumbnail_url.split('/').slice(-3).join('/');
              deletePromises.push(deleteThumbnailFile(thumbnailPath));
            }

            await Promise.allSettled(deletePromises);

            // Delete video chunks (will cascade if foreign key set up)
            await supabase.from('video_chunks').delete().eq('video_id', videoId);

            // Delete video record
            const { error: deleteError } = await supabase
              .from('videos')
              .delete()
              .eq('id', videoId)
              .eq('creator_id', creator_id);

            if (deleteError) {
              errors.push({ video_id: videoId, error: deleteError.message });
            } else {
              deleted.push(videoId);
            }
          } catch (error) {
            logger.error('Failed to delete video', error, {
              component: 'bulk-operations',
              videoId,
            });
            errors.push({
              video_id: videoId,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Update progress after each batch
        await (supabase as any)
          .from('bulk_operations')
          .update({
            progress_current: Math.min(i + batchSize, video_ids.length),
          })
          .eq('id', operation_id);

        logger.info('Batch deletion progress', {
          component: 'bulk-operations',
          operationId: operation_id,
          progress: `${Math.min(i + batchSize, video_ids.length)}/${video_ids.length}`,
        });
      }

      return { deleted, errors };
    });

    // Step 3: Update operation with final result
    await step.run('update-final-status', async () => {
      const supabase = getServiceSupabase();

      const status =
        result.errors.length === 0
          ? 'completed'
          : result.deleted.length === 0
            ? 'failed'
            : 'partial';

      await (supabase as any)
        .from('bulk_operations')
        .update({
          status,
          progress_current: video_ids.length,
          completed_at: new Date().toISOString(),
          result: {
            deleted: result.deleted.length,
            failed: result.errors.length,
            errors: result.errors,
          },
        })
        .eq('id', operation_id);

      logger.info('Bulk delete completed', {
        component: 'bulk-operations',
        operationId: operation_id,
        deleted: result.deleted.length,
        failed: result.errors.length,
      });
    });

    return {
      success: true,
      operation_id,
      deleted: result.deleted.length,
      failed: result.errors.length,
      errors: result.errors,
    };
  }
);

/**
 * Bulk export videos to CSV
 * Generates CSV and uploads to Supabase Storage
 */
export const bulkExportVideosFunction = inngest.createFunction(
  {
    id: 'bulk-export-videos',
    name: 'Bulk Export Videos',
    retries: 1,
  },
  { event: 'videos/bulk.export' },
  async ({ event, step }) => {
    const { operation_id, creator_id, video_ids } = event.data;

    logger.info('Starting bulk export', {
      component: 'bulk-operations',
      operationId: operation_id,
      videoCount: video_ids.length,
    });

    // Step 1: Update operation status to in_progress
    await step.run('update-status-in-progress', async () => {
      const supabase = getServiceSupabase();

      await (supabase as any)
        .from('bulk_operations')
        .update({
          status: 'in_progress',
          progress_current: 0,
        })
        .eq('id', operation_id);
    });

    // Step 2: Fetch all video metadata
    const videos = await step.run('fetch-videos', async () => {
      const supabase = getServiceSupabase();

      const { data, error } = await supabase
        .from('videos')
        .select(
          `
          id,
          title,
          description,
          status,
          duration_seconds,
          file_size_bytes,
          source_type,
          created_at,
          updated_at,
          transcript_language
        `
        )
        .in('id', video_ids)
        .eq('creator_id', creator_id)
        .eq('is_deleted', false);

      if (error) {
        throw new Error(`Failed to fetch videos: ${error.message}`);
      }

      return data || [];
    });

    // Step 3: Generate CSV
    const csvContent = await step.run('generate-csv', async () => {
      const headers = [
        'ID',
        'Title',
        'Description',
        'Status',
        'Duration (seconds)',
        'File Size (bytes)',
        'Source Type',
        'Created At',
        'Updated At',
        'Transcript Language',
      ];

      const rows = videos.map((video: any) => [
        video.id,
        `"${(video.title || '').replace(/"/g, '""')}"`,
        `"${(video.description || '').replace(/"/g, '""')}"`,
        video.status,
        video.duration_seconds || '',
        video.file_size_bytes || '',
        video.source_type || '',
        video.created_at,
        video.updated_at,
        video.transcript_language || '',
      ]);

      return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    });

    // Step 4: Upload CSV to Supabase Storage
    const downloadUrl = await step.run('upload-csv', async () => {
      const supabase = getServiceSupabase();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `exports/videos-export-${timestamp}.csv`;

      const { error } = await supabase.storage
        .from('videos')
        .upload(fileName, csvContent, {
          contentType: 'text/csv',
          upsert: false,
        });

      if (error) {
        throw new Error(`Failed to upload CSV: ${error.message}`);
      }

      // Generate signed URL valid for 24 hours
      const { data: urlData } = await supabase.storage
        .from('videos')
        .createSignedUrl(fileName, 86400);

      return urlData?.signedUrl || null;
    });

    // Step 5: Update operation with final result
    await step.run('update-final-status', async () => {
      const supabase = getServiceSupabase();

      await (supabase as any)
        .from('bulk_operations')
        .update({
          status: 'completed',
          progress_current: video_ids.length,
          completed_at: new Date().toISOString(),
          result: {
            exported: videos.length,
            download_url: downloadUrl,
          },
        })
        .eq('id', operation_id);

      logger.info('Bulk export completed', {
        component: 'bulk-operations',
        operationId: operation_id,
        exported: videos.length,
      });
    });

    return {
      success: true,
      operation_id,
      exported: videos.length,
      download_url: downloadUrl,
    };
  }
);

/**
 * Bulk reprocess video embeddings
 * Triggers embedding generation for multiple videos
 */
export const bulkReprocessVideosFunction = inngest.createFunction(
  {
    id: 'bulk-reprocess-videos',
    name: 'Bulk Reprocess Videos',
    retries: 1,
  },
  { event: 'videos/bulk.reprocess' },
  async ({ event, step }) => {
    const { operation_id, creator_id, video_ids } = event.data;

    logger.info('Starting bulk reprocess', {
      component: 'bulk-operations',
      operationId: operation_id,
      videoCount: video_ids.length,
    });

    // Step 1: Update operation status to in_progress
    await step.run('update-status-in-progress', async () => {
      const supabase = getServiceSupabase();

      await (supabase as any)
        .from('bulk_operations')
        .update({
          status: 'in_progress',
          progress_current: 0,
        })
        .eq('id', operation_id);
    });

    // Step 2: Trigger reprocessing for each video
    const result = await step.run('trigger-reprocessing', async () => {
      const supabase = getServiceSupabase();
      const processed: string[] = [];
      const errors: Array<{ video_id: string; error: string }> = [];

      for (let i = 0; i < video_ids.length; i++) {
        const videoId = video_ids[i];

        try {
          // Get video data
          const { data: video } = await supabase
            .from('videos')
            .select('id, transcript, creator_id, status')
            .eq('id', videoId)
            .eq('creator_id', creator_id)
            .eq('is_deleted', false)
            .single();

          if (!video) {
            errors.push({ video_id: videoId, error: 'Video not found' });
            continue;
          }

          if (!(video as any).transcript) {
            errors.push({ video_id: videoId, error: 'No transcript available' });
            continue;
          }

          // Trigger embedding generation
          await inngest.send({
            name: 'video/transcription.completed',
            data: {
              video_id: videoId,
              creator_id: (video as any).creator_id,
              transcript: (video as any).transcript,
              skip_if_exists: false,
            },
          });

          processed.push(videoId);
          logger.info('Triggered reprocessing', {
            component: 'bulk-operations',
            videoId,
          });
        } catch (error) {
          logger.error('Failed to trigger reprocessing', error, {
            component: 'bulk-operations',
            videoId,
          });
          errors.push({
            video_id: videoId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }

        // Update progress after each video
        await (supabase as any)
          .from('bulk_operations')
          .update({
            progress_current: i + 1,
          })
          .eq('id', operation_id);
      }

      return { processed, errors };
    });

    // Step 3: Update operation with final result
    await step.run('update-final-status', async () => {
      const supabase = getServiceSupabase();

      const status =
        result.errors.length === 0
          ? 'completed'
          : result.processed.length === 0
            ? 'failed'
            : 'partial';

      await (supabase as any)
        .from('bulk_operations')
        .update({
          status,
          progress_current: video_ids.length,
          completed_at: new Date().toISOString(),
          result: {
            processed: result.processed.length,
            failed: result.errors.length,
            errors: result.errors,
          },
        })
        .eq('id', operation_id);

      logger.info('Bulk reprocess completed', {
        component: 'bulk-operations',
        operationId: operation_id,
        processed: result.processed.length,
        failed: result.errors.length,
      });
    });

    return {
      success: true,
      operation_id,
      processed: result.processed.length,
      failed: result.errors.length,
      errors: result.errors,
    };
  }
);
