import 'dotenv/config';
import { getServiceSupabase } from '../lib/db/client';

async function checkDatabase() {
  const supabase = getServiceSupabase();

  console.log('\n=== VIDEOS ===');
  const { data: videos } = await supabase
    .from('videos')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(videos);

  console.log('\n=== COURSES ===');
  const { data: courses } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });
  console.log(courses);

  console.log('\n=== COURSE_MODULES ===');
  const { data: modules } = await supabase
    .from('course_modules')
    .select('*')
    .order('created_at', { ascending: false });
  console.log(modules);

  console.log('\n=== MODULE_LESSONS ===');
  const { data: lessons } = await supabase
    .from('module_lessons')
    .select('*')
    .order('created_at', { ascending: false });
  console.log(lessons);
}

checkDatabase();
