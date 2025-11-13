#!/usr/bin/env tsx
/**
 * Minimal Database Seed Script
 *
 * Seeds 1 test creator account for local development and testing.
 * Run with: npm run seed:minimal
 *
 * Note: Environment variables are loaded by dotenv-cli wrapper
 */

import { getServiceSupabase } from '../lib/db/client';

async function seedMinimal() {
  console.log('🌱 Starting minimal database seed...\n');

  const supabase = getServiceSupabase();

  // Get Whop company ID from environment
  const whopCompanyId = process.env['NEXT_PUBLIC_WHOP_COMPANY_ID'];

  if (!whopCompanyId) {
    console.error(
      '❌ Missing NEXT_PUBLIC_WHOP_COMPANY_ID environment variable',
    );
    console.error(
      '   Add this to your .env.local file to seed a test creator account',
    );
    process.exit(1);
  }

  try {
    // =====================================================
    // 1. CREATE TEST CREATOR
    // =====================================================
    console.log('Creating test creator account...');

    // Check if creator already exists
    const { data: existingCreator } = await supabase
      .from('creators')
      .select('id, whop_company_id, subscription_tier')
      .eq('whop_company_id', whopCompanyId)
      .single();

    let creatorId: string;

    if (existingCreator) {
      console.log(
        `✓ Creator already exists: ${existingCreator.id} (${existingCreator.subscription_tier} tier)`,
      );
      creatorId = existingCreator.id;
    } else {
      const { data: newCreator, error: creatorError } = await supabase
        .from('creators')
        .insert({
          whop_company_id: whopCompanyId,
          whop_user_id: 'test_user_001', // Test user ID
          email: 'test@chronos.dev',
          name: 'Test Creator',
          subscription_tier: 'pro',
          settings: {
            notifications_enabled: true,
            ai_model: 'claude-3-5-haiku-20241022',
            auto_transcribe: true,
            default_chunk_size: 800,
          },
          is_active: true,
        })
        .select('id')
        .single();

      if (creatorError) {
        throw new Error(`Failed to create creator: ${creatorError.message}`);
      }

      creatorId = newCreator.id;
      console.log(`✓ Created test creator: ${creatorId} (pro tier)`);
    }

    // =====================================================
    // 2. CREATE INITIAL USAGE METRICS
    // =====================================================
    console.log('\nCreating initial usage metrics...');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format

    // Check if usage metrics already exist for today
    const { data: existingMetrics } = await supabase
      .from('usage_metrics')
      .select('id')
      .eq('creator_id', creatorId)
      .eq('date', today)
      .single();

    if (existingMetrics) {
      console.log(`✓ Usage metrics already exist for today: ${today}`);
    } else {
      const { error: metricsError } = await supabase
        .from('usage_metrics')
        .insert({
          creator_id: creatorId,
          date: today,
          storage_used_bytes: 0,
          videos_uploaded: 0,
          total_video_duration_seconds: 0,
          ai_credits_used: 0,
          transcription_minutes: 0,
          chat_messages_sent: 0,
          active_students: 0,
          metadata: {},
        });

      if (metricsError) {
        throw new Error(
          `Failed to create usage metrics: ${metricsError.message}`,
        );
      }

      console.log(`✓ Created initial usage metrics for today: ${today}`);
    }

    // =====================================================
    // SEED COMPLETE
    // =====================================================
    console.log('\n✅ Minimal database seed complete!\n');
    console.log('Test creator details:');
    console.log(`  ID: ${creatorId}`);
    console.log(`  Whop Company ID: ${whopCompanyId}`);
    console.log('  Subscription Tier: pro');
    console.log('  Email: test@chronos.dev');
    console.log('\nYou can now:');
    console.log('  - Upload videos via the UI');
    console.log('  - Create courses via the course builder');
    console.log('  - Test analytics dashboard');
    console.log('  - Add students via Whop webhooks\n');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run seed
seedMinimal();
