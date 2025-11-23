import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Videos to KEEP (Rick Astley videos for test creator)
const KEEP_VIDEO_IDS = [
  '87bb4877-f898-4a60-b26f-4e61e2faa20a', // Rick Astley - Everlong (Foo Fighters Cover)
  'e9996475-ee18-4975-b817-6a29ddb53987', // Rick Astley - Never Gonna Give You Up
];

const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';

async function cleanupVideos() {
  console.log('Fetching all videos...');

  const { data: allVideos, error: fetchError } = await supabase
    .from('videos')
    .select('id, title, creator_id, status')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Error fetching videos:', fetchError);
    return;
  }

  console.log('\n=== Current Videos in Database ===');
  allVideos.forEach(v => {
    const keep = KEEP_VIDEO_IDS.includes(v.id);
    console.log(`${keep ? '✅ KEEP' : '❌ DELETE'}: ${v.title}`);
    console.log(`   ID: ${v.id}`);
    console.log(`   Creator: ${v.creator_id}`);
    console.log(`   Status: ${v.status}`);
  });

  // Find videos to delete (not in keep list)
  const videosToDelete = allVideos.filter(v => !KEEP_VIDEO_IDS.includes(v.id));

  if (videosToDelete.length === 0) {
    console.log('\n✅ No videos to delete. Database is already clean.');
    return;
  }

  console.log(`\n=== Deleting ${videosToDelete.length} videos ===`);

  for (const video of videosToDelete) {
    console.log(`Deleting: ${video.title} (${video.id})...`);

    // Delete video chunks first (foreign key constraint)
    const { error: chunkError } = await supabase
      .from('video_chunks')
      .delete()
      .eq('video_id', video.id);

    if (chunkError) {
      console.error(`  Error deleting chunks: ${chunkError.message}`);
    }

    // Delete the video
    const { error: videoError } = await supabase
      .from('videos')
      .delete()
      .eq('id', video.id);

    if (videoError) {
      console.error(`  Error deleting video: ${videoError.message}`);
    } else {
      console.log(`  ✅ Deleted`);
    }
  }

  // Verify final state
  console.log('\n=== Final Video List ===');
  const { data: remainingVideos } = await supabase
    .from('videos')
    .select('id, title, status')
    .order('created_at', { ascending: false });

  remainingVideos?.forEach(v => {
    console.log(`✅ ${v.title} (${v.status})`);
  });

  console.log(`\n✅ Cleanup complete. ${remainingVideos?.length || 0} videos remaining.`);
}

cleanupVideos();
