import { createClient } from '@supabase/supabase-js';

async function getVideos() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, title, source_type, youtube_video_id, mux_playback_id')
    .limit(5);

  if (videosError) {
    console.error('Videos error:', videosError);
    return;
  }

  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .limit(5);

  if (coursesError) {
    console.error('Courses error:', coursesError);
    return;
  }

  console.log('Videos:', JSON.stringify(videos, null, 2));
  console.log('Courses:', JSON.stringify(courses, null, 2));
}

getVideos();
