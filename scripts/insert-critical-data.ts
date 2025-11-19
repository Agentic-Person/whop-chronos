/**
 * Insert critical missing data to fix student page timeouts
 * Only inserts student_courses enrollments and video_watch_sessions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertCriticalData() {
  console.log('🚀 Inserting critical data for student pages...\n');

  try {
    // 1. Insert student course enrollments
    console.log('📚 Inserting student course enrollments...');
    const { data: enrollments, error: enrollError } = await supabase
      .from('student_courses')
      .upsert([
        {
          id: '70000000-0000-0000-0000-000000000001',
          student_id: '00000000-0000-0000-0000-000000000002',
          course_id: '10000000-0000-0000-0000-000000000001',
          progress: 45,
          completed: false,
          last_accessed: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '70000000-0000-0000-0000-000000000002',
          student_id: '00000000-0000-0000-0000-000000000002',
          course_id: '10000000-0000-0000-0000-000000000002',
          progress: 15,
          completed: false,
          last_accessed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        }
      ], {
        onConflict: 'id'
      });

    if (enrollError) {
      console.error('   ❌ Error inserting enrollments:', enrollError.message);
    } else {
      console.log('   ✅ Inserted 2 student course enrollments');
    }

    // 2. Insert video watch sessions
    console.log('\n🎥 Inserting video watch sessions...');
    const { data: sessions, error: sessionsError } = await supabase
      .from('video_watch_sessions')
      .upsert([
        {
          id: '80000000-0000-0000-0000-000000000001',
          student_id: '00000000-0000-0000-0000-000000000002',
          video_id: '20000000-0000-0000-0000-000000000001',
          start_time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
          watch_time_seconds: 3600,
          furthest_point_seconds: 3600,
          completed: true,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '80000000-0000-0000-0000-000000000002',
          student_id: '00000000-0000-0000-0000-000000000002',
          video_id: '20000000-0000-0000-0000-000000000002',
          start_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
          watch_time_seconds: 1800,
          furthest_point_seconds: 2400,
          completed: false,
          created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '80000000-0000-0000-0000-000000000003',
          student_id: '00000000-0000-0000-0000-000000000002',
          video_id: '20000000-0000-0000-0000-000000000003',
          start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 24 * 60 * 60 * 1000 + 20 * 60 * 1000).toISOString(),
          watch_time_seconds: 1200,
          furthest_point_seconds: 1500,
          completed: false,
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        }
      ], {
        onConflict: 'id'
      });

    if (sessionsError) {
      console.error('   ❌ Error inserting watch sessions:', sessionsError.message);
    } else {
      console.log('   ✅ Inserted 3 video watch sessions');
    }

    // 3. Verify data was inserted
    console.log('\n🔍 Verifying data...');
    const { count: enrollmentCount } = await supabase
      .from('student_courses')
      .select('*', { count: 'exact', head: true });

    const { count: sessionCount } = await supabase
      .from('video_watch_sessions')
      .select('*', { count: 'exact', head: true });

    console.log(`   ✅ student_courses: ${enrollmentCount} rows`);
    console.log(`   ✅ video_watch_sessions: ${sessionCount} rows`);

    console.log('\n✅ Critical data inserted successfully!');
    console.log('\n📝 Test accounts:');
    console.log('   Creator ID: 00000000-0000-0000-0000-000000000001');
    console.log('   Student ID: 00000000-0000-0000-0000-000000000002');
    console.log('\n🎯 Student pages should now load without timeout!');

  } catch (error: any) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

insertCriticalData();
