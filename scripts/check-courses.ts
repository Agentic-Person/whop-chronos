import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkCourses() {
  console.log('=== COURSES ===');
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title, creator_id, is_published, is_deleted')
    .order('created_at', { ascending: false });

  if (coursesError) {
    console.error('Error fetching courses:', coursesError);
    return;
  }

  if (!courses || courses.length === 0) {
    console.log('No courses found in database!');
    return;
  }

  console.log(`Found ${courses.length} courses:\n`);
  for (const course of courses) {
    console.log(`Title: ${course.title}`);
    console.log(`  ID: ${course.id}`);
    console.log(`  Creator: ${course.creator_id}`);
    console.log(`  Published: ${course.is_published}`);
    console.log(`  Deleted: ${course.is_deleted}`);
    console.log('');
  }

  // Check if any are published
  const published = courses.filter(c => c.is_published && !c.is_deleted);
  console.log(`\nPublished courses (visible to students): ${published.length}`);

  // Check test creator's courses
  const testCreatorId = '00000000-0000-0000-0000-000000000001';
  const testCreatorCourses = courses.filter(c => c.creator_id === testCreatorId);
  console.log(`Test creator's courses: ${testCreatorCourses.length}`);
}

checkCourses();
