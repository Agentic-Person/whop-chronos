/**
 * Check Supabase Storage bucket configuration
 * Run with: npx tsx scripts/check-bucket-limits.ts
 */

import 'dotenv/config';
import { getServiceSupabase } from '@/lib/db/client';

async function checkBucketLimits() {
  const supabase = getServiceSupabase();

  console.log('🔍 Checking Supabase Storage bucket configuration...\n');

  // Query the storage.buckets table directly
  const { data: buckets, error } = await supabase
    .from('buckets')
    .select('*')
    .in('name', ['videos', 'thumbnails']);

  if (error) {
    console.error('❌ Error querying buckets:', error);
    console.log('\n💡 Trying alternative method...\n');

    // Alternative: List buckets via storage API
    const { data: bucketsList, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Error listing buckets:', listError);
      process.exit(1);
    }

    console.log('✅ Found buckets (via API):');
    bucketsList?.forEach((bucket) => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

    console.log('\n⚠️  Cannot read file_size_limit via API.');
    console.log('\n📝 To check/update file size limits:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets');
    console.log('   2. Click on "videos" bucket');
    console.log('   3. Click "Edit bucket" or settings icon');
    console.log('   4. Set "Maximum file size" to 500 MB or higher');
    console.log('\n   Or run this SQL in Supabase SQL Editor:');
    console.log('\n   UPDATE storage.buckets');
    console.log('   SET file_size_limit = 524288000');
    console.log("   WHERE name = 'videos';");

    return;
  }

  if (!buckets || buckets.length === 0) {
    console.log('⚠️  No buckets found!');
    return;
  }

  console.log('✅ Bucket configuration:');
  buckets.forEach((bucket: any) => {
    const sizeLimitMB = bucket.file_size_limit
      ? (bucket.file_size_limit / 1024 / 1024).toFixed(2)
      : 'unlimited';

    console.log(`\n   📦 ${bucket.name}:`);
    console.log(`      File size limit: ${sizeLimitMB} MB`);
    console.log(`      Public: ${bucket.public ? 'Yes' : 'No'}`);
    console.log(`      Allowed MIME types: ${bucket.allowed_mime_types ? bucket.allowed_mime_types.join(', ') : 'all'}`);

    // Check if limit is too small
    if (bucket.name === 'videos' && bucket.file_size_limit && bucket.file_size_limit < 524288000) {
      console.log(`      ⚠️  WARNING: File size limit is too small for video files!`);
      console.log(`      💡 Recommended: 500 MB (524288000 bytes) or higher`);
    }
  });

  // Check for videos bucket specifically
  const videosBucket = buckets.find((b: any) => b.name === 'videos');
  if (!videosBucket) {
    console.log('\n⚠️  Videos bucket not found!');
    return;
  }

  if (!videosBucket.file_size_limit || videosBucket.file_size_limit < 524288000) {
    console.log('\n\n🔧 ACTION REQUIRED: Update videos bucket file size limit');
    console.log('\n   Run this SQL in Supabase SQL Editor:');
    console.log('\n   UPDATE storage.buckets');
    console.log('   SET file_size_limit = 524288000  -- 500 MB');
    console.log("   WHERE name = 'videos';");
    console.log('\n   Or use the Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/storage/buckets');
  } else {
    console.log('\n✅ Videos bucket file size limit is properly configured!');
  }
}

checkBucketLimits()
  .then(() => {
    console.log('\n✨ Check complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Check failed:', error);
    process.exit(1);
  });
