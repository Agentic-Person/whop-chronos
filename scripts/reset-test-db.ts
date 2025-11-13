#!/usr/bin/env tsx
/**
 * Reset Test Database
 *
 * Quickly delete all test data for a clean slate.
 * Only deletes records with test IDs - safe for production data.
 *
 * Usage:
 *   npx tsx scripts/reset-test-db.ts
 *   npm run db:reset:test
 *
 * Features:
 * - Fast (<5 seconds)
 * - Safe (only deletes test data)
 * - Respects foreign keys (deletes in correct order)
 * - Idempotent (safe to run multiple times)
 */

import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test IDs
const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';
const TEST_STUDENT_ID = '00000000-0000-0000-0000-000000000002';

// Color coding
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

function success(message: string) {
  log('✅', `${colors.green}${message}${colors.reset}`);
}

function info(message: string) {
  log('ℹ️', `${colors.blue}${message}${colors.reset}`);
}

function warning(message: string) {
  log('⚠️', `${colors.yellow}${message}${colors.reset}`);
}

async function resetTestData() {
  console.log('\n' + '='.repeat(60));
  console.log('🗑️  RESETTING TEST DATABASE');
  console.log('='.repeat(60) + '\n');

  const startTime = Date.now();
  let deletedCounts: Record<string, number> = {};

  try {
    // Delete in correct order (respecting foreign keys)

    info('Deleting analytics data...');
    const { count: events } = await supabase
      .from('video_analytics_events')
      .delete({ count: 'exact' })
      .in('student_id', [TEST_STUDENT_ID]);
    deletedCounts['video_analytics_events'] = events || 0;

    const { count: sessions } = await supabase
      .from('video_watch_sessions')
      .delete({ count: 'exact' })
      .in('student_id', [TEST_STUDENT_ID]);
    deletedCounts['video_watch_sessions'] = sessions || 0;

    const { count: videoAnalytics } = await supabase
      .from('video_analytics')
      .delete({ count: 'exact' })
      .eq('creator_id', TEST_CREATOR_ID);
    deletedCounts['video_analytics'] = videoAnalytics || 0;

    info('Deleting chat data...');
    // Get chat session IDs first
    const { data: chatSessions } = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('student_id', TEST_STUDENT_ID);

    if (chatSessions && chatSessions.length > 0) {
      const sessionIds = chatSessions.map(s => s.id);
      const { count: messages } = await supabase
        .from('chat_messages')
        .delete({ count: 'exact' })
        .in('session_id', sessionIds);
      deletedCounts['chat_messages'] = messages || 0;
    }

    const { count: chatSessionsCount } = await supabase
      .from('chat_sessions')
      .delete({ count: 'exact' })
      .eq('student_id', TEST_STUDENT_ID);
    deletedCounts['chat_sessions'] = chatSessionsCount || 0;

    info('Deleting course structure...');
    // Get module IDs first
    const { data: modules } = await supabase
      .from('course_modules')
      .select('id')
      .eq('creator_id', TEST_CREATOR_ID);

    if (modules && modules.length > 0) {
      const moduleIds = modules.map(m => m.id);
      const { count: lessons } = await supabase
        .from('module_lessons')
        .delete({ count: 'exact' })
        .in('module_id', moduleIds);
      deletedCounts['module_lessons'] = lessons || 0;
    }

    const { count: modulesCount } = await supabase
      .from('course_modules')
      .delete({ count: 'exact' })
      .eq('creator_id', TEST_CREATOR_ID);
    deletedCounts['course_modules'] = modulesCount || 0;

    const { count: courses } = await supabase
      .from('courses')
      .delete({ count: 'exact' })
      .eq('creator_id', TEST_CREATOR_ID);
    deletedCounts['courses'] = courses || 0;

    info('Deleting video data...');
    // Get video IDs first
    const { data: videos } = await supabase
      .from('videos')
      .select('id')
      .eq('creator_id', TEST_CREATOR_ID);

    if (videos && videos.length > 0) {
      const videoIds = videos.map(v => v.id);
      const { count: chunks } = await supabase
        .from('video_chunks')
        .delete({ count: 'exact' })
        .in('video_id', videoIds);
      deletedCounts['video_chunks'] = chunks || 0;
    }

    const { count: videosCount } = await supabase
      .from('videos')
      .delete({ count: 'exact' })
      .eq('creator_id', TEST_CREATOR_ID);
    deletedCounts['videos'] = videosCount || 0;

    info('Deleting users...');
    const { count: students } = await supabase
      .from('students')
      .delete({ count: 'exact' })
      .eq('id', TEST_STUDENT_ID);
    deletedCounts['students'] = students || 0;

    const { count: creators } = await supabase
      .from('creators')
      .delete({ count: 'exact' })
      .eq('id', TEST_CREATOR_ID);
    deletedCounts['creators'] = creators || 0;

    const elapsedTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ TEST DATABASE RESET COMPLETE');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 Deleted Records:');
    Object.entries(deletedCounts).forEach(([table, count]) => {
      if (count > 0) {
        console.log(`   ${table}: ${count}`);
      }
    });
    console.log('');
    console.log(`⏱️  Time: ${elapsedTime}s`);
    console.log('');
    console.log('🌱 Ready to seed fresh data:');
    console.log('   npm run seed:test');
    console.log('');

  } catch (err) {
    console.log('');
    console.log('='.repeat(60));
    console.log('❌ RESET FAILED');
    console.log('='.repeat(60));
    console.error(err);
    process.exit(1);
  }
}

// Run it
resetTestData();
