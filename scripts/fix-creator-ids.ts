/**
 * Fix Creator IDs Script
 *
 * Updates all courses in the database to use the dev creator ID
 * from AuthContext: 00000000-0000-0000-0000-000000000001
 */

import 'dotenv/config';
import { getServiceSupabase } from '../lib/db/client';

const DEV_CREATOR_ID = '00000000-0000-0000-0000-000000000001';

async function fixCreatorIds() {
  console.log('🔧 Fixing creator IDs in database...\n');

  const supabase = getServiceSupabase();

  // Get all courses
  const { data: courses, error: fetchError } = await supabase
    .from('courses')
    .select('id, title, creator_id')
    .eq('is_deleted', false);

  if (fetchError) {
    console.error('❌ Error fetching courses:', fetchError);
    process.exit(1);
  }

  if (!courses || courses.length === 0) {
    console.log('✅ No courses found in database');
    return;
  }

  console.log(`📚 Found ${courses.length} courses:\n`);

  for (const course of courses) {
    const needsUpdate = course.creator_id !== DEV_CREATOR_ID;
    console.log(`  - "${course.title}"`);
    console.log(`    ID: ${course.id}`);
    console.log(`    Current creator_id: ${course.creator_id}`);
    console.log(`    Status: ${needsUpdate ? '❌ NEEDS UPDATE' : '✅ OK'}\n`);
  }

  // Update all courses to use the dev creator ID
  const { error: updateError } = await supabase
    .from('courses')
    .update({ creator_id: DEV_CREATOR_ID })
    .eq('is_deleted', false)
    .neq('creator_id', DEV_CREATOR_ID);

  if (updateError) {
    console.error('❌ Error updating courses:', updateError);
    process.exit(1);
  }

  console.log('✅ Successfully updated all courses to use dev creator ID');
  console.log(`   Creator ID: ${DEV_CREATOR_ID}\n`);
}

fixCreatorIds()
  .then(() => {
    console.log('✨ Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
