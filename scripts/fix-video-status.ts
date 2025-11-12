import 'dotenv/config';
import { getServiceSupabase } from '../lib/db/client';

const videoId = '697e9111-9895-45b1-b7ce-93b1478d45e0';

async function fixVideo() {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('videos')
    .update({
      status: 'completed',
      processing_completed_at: new Date().toISOString(),
    })
    .eq('id', videoId)
    .select();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Video marked as completed:', data);
  }
}

fixVideo();
