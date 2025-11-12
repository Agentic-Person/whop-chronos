import 'dotenv/config';
import { inngest } from '../inngest/client';
import { getServiceSupabase } from '../lib/db/client';

/**
 * Manually trigger embedding generation for stuck videos
 */
async function triggerEmbeddings() {
  const supabase = getServiceSupabase();

  // Get all videos stuck in 'transcribing' status
  const { data: stuckVideos, error } = await supabase
    .from('videos')
    .select('id, title, creator_id, transcript, status')
    .eq('status', 'transcribing')
    .not('transcript', 'is', null);

  if (error) {
    console.error('Error fetching stuck videos:', error);
    return;
  }

  if (!stuckVideos || stuckVideos.length === 0) {
    console.log('No stuck videos found');
    return;
  }

  console.log(`Found ${stuckVideos.length} stuck videos`);

  for (const video of stuckVideos) {
    console.log(`\nTriggering embeddings for: ${video.title} (${video.id})`);

    try {
      await inngest.send({
        name: 'video/transcription.completed',
        data: {
          video_id: video.id,
          creator_id: video.creator_id,
          transcript: video.transcript,
        },
      });

      console.log(`✓ Event sent for video ${video.id}`);
    } catch (err) {
      console.error(`✗ Failed to send event for video ${video.id}:`, err);
    }
  }

  console.log('\n✅ Done! Check Inngest Dev Server at http://localhost:8288');
}

triggerEmbeddings();
