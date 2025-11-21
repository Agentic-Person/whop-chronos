#!/usr/bin/env node
/**
 * Complete Database Cleanup Script
 *
 * Deletes ALL videos, courses, chat sessions, and related data
 * for the test creator account in local development.
 *
 * Usage: npx tsx scripts/cleanup-all-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test creator ID (from DEV_BYPASS_AUTH - see lib/contexts/AuthContext.tsx line 57)
const TEST_CREATOR_ID = '00000000-0000-0000-0000-000000000001';

interface CleanupStats {
  videos: {
    total: number;
    stuck: number;
    deleted: number;
  };
  courses: {
    total: number;
    deleted: number;
  };
  chatSessions: {
    total: number;
    deleted: number;
  };
  analyticsCache: {
    total: number;
    deleted: number;
  };
  bulkOperations: {
    total: number;
    deleted: number;
  };
}

async function main() {
  console.log('🧹 Starting complete database cleanup...\n');
  console.log(`Creator ID: ${TEST_CREATOR_ID}\n`);

  const stats: CleanupStats = {
    videos: { total: 0, stuck: 0, deleted: 0 },
    courses: { total: 0, deleted: 0 },
    chatSessions: { total: 0, deleted: 0 },
    analyticsCache: { total: 0, deleted: 0 },
    bulkOperations: { total: 0, deleted: 0 },
  };

  // Phase 1: Count existing records
  console.log('📊 Phase 1: Counting records...\n');

  // Count videos
  const { data: videos, error: videosError } = await supabase
    .from('videos')
    .select('id, status, title')
    .eq('creator_id', TEST_CREATOR_ID);

  if (videosError) {
    console.error('❌ Error counting videos:', videosError);
  } else {
    stats.videos.total = videos?.length || 0;
    stats.videos.stuck = videos?.filter(v => v.status === 'processing').length || 0;
    console.log(`Videos: ${stats.videos.total} total, ${stats.videos.stuck} stuck at 50%`);

    if (videos && videos.length > 0) {
      console.log('   Video titles:');
      videos.forEach(v => console.log(`   - ${v.title} (${v.status})`));
    }
  }

  // Count courses
  const { data: courses, error: coursesError } = await supabase
    .from('courses')
    .select('id, title')
    .eq('creator_id', TEST_CREATOR_ID);

  if (coursesError) {
    console.error('❌ Error counting courses:', coursesError);
  } else {
    stats.courses.total = courses?.length || 0;
    console.log(`Courses: ${stats.courses.total} total`);

    if (courses && courses.length > 0) {
      console.log('   Course titles:');
      courses.forEach(c => console.log(`   - ${c.title}`));
    }
  }

  // Count chat sessions
  const { data: sessions, error: sessionsError } = await supabase
    .from('chat_sessions')
    .select('id, title')
    .eq('creator_id', TEST_CREATOR_ID);

  if (sessionsError) {
    console.error('❌ Error counting chat sessions:', sessionsError);
  } else {
    stats.chatSessions.total = sessions?.length || 0;
    console.log(`Chat Sessions: ${stats.chatSessions.total} total`);
  }

  // Count analytics cache
  const { count: cacheCount } = await supabase
    .from('analytics_cache')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', TEST_CREATOR_ID);

  stats.analyticsCache.total = cacheCount || 0;
  console.log(`Analytics Cache: ${stats.analyticsCache.total} entries`);

  // Count bulk operations
  const { count: opsCount } = await supabase
    .from('bulk_operations')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', TEST_CREATOR_ID);

  stats.bulkOperations.total = opsCount || 0;
  console.log(`Bulk Operations: ${stats.bulkOperations.total} records\n`);

  // Check if anything to delete
  const totalRecords = stats.videos.total + stats.courses.total + stats.chatSessions.total +
                       stats.analyticsCache.total + stats.bulkOperations.total;

  if (totalRecords === 0) {
    console.log('✅ Database is already clean - nothing to delete!');
    return;
  }

  // Phase 2: Delete videos and related data
  console.log('🗑️  Phase 2: Deleting videos...\n');

  if (stats.videos.total > 0) {
    const videoIds = videos!.map(v => v.id);

    // Delete videos (cascades to video_chunks, analytics, etc.)
    const { error: deleteVideosError } = await supabase
      .from('videos')
      .delete()
      .in('id', videoIds);

    if (deleteVideosError) {
      console.error('❌ Error deleting videos:', deleteVideosError);
    } else {
      stats.videos.deleted = videoIds.length;
      console.log(`✅ Deleted ${stats.videos.deleted} videos`);
      console.log('   - Cascaded to video_chunks (embeddings)');
      console.log('   - Cascaded to video_analytics_events');
      console.log('   - Cascaded to video_watch_sessions');
      console.log('   - Cascaded to module_lessons');
      console.log('   - Cascaded to lesson_notes\n');
    }
  } else {
    console.log('⏭️  No videos to delete\n');
  }

  // Phase 3: Delete courses
  console.log('🗑️  Phase 3: Deleting courses...\n');

  if (stats.courses.total > 0) {
    const courseIds = courses!.map(c => c.id);

    const { error: deleteCoursesError } = await supabase
      .from('courses')
      .delete()
      .in('id', courseIds);

    if (deleteCoursesError) {
      console.error('❌ Error deleting courses:', deleteCoursesError);
    } else {
      stats.courses.deleted = courseIds.length;
      console.log(`✅ Deleted ${stats.courses.deleted} courses`);
      console.log('   - Cascaded to course_modules');
      console.log('   - Cascaded to student_courses\n');
    }
  } else {
    console.log('⏭️  No courses to delete\n');
  }

  // Phase 4: Delete chat sessions
  console.log('🗑️  Phase 4: Deleting chat sessions...\n');

  if (stats.chatSessions.total > 0) {
    const sessionIds = sessions!.map(s => s.id);

    const { error: deleteSessionsError } = await supabase
      .from('chat_sessions')
      .delete()
      .in('id', sessionIds);

    if (deleteSessionsError) {
      console.error('❌ Error deleting chat sessions:', deleteSessionsError);
    } else {
      stats.chatSessions.deleted = sessionIds.length;
      console.log(`✅ Deleted ${stats.chatSessions.deleted} chat sessions`);
      console.log('   - Cascaded to chat_messages\n');
    }
  } else {
    console.log('⏭️  No chat sessions to delete\n');
  }

  // Phase 5: Clear analytics cache
  console.log('🗑️  Phase 5: Clearing analytics cache...\n');

  if (stats.analyticsCache.total > 0) {
    const { error: deleteCacheError } = await supabase
      .from('analytics_cache')
      .delete()
      .eq('creator_id', TEST_CREATOR_ID);

    if (deleteCacheError) {
      console.error('❌ Error clearing analytics cache:', deleteCacheError);
    } else {
      stats.analyticsCache.deleted = stats.analyticsCache.total;
      console.log(`✅ Cleared ${stats.analyticsCache.deleted} analytics cache entries\n`);
    }
  } else {
    console.log('⏭️  No analytics cache to clear\n');
  }

  // Phase 6: Clear bulk operations
  console.log('🗑️  Phase 6: Clearing bulk operations...\n');

  if (stats.bulkOperations.total > 0) {
    const { error: deleteOpsError } = await supabase
      .from('bulk_operations')
      .delete()
      .eq('creator_id', TEST_CREATOR_ID);

    if (deleteOpsError) {
      console.error('❌ Error clearing bulk operations:', deleteOpsError);
    } else {
      stats.bulkOperations.deleted = stats.bulkOperations.total;
      console.log(`✅ Cleared ${stats.bulkOperations.deleted} bulk operation records\n`);
    }
  } else {
    console.log('⏭️  No bulk operations to clear\n');
  }

  // Phase 7: Verify cleanup
  console.log('✅ Phase 7: Verifying cleanup...\n');

  const { count: remainingVideos } = await supabase
    .from('videos')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', TEST_CREATOR_ID);

  const { count: remainingCourses } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', TEST_CREATOR_ID);

  const { count: remainingSessions } = await supabase
    .from('chat_sessions')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', TEST_CREATOR_ID);

  console.log('Verification:');
  console.log(`  Videos remaining: ${remainingVideos || 0}`);
  console.log(`  Courses remaining: ${remainingCourses || 0}`);
  console.log(`  Chat sessions remaining: ${remainingSessions || 0}\n`);

  // Summary
  console.log('📋 Cleanup Summary:\n');
  console.log('┌─────────────────────┬───────┬─────────┐');
  console.log('│ Resource            │ Total │ Deleted │');
  console.log('├─────────────────────┼───────┼─────────┤');
  console.log(`│ Videos              │ ${stats.videos.total.toString().padStart(5)} │ ${stats.videos.deleted.toString().padStart(7)} │`);
  console.log(`│ Courses             │ ${stats.courses.total.toString().padStart(5)} │ ${stats.courses.deleted.toString().padStart(7)} │`);
  console.log(`│ Chat Sessions       │ ${stats.chatSessions.total.toString().padStart(5)} │ ${stats.chatSessions.deleted.toString().padStart(7)} │`);
  console.log(`│ Analytics Cache     │ ${stats.analyticsCache.total.toString().padStart(5)} │ ${stats.analyticsCache.deleted.toString().padStart(7)} │`);
  console.log(`│ Bulk Operations     │ ${stats.bulkOperations.total.toString().padStart(5)} │ ${stats.bulkOperations.deleted.toString().padStart(7)} │`);
  console.log('└─────────────────────┴───────┴─────────┘\n');

  if ((remainingVideos || 0) === 0 && (remainingCourses || 0) === 0 && (remainingSessions || 0) === 0) {
    console.log('✅ Cleanup complete! Database is now clean and ready for fresh imports.\n');
    console.log('Next steps:');
    console.log('  1. Go to http://localhost:3007/dashboard/creator/videos');
    console.log('  2. Import a test video (YouTube recommended for free transcripts)');
    console.log('  3. Monitor progress in Inngest dashboard (http://localhost:8288)');
    console.log('  4. Test AI chat once video reaches 100%\n');
  } else {
    console.log('⚠️  Warning: Some records remain after cleanup. Check for foreign key constraints or errors above.\n');
  }
}

main().catch(console.error);
