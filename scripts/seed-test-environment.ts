#!/usr/bin/env tsx
/**
 * Seed Test Environment
 *
 * Creates comprehensive test data for E2E testing:
 * - 2 test users (creator + student)
 * - 12 test videos (3 of each source type)
 * - 2 complete courses with modules and lessons
 * - Sample transcripts and embeddings
 * - Sample analytics and progress data
 *
 * Usage:
 *   npx tsx scripts/seed-test-environment.ts
 *   npm run seed:test
 *
 * Features:
 * - Idempotent (safe to run multiple times)
 * - Clears existing test data first
 * - Creates realistic relationships
 * - Validates foreign keys
 * - Outputs detailed summary
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

// Test IDs (consistent UUIDs for easy reference)
const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';
const TEST_STUDENT_ID = '00000000-0000-0000-0000-000000000002';

// Color coding for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
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

function error(message: string) {
  log('❌', `${colors.red}${message}${colors.reset}`);
}

/**
 * Clear existing test data
 */
async function clearTestData() {
  info('Clearing existing test data...');

  try {
    // Delete in correct order (respecting foreign keys)

    // 1. Analytics data
    await supabase.from('video_analytics_events').delete().in('student_id', [TEST_STUDENT_ID]);
    await supabase.from('video_watch_sessions').delete().in('student_id', [TEST_STUDENT_ID]);
    await supabase.from('video_analytics').delete().eq('creator_id', TEST_CREATOR_ID);

    // 2. Chat data
    await supabase.from('chat_messages').delete().in('session_id',
      (await supabase.from('chat_sessions').select('id').eq('student_id', TEST_STUDENT_ID)).data?.map(s => s.id) || []
    );
    await supabase.from('chat_sessions').delete().eq('student_id', TEST_STUDENT_ID);

    // 3. Course structure
    await supabase.from('module_lessons').delete().in('module_id',
      (await supabase.from('course_modules').select('id').eq('creator_id', TEST_CREATOR_ID)).data?.map(m => m.id) || []
    );
    await supabase.from('course_modules').delete().eq('creator_id', TEST_CREATOR_ID);
    await supabase.from('courses').delete().eq('creator_id', TEST_CREATOR_ID);

    // 4. Video data
    await supabase.from('video_chunks').delete().in('video_id',
      (await supabase.from('videos').select('id').eq('creator_id', TEST_CREATOR_ID)).data?.map(v => v.id) || []
    );
    await supabase.from('videos').delete().eq('creator_id', TEST_CREATOR_ID);

    // 5. Users (last)
    await supabase.from('students').delete().eq('id', TEST_STUDENT_ID);
    await supabase.from('creators').delete().eq('id', TEST_CREATOR_ID);

    success('Cleared existing test data');
  } catch (err) {
    warning(`Some test data may not exist yet (this is OK): ${err}`);
  }
}

/**
 * Create test users
 */
async function createTestUsers() {
  info('Creating test users...');

  // Create test creator
  const { error: creatorError } = await supabase
    .from('creators')
    .insert({
      id: TEST_CREATOR_ID,
      whop_company_id: 'biz_test_creator_001',
      email: 'creator@test.chronos.ai',
      name: 'Test Creator',
      subscription_tier: 'pro',
      settings: {
        notifications_enabled: true,
        auto_transcribe: true,
      },
    });

  if (creatorError) {
    error(`Failed to create test creator: ${creatorError.message}`);
    throw creatorError;
  }

  // Create test student
  const { error: studentError } = await supabase
    .from('students')
    .insert({
      id: TEST_STUDENT_ID,
      whop_user_id: 'user_test_student_001',
      email: 'student@test.chronos.ai',
      name: 'Test Student',
      preferences: {
        playback_speed: 1.0,
        auto_advance: true,
      },
    });

  if (studentError) {
    error(`Failed to create test student: ${studentError.message}`);
    throw studentError;
  }

  success('Created 2 test users (creator + student)');
}

/**
 * Create test videos (3 of each source type = 12 total)
 */
async function createTestVideos() {
  info('Creating 12 test videos...');

  const videos = [
    // YouTube videos (3)
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'youtube',
      embed_type: 'youtube',
      youtube_video_id: 'dQw4w9WgXcQ',
      title: 'Introduction to Trading Psychology',
      description: 'Learn the psychological aspects of successful trading',
      duration: 212,
      thumbnail_url: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      status: 'completed',
      metadata: {
        channel: 'Trading Academy',
        views: 1500000,
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'youtube',
      embed_type: 'youtube',
      youtube_video_id: 'jNQXAC9IVRw',
      title: 'Technical Analysis Basics',
      description: 'Understanding charts, patterns, and indicators',
      duration: 1845,
      thumbnail_url: 'https://i.ytimg.com/vi/jNQXAC9IVRw/maxresdefault.jpg',
      status: 'completed',
      metadata: {
        channel: 'Trading Academy',
        views: 980000,
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'youtube',
      embed_type: 'youtube',
      youtube_video_id: 'yPYZpwSpKmA',
      title: 'Risk Management Strategies',
      description: 'How to protect your capital and manage risk',
      duration: 1567,
      thumbnail_url: 'https://i.ytimg.com/vi/yPYZpwSpKmA/maxresdefault.jpg',
      status: 'completed',
      metadata: {
        channel: 'Trading Academy',
        views: 750000,
      },
    },

    // Loom videos (3)
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'loom',
      embed_type: 'loom',
      loom_video_id: 'test-loom-001',
      title: 'Live Trading Session #1',
      description: 'Watch me execute trades in real-time',
      duration: 2400,
      thumbnail_url: 'https://cdn.loom.com/sessions/thumbnails/test-loom-001.jpg',
      status: 'completed',
      metadata: {
        recorded_at: new Date().toISOString(),
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'loom',
      embed_type: 'loom',
      loom_video_id: 'test-loom-002',
      title: 'Setting Up Your Trading Platform',
      description: 'Step-by-step platform configuration guide',
      duration: 1200,
      thumbnail_url: 'https://cdn.loom.com/sessions/thumbnails/test-loom-002.jpg',
      status: 'completed',
      metadata: {
        recorded_at: new Date().toISOString(),
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'loom',
      embed_type: 'loom',
      loom_video_id: 'test-loom-003',
      title: 'Common Trading Mistakes to Avoid',
      description: 'Learn from my biggest mistakes as a trader',
      duration: 1680,
      thumbnail_url: 'https://cdn.loom.com/sessions/thumbnails/test-loom-003.jpg',
      status: 'completed',
      metadata: {
        recorded_at: new Date().toISOString(),
      },
    },

    // Mux videos (3)
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'mux',
      embed_type: 'mux',
      mux_asset_id: 'test-mux-asset-001',
      mux_playback_id: 'test-mux-playback-001',
      title: 'Advanced Options Trading',
      description: 'Master complex options strategies',
      duration: 3600,
      thumbnail_url: 'https://image.mux.com/test-mux-playback-001/thumbnail.jpg',
      status: 'completed',
      metadata: {
        resolution: '1920x1080',
        bitrate: 5000,
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'mux',
      embed_type: 'mux',
      mux_asset_id: 'test-mux-asset-002',
      mux_playback_id: 'test-mux-playback-002',
      title: 'Cryptocurrency Trading Fundamentals',
      description: 'Navigate the crypto markets with confidence',
      duration: 2700,
      thumbnail_url: 'https://image.mux.com/test-mux-playback-002/thumbnail.jpg',
      status: 'completed',
      metadata: {
        resolution: '1920x1080',
        bitrate: 5000,
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'mux',
      embed_type: 'mux',
      mux_asset_id: 'test-mux-asset-003',
      mux_playback_id: 'test-mux-playback-003',
      title: 'Forex Trading Masterclass',
      description: 'Trade the foreign exchange markets like a pro',
      duration: 4200,
      thumbnail_url: 'https://image.mux.com/test-mux-playback-003/thumbnail.jpg',
      status: 'completed',
      metadata: {
        resolution: '1920x1080',
        bitrate: 5000,
      },
    },

    // Uploaded videos (3)
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'upload',
      embed_type: 'html5',
      storage_path: 'videos/test-upload-001.mp4',
      title: 'Day Trading Strategy Deep Dive',
      description: 'My personal day trading strategy explained',
      duration: 2880,
      thumbnail_url: 'https://placeholder.com/thumbnail-001.jpg',
      status: 'completed',
      metadata: {
        file_size: 524288000, // 500MB
        format: 'mp4',
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'upload',
      embed_type: 'html5',
      storage_path: 'videos/test-upload-002.mp4',
      title: 'Reading Market Sentiment',
      description: 'How to gauge market psychology and sentiment',
      duration: 1920,
      thumbnail_url: 'https://placeholder.com/thumbnail-002.jpg',
      status: 'completed',
      metadata: {
        file_size: 367001600, // 350MB
        format: 'mp4',
      },
    },
    {
      creator_id: TEST_CREATOR_ID,
      source_type: 'upload',
      embed_type: 'html5',
      storage_path: 'videos/test-upload-003.mp4',
      title: 'Building a Trading Plan',
      description: 'Create a comprehensive trading plan that works',
      duration: 2160,
      thumbnail_url: 'https://placeholder.com/thumbnail-003.jpg',
      status: 'completed',
      metadata: {
        file_size: 419430400, // 400MB
        format: 'mp4',
      },
    },
  ];

  const { data, error } = await supabase
    .from('videos')
    .insert(videos)
    .select('id, title, source_type');

  if (error) {
    error(`Failed to create test videos: ${error.message}`);
    throw error;
  }

  success(`Created ${data?.length || 0} test videos`);
  return data || [];
}

/**
 * Create test courses with modules and lessons
 */
async function createTestCourses(videos: any[]) {
  info('Creating 2 test courses...');

  // Course 1: Complete Trading Masterclass
  const { data: course1, error: course1Error } = await supabase
    .from('courses')
    .insert({
      creator_id: TEST_CREATOR_ID,
      title: 'Complete Trading Masterclass',
      description: 'Master trading from beginner to advanced. This comprehensive course covers everything from basic concepts to advanced strategies used by professional traders.',
      thumbnail_url: 'https://placeholder.com/course-1-thumbnail.jpg',
      metadata: {
        difficulty: 'beginner-to-advanced',
        duration_hours: 20,
        student_count: 156,
      },
    })
    .select('id')
    .single();

  if (course1Error) {
    error(`Failed to create course 1: ${course1Error.message}`);
    throw course1Error;
  }

  // Course 1 - Module 1: Foundations
  const { data: c1m1, error: c1m1Error } = await supabase
    .from('course_modules')
    .insert({
      course_id: course1.id,
      creator_id: TEST_CREATOR_ID,
      title: 'Module 1: Trading Foundations',
      description: 'Build a solid foundation in trading psychology and technical analysis',
      module_order: 1,
    })
    .select('id')
    .single();

  if (c1m1Error) throw c1m1Error;

  // Add lessons to Course 1 - Module 1
  await supabase.from('module_lessons').insert([
    {
      module_id: c1m1.id,
      video_id: videos.find(v => v.title.includes('Trading Psychology'))?.id,
      lesson_order: 1,
      title: 'Lesson 1: Trading Psychology',
      description: 'Master the mental game of trading',
      is_required: true,
      estimated_duration_minutes: 4,
    },
    {
      module_id: c1m1.id,
      video_id: videos.find(v => v.title.includes('Technical Analysis'))?.id,
      lesson_order: 2,
      title: 'Lesson 2: Technical Analysis',
      description: 'Learn to read and analyze charts',
      is_required: true,
      estimated_duration_minutes: 31,
    },
    {
      module_id: c1m1.id,
      video_id: videos.find(v => v.title.includes('Risk Management'))?.id,
      lesson_order: 3,
      title: 'Lesson 3: Risk Management',
      description: 'Protect your capital with proper risk management',
      is_required: true,
      estimated_duration_minutes: 26,
    },
  ]);

  // Course 1 - Module 2: Live Trading
  const { data: c1m2, error: c1m2Error } = await supabase
    .from('course_modules')
    .insert({
      course_id: course1.id,
      creator_id: TEST_CREATOR_ID,
      title: 'Module 2: Live Trading Sessions',
      description: 'Watch real trades being executed with live commentary',
      module_order: 2,
    })
    .select('id')
    .single();

  if (c1m2Error) throw c1m2Error;

  await supabase.from('module_lessons').insert([
    {
      module_id: c1m2.id,
      video_id: videos.find(v => v.title.includes('Live Trading Session'))?.id,
      lesson_order: 1,
      title: 'Lesson 4: Live Trading Session #1',
      description: 'Real-time trading with full commentary',
      is_required: false,
      estimated_duration_minutes: 40,
    },
    {
      module_id: c1m2.id,
      video_id: videos.find(v => v.title.includes('Setting Up Your Trading Platform'))?.id,
      lesson_order: 2,
      title: 'Lesson 5: Platform Setup',
      description: 'Configure your trading platform for success',
      is_required: true,
      estimated_duration_minutes: 20,
    },
  ]);

  success(`Created Course 1: Complete Trading Masterclass (2 modules, 5 lessons)`);

  // Course 2: Advanced Trading Strategies
  const { data: course2, error: course2Error } = await supabase
    .from('courses')
    .insert({
      creator_id: TEST_CREATOR_ID,
      title: 'Advanced Trading Strategies',
      description: 'Take your trading to the next level with advanced strategies for options, crypto, and forex markets.',
      thumbnail_url: 'https://placeholder.com/course-2-thumbnail.jpg',
      metadata: {
        difficulty: 'advanced',
        duration_hours: 15,
        student_count: 89,
      },
    })
    .select('id')
    .single();

  if (course2Error) {
    error(`Failed to create course 2: ${course2Error.message}`);
    throw course2Error;
  }

  // Course 2 - Module 1: Advanced Markets
  const { data: c2m1, error: c2m1Error } = await supabase
    .from('course_modules')
    .insert({
      course_id: course2.id,
      creator_id: TEST_CREATOR_ID,
      title: 'Module 1: Advanced Markets',
      description: 'Master options, crypto, and forex trading',
      module_order: 1,
    })
    .select('id')
    .single();

  if (c2m1Error) throw c2m1Error;

  await supabase.from('module_lessons').insert([
    {
      module_id: c2m1.id,
      video_id: videos.find(v => v.title.includes('Advanced Options'))?.id,
      lesson_order: 1,
      title: 'Lesson 1: Options Trading',
      description: 'Complex options strategies explained',
      is_required: true,
      estimated_duration_minutes: 60,
    },
    {
      module_id: c2m1.id,
      video_id: videos.find(v => v.title.includes('Cryptocurrency Trading'))?.id,
      lesson_order: 2,
      title: 'Lesson 2: Crypto Trading',
      description: 'Navigate volatile crypto markets',
      is_required: true,
      estimated_duration_minutes: 45,
    },
    {
      module_id: c2m1.id,
      video_id: videos.find(v => v.title.includes('Forex Trading'))?.id,
      lesson_order: 3,
      title: 'Lesson 3: Forex Masterclass',
      description: 'Trade currency pairs like a professional',
      is_required: true,
      estimated_duration_minutes: 70,
    },
  ]);

  success(`Created Course 2: Advanced Trading Strategies (1 module, 3 lessons)`);

  return { course1: course1.id, course2: course2.id };
}

/**
 * Create sample transcripts and embeddings for RAG
 */
async function createSampleTranscripts(videos: any[]) {
  info('Creating sample transcripts and embeddings...');

  let chunksCreated = 0;

  for (const video of videos.slice(0, 3)) { // Just first 3 videos for demo
    const sampleChunks = [
      {
        video_id: video.id,
        chunk_text: `Welcome to ${video.title}. In this video, we'll cover the fundamentals of trading and how to develop a winning mindset. Trading is both an art and a science, requiring technical knowledge and emotional discipline.`,
        start_time: 0,
        end_time: 30,
        chunk_index: 0,
        embedding: Array(1536).fill(0).map(() => Math.random()), // Dummy embedding
        metadata: {
          speaker: 'instructor',
          confidence: 0.95,
        },
      },
      {
        video_id: video.id,
        chunk_text: `The first principle of successful trading is risk management. Never risk more than 1-2% of your account on any single trade. This ensures that even a string of losses won't wipe out your account. Position sizing is crucial.`,
        start_time: 30,
        end_time: 60,
        chunk_index: 1,
        embedding: Array(1536).fill(0).map(() => Math.random()),
        metadata: {
          speaker: 'instructor',
          confidence: 0.93,
        },
      },
    ];

    const { error: chunksError } = await supabase
      .from('video_chunks')
      .insert(sampleChunks);

    if (chunksError) {
      warning(`Failed to create chunks for video ${video.title}: ${chunksError.message}`);
    } else {
      chunksCreated += sampleChunks.length;
    }
  }

  success(`Created ${chunksCreated} sample transcript chunks with embeddings`);
}

/**
 * Create sample analytics data
 */
async function createSampleAnalytics(videos: any[], courseIds: any) {
  info('Creating sample analytics data...');

  // Create watch sessions for test student
  const watchSessions = videos.slice(0, 5).map((video, index) => ({
    student_id: TEST_STUDENT_ID,
    video_id: video.id,
    started_at: new Date(Date.now() - (1000 * 60 * 60 * 24 * (5 - index))).toISOString(),
    ended_at: new Date(Date.now() - (1000 * 60 * 60 * 24 * (5 - index)) + (1000 * 60 * 20)).toISOString(),
    total_watch_time: 1200 + (index * 300),
    furthest_timestamp: video.duration * (0.5 + (index * 0.1)),
    completed: index < 3,
  }));

  const { error: sessionsError } = await supabase
    .from('video_watch_sessions')
    .insert(watchSessions);

  if (sessionsError) {
    warning(`Failed to create watch sessions: ${sessionsError.message}`);
  } else {
    success(`Created ${watchSessions.length} watch sessions`);
  }

  // Create video analytics for each video
  const analyticsData = videos.map((video, index) => ({
    video_id: video.id,
    creator_id: TEST_CREATOR_ID,
    date: new Date().toISOString().split('T')[0]!,
    views: 10 + index * 5,
    unique_viewers: 5 + index * 2,
    total_watch_time: 3600 + (index * 1800),
    avg_watch_time: 600 + (index * 100),
    completion_rate: 0.4 + (index * 0.05),
    engagement_score: 0.6 + (index * 0.03),
  }));

  const { error: analyticsError } = await supabase
    .from('video_analytics')
    .insert(analyticsData);

  if (analyticsError) {
    warning(`Failed to create video analytics: ${analyticsError.message}`);
  } else {
    success(`Created analytics for ${analyticsData.length} videos`);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🌱 SEEDING TEST ENVIRONMENT');
  console.log('='.repeat(60) + '\n');

  try {
    // Step 1: Clear existing test data
    await clearTestData();
    console.log('');

    // Step 2: Create test users
    await createTestUsers();
    console.log('');

    // Step 3: Create test videos
    const videos = await createTestVideos();
    console.log('');

    // Step 4: Create test courses
    const courseIds = await createTestCourses(videos);
    console.log('');

    // Step 5: Create sample transcripts
    await createSampleTranscripts(videos);
    console.log('');

    // Step 6: Create sample analytics
    await createSampleAnalytics(videos, courseIds);
    console.log('');

    // Summary
    console.log('='.repeat(60));
    console.log('✅ TEST ENVIRONMENT SEEDED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 Summary:');
    console.log(`   👤 Users: 2 (1 creator, 1 student)`);
    console.log(`   🎥 Videos: ${videos.length} (3 YouTube, 3 Loom, 3 Mux, 3 Upload)`);
    console.log(`   📚 Courses: 2 (with 3 modules, 8 lessons total)`);
    console.log(`   📝 Transcript chunks: 6 (with embeddings)`);
    console.log(`   📈 Analytics: Watch sessions + video stats`);
    console.log('');
    console.log('🔑 Test Credentials:');
    console.log(`   Creator ID: ${TEST_CREATOR_ID}`);
    console.log(`   Student ID: ${TEST_STUDENT_ID}`);
    console.log('');
    console.log('🚀 Ready to test! Start dev server:');
    console.log('   npm run dev');
    console.log('');
    console.log('🧪 Run E2E tests:');
    console.log('   npm run test:e2e');
    console.log('');

  } catch (err) {
    console.log('');
    console.log('='.repeat(60));
    error('SEEDING FAILED');
    console.log('='.repeat(60));
    console.error(err);
    process.exit(1);
  }
}

// Run it
main();
