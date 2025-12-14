import 'dotenv/config';
import { getServiceSupabase } from '../lib/db/client';

const TEST_USER_ID = 'user_test_00000000000000';
const TEST_CREATOR_ID = '7aea3556-0668-4623-8e96-614446434f71';

async function fixTestCreator() {
  const supabase = getServiceSupabase();

  console.log('\n=== CREATORS ===');
  const { data: creators, error: creatorsError } = await supabase
    .from('creators')
    .select('*')
    .limit(10);

  if (creatorsError) {
    console.error('Error fetching creators:', creatorsError);
    return;
  }

  console.log('Found creators:', creators?.length);
  creators?.forEach(c => {
    console.log({
      id: c.id,
      whop_user_id: c.whop_user_id,
      whop_company_id: c.whop_company_id,
      email: c.email,
      name: c.name,
    });
  });

  // Check if we need to update the whop_user_id for the test creator
  const testCreator = creators?.find(c => c.id === TEST_CREATOR_ID);

  if (testCreator) {
    console.log('\n=== TEST CREATOR FOUND ===');
    console.log('Current whop_user_id:', testCreator.whop_user_id);
    console.log('Expected whop_user_id:', TEST_USER_ID);

    if (testCreator.whop_user_id !== TEST_USER_ID) {
      console.log('\n=== UPDATING whop_user_id ===');
      const { error: updateError } = await supabase
        .from('creators')
        .update({ whop_user_id: TEST_USER_ID })
        .eq('id', TEST_CREATOR_ID);

      if (updateError) {
        console.error('Update error:', updateError);
      } else {
        console.log('✅ Updated whop_user_id to:', TEST_USER_ID);
      }
    } else {
      console.log('✅ whop_user_id already correct');
    }
  } else {
    console.log('\n❌ TEST_CREATOR_ID not found:', TEST_CREATOR_ID);
    console.log('Creating test creator...');

    // Try to create the test creator
    const { data: newCreator, error: createError } = await supabase
      .from('creators')
      .upsert({
        id: TEST_CREATOR_ID,
        whop_company_id: 'test_company_chronos',
        whop_user_id: TEST_USER_ID,
        email: 'creator@test.chronos.ai',
        name: 'Test Creator',
        subscription_tier: 'pro',
        is_active: true,
      }, { onConflict: 'id' })
      .select()
      .single();

    if (createError) {
      console.error('Create error:', createError);
    } else {
      console.log('✅ Created test creator:', newCreator);
    }
  }

  // Also clean up any duplicate test creators with wrong company IDs
  console.log('\n=== CLEANING UP DUPLICATE TEST CREATORS ===');
  const duplicates = creators?.filter(
    c => c.whop_company_id?.startsWith('test_company_user_test_') && c.id !== TEST_CREATOR_ID
  );

  if (duplicates && duplicates.length > 0) {
    console.log('Found duplicates to clean up:', duplicates.length);
    for (const dup of duplicates) {
      console.log('Deleting duplicate:', dup.id, dup.whop_company_id);
      await supabase.from('creators').delete().eq('id', dup.id);
    }
  } else {
    console.log('No duplicates found');
  }
}

fixTestCreator();
