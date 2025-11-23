import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fixCourseThumbnail() {
  const courseId = '861188ad-47c4-4603-ba21-f8b232b410a1';
  const testCreatorId = '00000000-0000-0000-0000-000000000001';

  // Get first video with a proper thumbnail from test creator
  console.log('Finding video with valid thumbnail...');
  const { data: videos, error: videoError } = await supabase
    .from('videos')
    .select('id, title, thumbnail_url')
    .eq('creator_id', testCreatorId)
    .not('thumbnail_url', 'is', null)
    .order('created_at', { ascending: false });

  if (videoError) {
    console.error('Error fetching videos:', videoError);
    return;
  }

  // Find a video with a proper URL thumbnail (not base64)
  const videoWithThumbnail = videos?.find(v =>
    v.thumbnail_url &&
    (v.thumbnail_url.startsWith('http://') || v.thumbnail_url.startsWith('https://'))
  );

  if (!videoWithThumbnail) {
    console.log('No video with valid URL thumbnail found');
    console.log('Videos found:', videos?.map(v => ({ title: v.title, hasThumb: !!v.thumbnail_url })));
    return;
  }

  console.log('Using thumbnail from video:', videoWithThumbnail.title);
  console.log('Thumbnail URL:', videoWithThumbnail.thumbnail_url);

  // Update the course
  const { error: updateError } = await supabase
    .from('courses')
    .update({ thumbnail_url: videoWithThumbnail.thumbnail_url })
    .eq('id', courseId);

  if (updateError) {
    console.error('Error updating course:', updateError);
    return;
  }

  console.log('Course thumbnail updated successfully!');

  // Verify
  const { data: course } = await supabase
    .from('courses')
    .select('title, thumbnail_url')
    .eq('id', courseId)
    .single();

  console.log('Updated course:', course?.title);
  console.log('New thumbnail:', course?.thumbnail_url);
}

fixCourseThumbnail();
