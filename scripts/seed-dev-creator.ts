/**
 * Seed Development Creator
 *
 * Adds a development creator to the database for testing
 * Run with: npx tsx scripts/seed-dev-creator.ts
 */

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { getServiceSupabase } from '../lib/db/client';

async function seedDevCreator() {
  const supabase = getServiceSupabase();

  const creatorId = '00000000-0000-0000-0000-000000000001';

  console.log('🌱 Seeding development creator...');

  // Check if creator already exists
  const { data: existing } = await supabase
    .from('creators')
    .select('id')
    .eq('id', creatorId)
    .single();

  if (existing) {
    console.log('✅ Development creator already exists');
    console.log(`   Creator ID: ${creatorId}`);
    return;
  }

  // Insert dev creator
  const { data, error } = await supabase
    .from('creators')
    .insert({
      id: creatorId,
      whop_company_id: 'dev-company-001',
      subscription_tier: 'pro',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('❌ Error creating creator:', error);
    process.exit(1);
  }

  console.log('✅ Development creator created successfully');
  console.log(`   Creator ID: ${data.id}`);
  console.log(`   Tier: ${data.subscription_tier}`);
}

seedDevCreator()
  .then(() => {
    console.log('\n🎉 Seed complete!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  });
