/**
 * Populate critical missing data using actual database IDs
 * This script queries existing data and creates the necessary enrollments and sessions
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env.local
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function populateCriticalData() {
  console.log('🔍 Fetching existing data from database...\n');

  // Get student
  const { data: students } = await supabase
    .from('students')
    .select('id, email, name')
    .limit(1);

  if (!students || students.length === 0) {
    console.error('❌ No students found in database');
    process.exit(1);
  }

  const student = students[0];
  console.log(`✅ Student: ${student.name} (${student.id})`);

  // Get courses
  const { data: courses } = await supabase
    .from('courses')
    .select('id, title')
    .limit(2);

  if (!courses || courses.length === 0) {
    console.error('❌ No courses found in database');
    process.exit(1);
  }

  console.log(`✅ Courses: ${courses.map(c => c.title).join(', ')}`);

  // Get videos
  const { data: videos } = await supabase
    .from('videos')
    .select('id, title')
    .limit(3);

  if (!videos || videos.length === 0) {
    console.error('❌ No videos found in database');
    process.exit(1);
  }

  console.log(`✅ Videos: ${videos.length} found`);

  console.log('\n📝 Creating enrollments and sessions...\n');

  // 1. Create student course enrollments
  const enrollments = courses.slice(0, 2).map((course, idx) => ({
    student_id: student.id,
    course_id: course.id,
    progress: idx === 0 ? 45 : 15,
    completed: false,
    last_accessed: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - (10 + idx * 5) * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { error: enrollError } = await supabase
    .from('student_courses')
    .upsert(enrollments, { onConflict: 'student_id,course_id' });

  if (enrollError) {
    console.error('❌ Error creating enrollments:', enrollError.message);
  } else {
    console.log(`✅ Created ${enrollments.length} course enrollments`);
  }

  // 2. Create video watch sessions
  const sessions = videos.slice(0, 3).map((video, idx) => ({
    student_id: student.id,
    video_id: video.id,
    session_start: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000).toISOString(),
    session_end: new Date(Date.now() - (idx + 1) * 24 * 60 * 60 * 1000 + 15 * 60 * 1000).toISOString(),
    watch_time_seconds: 900 - idx * 180,
    percent_complete: [60, 95, 45][idx],
    completed: idx === 1
  }));

  const { error: sessionsError } = await supabase
    .from('video_watch_sessions')
    .insert(sessions);

  if (sessionsError) {
    console.error('❌ Error creating watch sessions:', sessionsError.message);
  } else {
    console.log(`✅ Created ${sessions.length} watch sessions`);
  }

  // 3. Create chat sessions
  const chatSessions = [
    {
      student_id: student.id,
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Questions about Risk Management',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      student_id: student.id,
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Understanding Options Greeks',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];

  const { data: createdSessions, error: chatError } = await supabase
    .from('chat_sessions')
    .insert(chatSessions)
    .select('id');

  if (chatError) {
    console.error('❌ Error creating chat sessions:', chatError.message);
  } else {
    console.log(`✅ Created ${chatSessions.length} chat sessions`);

    // 4. Create chat messages for the sessions
    if (createdSessions && createdSessions.length > 0) {
      const messages = [];
      for (const session of createdSessions) {
        messages.push(
          {
            session_id: session.id,
            role: 'user',
            content: 'Can you explain the key concepts?',
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            session_id: session.id,
            role: 'assistant',
            content: 'Sure! Let me explain the key concepts from the videos.',
            video_references: JSON.stringify([]),
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30000).toISOString()
          }
        );
      }

      const { error: msgError } = await supabase
        .from('chat_messages')
        .insert(messages);

      if (msgError) {
        console.error('❌ Error creating chat messages:', msgError.message);
      } else {
        console.log(`✅ Created ${messages.length} chat messages`);
      }
    }
  }

  // 5. Verify
  console.log('\n🔍 Verifying data...\n');

  const { count: enrollmentCount } = await supabase
    .from('student_courses')
    .select('*', { count: 'exact', head: true });

  const { count: sessionCount } = await supabase
    .from('video_watch_sessions')
    .select('*', { count: 'exact', head: true });

  const { count: chatSessionCount } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true });

  const { count: chatMessageCount } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true });

  console.log(`✅ student_courses: ${enrollmentCount} rows`);
  console.log(`✅ video_watch_sessions: ${sessionCount} rows`);
  console.log(`✅ chat_sessions: ${chatSessionCount} rows`);
  console.log(`✅ chat_messages: ${chatMessageCount} rows`);

  console.log('\n🎉 Critical data populated successfully!');
  console.log('\n📝 Test student pages at:');
  console.log('   http://localhost:3000/dashboard/student');
  console.log('   http://localhost:3000/dashboard/student/courses');
  console.log('   http://localhost:3000/dashboard/student/chat');
}

populateCriticalData().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
