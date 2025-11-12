import 'dotenv/config';
import { getServiceSupabase } from '../lib/db/client';

const CREATOR_ID = 'e5f9d8c7-4b3a-4e2d-9f1a-8c7b6a5d4e3f';
const VIDEO_ID = '697e9111-9895-45b1-b7ce-93b1478d45e0'; // The completed one

async function seed() {
  const supabase = getServiceSupabase();

  // Create course
  const { data: course, error: courseError } = await supabase
    .from('courses')
    .insert({
      creator_id: CREATOR_ID,
      title: 'Test Course - YouTube Import',
      description: 'Testing YouTube video embedding',
      is_published: true,
      display_order: 1,
    })
    .select()
    .single();

  if (courseError) {
    console.error('Course error:', courseError);
    return;
  }

  console.log('Created course:', course);

  // Create module
  const { data: module, error: moduleError } = await supabase
    .from('course_modules')
    .insert({
      course_id: course.id,
      title: 'Module 1: Introduction',
      description: 'First module',
      display_order: 1,
    })
    .select()
    .single();

  if (moduleError) {
    console.error('Module error:', moduleError);
    return;
  }

  console.log('Created module:', module);

  // Create lesson
  const { data: lesson, error: lessonError } = await supabase
    .from('module_lessons')
    .insert({
      module_id: module.id,
      title: 'Lesson 1: Me at the zoo',
      lesson_type: 'video',
      video_id: VIDEO_ID,
      display_order: 1,
      is_published: true,
    })
    .select()
    .single();

  if (lessonError) {
    console.error('Lesson error:', lessonError);
    return;
  }

  console.log('Created lesson:', lesson);
  console.log('\n✅ Test course created successfully!');
  console.log(`Course ID: ${course.id}`);
}

seed();
