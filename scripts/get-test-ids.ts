import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getTestIds() {
  // Get a course with modules and lessons
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .limit(1);

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
    return;
  }

  if (!courses || courses.length === 0) {
    console.error('No courses found in database');
    return;
  }

  const courseId = courses[0].id;
  console.log('Course ID:', courseId);
  console.log('Course Title:', courses[0].title);

  // Get modules for this course
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('id, title')
    .eq('course_id', courseId)
    .limit(1);

  if (modulesError) {
    console.error('Error fetching modules:', modulesError);
    return;
  }

  if (!modules || modules.length === 0) {
    console.error('No modules found for course');
    return;
  }

  const moduleId = modules[0].id;
  console.log('Module ID:', moduleId);
  console.log('Module Title:', modules[0].title);

  // Get lessons for this module
  const { data: lessons, error: lessonsError } = await supabase
    .from('module_lessons')
    .select('id, video_id, lesson_order')
    .eq('module_id', moduleId)
    .order('lesson_order', { ascending: true })
    .limit(1);

  if (lessonsError) {
    console.error('Error fetching lessons:', lessonsError);
    return;
  }

  if (!lessons || lessons.length === 0) {
    console.error('No lessons found for module');
    return;
  }

  const videoId = lessons[0].video_id;
  console.log('Video ID:', videoId);

  // Get video details
  const { data: video, error: videoError } = await supabase
    .from('videos')
    .select('id, title, source_type')
    .eq('id', videoId)
    .single();

  if (videoError) {
    console.error('Error fetching video:', videoError);
    return;
  }

  console.log('Video Title:', video.title);
  console.log('Video Source:', video.source_type);

  console.log('\n=== TEST URL ===');
  console.log(`http://localhost:3007/dashboard/student/courses/${courseId}/lesson?videoId=${videoId}`);
}

getTestIds();
