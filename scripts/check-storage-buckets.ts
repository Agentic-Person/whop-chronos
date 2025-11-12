/**
 * Check Supabase Storage buckets
 * Run with: npx tsx scripts/check-storage-buckets.ts
 */

import 'dotenv/config';
import { getServiceSupabase } from '@/lib/db/client';

async function checkBuckets() {
  const supabase = getServiceSupabase();

  console.log('🔍 Checking Supabase Storage buckets...\n');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Error listing buckets:', error);
    process.exit(1);
  }

  if (!buckets || buckets.length === 0) {
    console.log('⚠️  No storage buckets found!\n');
    console.log('📝 You need to create these buckets in Supabase:');
    console.log('   1. videos - for storing uploaded video files');
    console.log('   2. thumbnails - for storing video thumbnails');
    console.log('\n💡 Create them at: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets');
    process.exit(1);
  }

  console.log('✅ Found buckets:');
  buckets.forEach((bucket) => {
    console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });

  // Check for required buckets
  const requiredBuckets = ['videos', 'thumbnails'];
  const existingBucketNames = buckets.map((b) => b.name);
  const missingBuckets = requiredBuckets.filter(
    (name) => !existingBucketNames.includes(name)
  );

  if (missingBuckets.length > 0) {
    console.log('\n⚠️  Missing required buckets:');
    missingBuckets.forEach((name) => {
      console.log(`   - ${name}`);
    });
    console.log('\n📝 Please create these buckets in Supabase dashboard');
    process.exit(1);
  }

  console.log('\n✅ All required buckets exist!');
}

checkBuckets()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
