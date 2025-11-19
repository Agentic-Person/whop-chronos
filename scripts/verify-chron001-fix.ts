#!/usr/bin/env tsx
/**
 * Verification Script: CHRON-001 Student Page Timeout Fix
 *
 * Checks if all required tables and data exist after running migrations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  count?: number;
}

const results: CheckResult[] = [];

/**
 * Check if a table exists and has data
 */
async function checkTable(tableName: string, minRows: number = 0): Promise<CheckResult> {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      return {
        name: `Table: ${tableName}`,
        status: 'fail',
        message: `Error: ${error.message}`,
      };
    }

    const actualCount = count || 0;

    if (actualCount >= minRows) {
      return {
        name: `Table: ${tableName}`,
        status: 'pass',
        message: `✅ Exists with ${actualCount} rows`,
        count: actualCount,
      };
    } else {
      return {
        name: `Table: ${tableName}`,
        status: 'warn',
        message: `⚠️ Exists but has only ${actualCount} rows (expected ${minRows}+)`,
        count: actualCount,
      };
    }
  } catch (err) {
    return {
      name: `Table: ${tableName}`,
      status: 'fail',
      message: `❌ Error checking table: ${err}`,
    };
  }
}

/**
 * Check specific data exists
 */
async function checkData(
  tableName: string,
  column: string,
  value: string,
  description: string
): Promise<CheckResult> {
  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq(column, value)
      .single();

    if (error) {
      return {
        name: description,
        status: 'fail',
        message: `❌ Not found: ${error.message}`,
      };
    }

    return {
      name: description,
      status: 'pass',
      message: '✅ Found',
    };
  } catch (err) {
    return {
      name: description,
      status: 'fail',
      message: `❌ Error: ${err}`,
    };
  }
}

async function runChecks() {
  console.log('\n🔍 CHRON-001 Fix Verification\n');
  console.log('=' .repeat(60));

  // ========================================
  // 1. Check Core Tables
  // ========================================
  console.log('\n📊 Checking Core Tables...\n');

  results.push(await checkTable('creators', 1));
  results.push(await checkTable('students', 1));
  results.push(await checkTable('courses', 2));
  results.push(await checkTable('videos', 5));

  // ========================================
  // 2. Check NEW Tables (CRITICAL)
  // ========================================
  console.log('\n🆕 Checking NEW Tables (Critical for CHRON-001)...\n');

  results.push(await checkTable('student_courses', 2)); // CRITICAL
  results.push(await checkTable('lesson_notes', 0)); // Optional
  results.push(await checkTable('video_watch_sessions', 3));

  // ========================================
  // 3. Check Test Data Exists
  // ========================================
  console.log('\n👥 Checking Test Data...\n');

  results.push(
    await checkData(
      'creators',
      'id',
      '00000000-0000-0000-0000-000000000001',
      'Test Creator'
    )
  );

  results.push(
    await checkData(
      'students',
      'id',
      '00000000-0000-0000-0000-000000000002',
      'Test Student'
    )
  );

  // Check that at least 2 courses exist (any IDs)
  try {
    const { data: courses, error } = await supabase
      .from('courses')
      .select('id, title')
      .limit(3);

    if (error || !courses || courses.length < 2) {
      results.push({
        name: 'Courses Exist',
        status: 'fail',
        message: `❌ Less than 2 courses found (need at least 2 for testing)`,
      });
    } else {
      results.push({
        name: 'Courses Exist',
        status: 'pass',
        message: `✅ Found ${courses.length} courses: ${courses.map(c => c.title).join(', ')}`,
        count: courses.length,
      });
    }
  } catch (err) {
    results.push({
      name: 'Courses Exist',
      status: 'fail',
      message: `❌ Error checking courses: ${err}`,
    });
  }

  // ========================================
  // 4. Check Student Course Enrollments
  // ========================================
  console.log('\n📚 Checking Student Course Enrollments...\n');

  try {
    const { data: enrollments, error } = await supabase
      .from('student_courses')
      .select('*, courses(title), students(name)')
      .eq('student_id', '00000000-0000-0000-0000-000000000002');

    if (error) {
      results.push({
        name: 'Student Enrollments',
        status: 'fail',
        message: `❌ Error fetching enrollments: ${error.message}`,
      });
    } else if (!enrollments || enrollments.length === 0) {
      results.push({
        name: 'Student Enrollments',
        status: 'fail',
        message: '❌ Test student has no course enrollments',
      });
    } else {
      results.push({
        name: 'Student Enrollments',
        status: 'pass',
        message: `✅ Test student enrolled in ${enrollments.length} courses`,
        count: enrollments.length,
      });

      enrollments.forEach((enrollment: any, idx: number) => {
        console.log(`   ${idx + 1}. ${enrollment.courses?.title || 'Unknown'} - ${enrollment.progress}% complete`);
      });
    }
  } catch (err) {
    results.push({
      name: 'Student Enrollments',
      status: 'fail',
      message: `❌ Error: ${err}`,
    });
  }

  // ========================================
  // 5. Print Summary
  // ========================================
  console.log('\n');
  console.log('=' .repeat(60));
  console.log('\n📋 VERIFICATION SUMMARY\n');

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warn').length;

  results.forEach((result) => {
    const icon =
      result.status === 'pass' ? '✅' : result.status === 'warn' ? '⚠️' : '❌';
    console.log(`${icon} ${result.name}: ${result.message}`);
  });

  console.log('\n');
  console.log('=' .repeat(60));
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`⚠️  Warnings: ${warnings}`);
  console.log(`❌ Failed: ${failed}`);

  if (failed > 0) {
    console.log('\n❌ VERIFICATION FAILED - Some checks did not pass');
    console.log('\n📝 Next Steps:');
    console.log('1. Check Supabase connection');
    console.log('2. Verify migrations were applied: npx supabase db push');
    console.log('3. Run seed data: npx tsx scripts/run-seed.ts');
    console.log('\nSee: docs/guides/setup/BUG_FIX_INSTRUCTIONS.md');
    process.exit(1);
  } else if (warnings > 0) {
    console.log('\n⚠️  VERIFICATION PASSED WITH WARNINGS');
    console.log('Some optional data is missing but core functionality should work.');
    process.exit(0);
  } else {
    console.log('\n✅ ALL CHECKS PASSED!');
    console.log('\n🎉 CHRON-001 fix is complete and verified.');
    console.log('\nNext steps:');
    console.log('1. Start dev server: npm run dev');
    console.log('2. Test student pages at http://localhost:3000/dashboard/student');
    console.log('3. Verify all 6 pages load within 3-5 seconds');
    process.exit(0);
  }
}

runChecks().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
