import { config } from 'dotenv';

// Load environment variables BEFORE importing anything else
config({ path: '.env.local' });

import { getServiceSupabase } from '../lib/db/client';

async function queryVideos() {
  const supabase = getServiceSupabase();

  const { data, error } = await (supabase as any)
    .from('videos')
    .select('id, title, source_type, status, youtube_video_id, embed_id, mux_playback_id, duration_seconds, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error querying videos:', error);
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

queryVideos();
