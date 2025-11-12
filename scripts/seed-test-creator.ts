/**
 * Seed test creator for development
 * Run with: npx tsx scripts/seed-test-creator.ts
 */

import 'dotenv/config';
import { getServiceSupabase } from '@/lib/db/client';

const TEST_CREATOR_ID = 'e5f9d8c7-4b3a-4e2d-9f1a-8c7b6a5d4e3f';

async function seedTestCreator() {
  const supabase = getServiceSupabase();

  console.log('🌱 Seeding test creator...');

  // Check if creator already exists
  const { data: existing } = await supabase
    .from('creators')
    .select('id')
    .eq('id', TEST_CREATOR_ID)
    .single();

  if (existing) {
    console.log('✅ Test creator already exists:', TEST_CREATOR_ID);
    return;
  }

  // Create test creator
  const { data: creator, error } = await supabase.from('creators').insert({
    id: TEST_CREATOR_ID,
    whop_company_id: 'test_company_123',
    whop_user_id: 'test_user_456',
    email: 'test@chronos.dev',
    name: 'Test Creator',
    subscription_tier: 'pro',
  }).select().single();

  if (error) {
    console.error('❌ Error creating test creator:', error);
    process.exit(1);
  }

  console.log('✅ Test creator created successfully!');
  console.log('   ID:', creator.id);
  console.log('   Email:', creator.email);
  console.log('   Tier:', creator.subscription_tier);
}

seedTestCreator()
  .then(() => {
    console.log('\n✨ Seeding complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
