#!/usr/bin/env tsx
/**
 * Seed Database Script
 * Loads test data into Supabase for development and testing
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), '.env.local') })

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env['NEXT_PUBLIC_SUPABASE_URL']!
const SUPABASE_SERVICE_KEY = process.env['SUPABASE_SERVICE_ROLE_KEY']!

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedDatabase() {
  console.log('🌱 Starting database seed...\n')

  try {
    // Read seed SQL file
    const seedPath = join(process.cwd(), 'supabase', 'seed.sql')
    const seedSQL = readFileSync(seedPath, 'utf8')

    console.log('📄 Loaded seed.sql')
    console.log('📊 Executing seed data...\n')

    // Execute the seed SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: seedSQL })

    if (error) {
      // If rpc doesn't exist, try direct execution via REST API
      console.log('⚠️  RPC method not available, using alternative approach\n')
      await seedDataManually()
    } else {
      console.log('✅ Seed data loaded successfully!\n')
      await verifySeedData()
    }

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    process.exit(1)
  }
}

async function seedDataManually() {
  console.log('👤 Creating test creator...')
  const { data: creator, error: creatorError } = await supabase
    .from('creators')
    .upsert({
      id: '00000000-0000-0000-0000-000000000001',
      whop_company_id: 'biz_test_creator_123',
      whop_user_id: 'user_test_creator_456',
      email: 'test.creator@example.com',
      name: 'Test Creator',
      subscription_tier: 'pro',
      settings: {
        notifications_enabled: true,
        ai_model: 'claude-3-5-haiku-20241022',
        auto_transcribe: true,
        default_chunk_size: 800
      },
      is_active: true
    }, { onConflict: 'id' })
    .select()
    .single()

  if (creatorError) throw creatorError
  console.log('✅ Creator:', creator.email)

  console.log('\n👨‍🎓 Creating test student...')
  const { data: student, error: studentError } = await supabase
    .from('students')
    .upsert({
      id: '00000000-0000-0000-0000-000000000002',
      whop_user_id: 'user_test_student_789',
      whop_membership_id: 'mem_test_student_active',
      creator_id: '00000000-0000-0000-0000-000000000001',
      email: 'test.student@example.com',
      name: 'Test Student',
      preferences: {
        playback_speed: 1.0,
        auto_advance: false,
        show_timestamps: true,
        theme: 'dark'
      },
      is_active: true
    }, { onConflict: 'id' })
    .select()
    .single()

  if (studentError) throw studentError
  console.log('✅ Student:', student.email)

  console.log('\n📚 Creating test courses...')
  const courses = [
    {
      id: '10000000-0000-0000-0000-000000000001',
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Trading Fundamentals',
      description: 'Complete introduction to trading strategies and technical analysis',
      is_published: true,
      display_order: 1,
      metadata: { difficulty: 'beginner', duration_hours: 12 }
    },
    {
      id: '10000000-0000-0000-0000-000000000002',
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Advanced Options Strategies',
      description: 'Deep dive into options trading and risk management',
      is_published: true,
      display_order: 2,
      metadata: { difficulty: 'advanced', duration_hours: 20 }
    }
  ]

  const { error: coursesError } = await supabase
    .from('courses')
    .upsert(courses, { onConflict: 'id' })

  if (coursesError) throw coursesError
  console.log('✅ Created', courses.length, 'courses')

  console.log('\n🎥 Creating test videos...')
  const videos = [
    {
      id: '20000000-0000-0000-0000-000000000001',
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Introduction to Technical Analysis',
      description: 'Learn the basics of chart patterns and indicators',
      duration_seconds: 1800,
      status: 'completed',
      transcript: 'Welcome to technical analysis. Today we will cover support and resistance levels...'
    },
    {
      id: '20000000-0000-0000-0000-000000000002',
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Understanding Candlestick Patterns',
      description: 'Master the art of reading candlestick charts',
      duration_seconds: 2400,
      status: 'completed',
      transcript: 'Candlestick patterns reveal market psychology...'
    },
    {
      id: '20000000-0000-0000-0000-000000000003',
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Risk Management Essentials',
      description: 'Protect your capital with proper risk management',
      duration_seconds: 2100,
      status: 'completed',
      transcript: 'Risk management is the most important aspect of trading...'
    }
  ]

  const { error: videosError } = await supabase
    .from('videos')
    .upsert(videos, { onConflict: 'id' })

  if (videosError) throw videosError
  console.log('✅ Created', videos.length, 'videos')

  console.log('\n💬 Creating chat sessions and messages...')
  const sessions = [
    {
      id: '50000000-0000-0000-0000-000000000001',
      student_id: '00000000-0000-0000-0000-000000000002',
      creator_id: '00000000-0000-0000-0000-000000000001',
      title: 'Questions about Risk Management',
      context_video_ids: ['20000000-0000-0000-0000-000000000003']
    }
  ]

  const { error: sessionsError } = await supabase
    .from('chat_sessions')
    .upsert(sessions, { onConflict: 'id' })

  if (sessionsError) throw sessionsError

  const messages = [
    {
      session_id: '50000000-0000-0000-0000-000000000001',
      role: 'user',
      content: 'What percentage of my portfolio should I risk on each trade?'
    },
    {
      session_id: '50000000-0000-0000-0000-000000000001',
      role: 'assistant',
      content: 'Based on the Risk Management Essentials video, you should never risk more than 2% of your capital on a single trade.',
      input_tokens: 89,
      output_tokens: 67,
      cost_usd: 0.000234,
      response_time_ms: 1250,
      model: 'claude-3-5-haiku-20241022'
    }
  ]

  const { error: messagesError } = await supabase
    .from('chat_messages')
    .insert(messages)

  if (messagesError && !messagesError.message.includes('duplicate')) {
    throw messagesError
  }

  console.log('✅ Created chat data')

  console.log('\n✅ Manual seed completed!\n')
}

async function verifySeedData() {
  console.log('🔍 Verifying seed data...\n')

  const tables = [
    'creators',
    'students',
    'courses',
    'videos',
    'chat_sessions',
    'chat_messages'
  ]

  for (const table of tables) {
    const { count, error } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })

    if (error) {
      console.log(`❌ ${table}: Error -`, error.message)
    } else {
      console.log(`✅ ${table}: ${count} rows`)
    }
  }

  console.log('\n🎉 Database seed complete!')
  console.log('\n📋 Test Accounts:')
  console.log('   Creator: test.creator@example.com')
  console.log('   Student: test.student@example.com')
  console.log('   Creator ID: 00000000-0000-0000-0000-000000000001')
  console.log('   Student ID: 00000000-0000-0000-0000-000000000002\n')
}

// Run the seed
seedDatabase()
