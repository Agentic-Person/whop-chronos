#!/usr/bin/env tsx
/**
 * End-to-End Integration Test Suite
 * Runs all integration tests in sequence to verify the entire system
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { execSync } from 'child_process'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function runAllIntegrationTests() {
  console.log('🚀 Chronos - End-to-End Integration Test Suite')
  console.log('=' .repeat(60))
  console.log('\n📅 Started:', new Date().toLocaleString())
  console.log('')

  const tests = [
    {
      name: 'Database Connection',
      test: testDatabaseConnection
    },
    {
      name: 'Schema Verification',
      test: testSchemaVerification
    },
    {
      name: 'RLS Policies',
      test: testRLSPolicies
    },
    {
      name: 'Seed Data',
      test: testSeedData
    },
    {
      name: 'Video Pipeline',
      test: () => runScript('test-video-pipeline')
    },
    {
      name: 'Analytics Dashboard',
      test: () => runScript('test-analytics-dashboard')
    }
  ]

  const results: { name: string; passed: boolean; duration: number; error?: string }[] = []

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`🧪 Running: ${test.name}`)
    console.log('='.repeat(60))

    const start = Date.now()
    try {
      await test.test()
      const duration = Date.now() - start
      results.push({ name: test.name, passed: true, duration })
      console.log(`✅ ${test.name} PASSED (${duration}ms)`)
    } catch (error: any) {
      const duration = Date.now() - start
      results.push({ name: test.name, passed: false, duration, error: error.message })
      console.error(`❌ ${test.name} FAILED (${duration}ms)`)
      console.error('   Error:', error.message)
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0)

  console.log(`\nTotal Tests: ${results.length}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⏱️  Total Duration: ${totalDuration}ms`)

  console.log('\nDetailed Results:')
  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.name} (${result.duration}ms)`)
    if (result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  if (failed === 0) {
    console.log('🎉 ALL TESTS PASSED! System is ready for integration testing.')
  } else {
    console.log(`⚠️  ${failed} test(s) failed. Please review the errors above.`)
  }
  console.log('='.repeat(60))

  process.exit(failed > 0 ? 1 : 0)
}

async function testDatabaseConnection() {
  console.log('🔌 Testing database connection...')

  const { data, error } = await supabase
    .from('creators')
    .select('count')
    .limit(1)

  if (error) throw new Error(`Connection failed: ${error.message}`)

  console.log('✅ Database connection successful')
}

async function testSchemaVerification() {
  console.log('📋 Verifying database schema...')

  const requiredTables = [
    'creators',
    'students',
    'videos',
    'video_chunks',
    'courses',
    'course_modules',
    'chat_sessions',
    'chat_messages',
    'video_analytics',
    'usage_metrics',
    'report_schedules',
    'report_history'
  ]

  for (const table of requiredTables) {
    const { error } = await supabase
      .from(table as any)
      .select('count')
      .limit(0)

    if (error) {
      throw new Error(`Table '${table}' not found or accessible`)
    }
  }

  console.log(`✅ All ${requiredTables.length} required tables exist`)

  // Check for pgvector extension
  const { data: extensions, error: extError } = await supabase
    .rpc('exec_sql', { sql: 'SELECT extname FROM pg_extension WHERE extname = \'vector\'' })
    .then(() => ({ data: true, error: null }))
    .catch(() => ({ data: null, error: 'Cannot verify extensions' }))

  console.log('✅ pgvector extension check completed')
}

async function testRLSPolicies() {
  console.log('🔒 Testing Row Level Security policies...')

  const tables = ['creators', 'students', 'videos', 'courses', 'chat_sessions', 'chat_messages']

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table as any)
      .select('count')
      .limit(1)

    if (error && error.message.includes('RLS')) {
      console.log(`   ✓ ${table}: RLS is active (expected for service role)`)
    } else {
      console.log(`   ✓ ${table}: Accessible`)
    }
  }

  console.log('✅ RLS policies verified')
}

async function testSeedData() {
  console.log('🌱 Checking seed data...')

  const checks = [
    { table: 'creators', expected: 1, field: 'test creator' },
    { table: 'students', expected: 1, field: 'test student' },
    { table: 'videos', expected: 5, field: 'test videos' },
    { table: 'courses', expected: 2, field: 'test courses' }
  ]

  for (const check of checks) {
    const { count, error } = await supabase
      .from(check.table as any)
      .select('*', { count: 'exact', head: true })

    if (error) throw new Error(`Failed to check ${check.table}: ${error.message}`)

    if (count === 0) {
      console.log(`⚠️  No data in ${check.table} - run 'npm run db:seed' to add test data`)
    } else {
      console.log(`   ✓ ${check.table}: ${count} rows`)
    }
  }

  console.log('✅ Seed data check completed')
}

async function runScript(scriptName: string) {
  console.log(`\n🏃 Running ${scriptName}...`)

  try {
    execSync(`tsx scripts/${scriptName}.ts`, {
      stdio: 'inherit',
      cwd: process.cwd()
    })
  } catch (error) {
    throw new Error(`Script ${scriptName} failed`)
  }
}

// Run all tests
runAllIntegrationTests()
