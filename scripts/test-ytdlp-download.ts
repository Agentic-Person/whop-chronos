/**
 * Test yt-dlp download functionality
 * Run with: npx tsx scripts/test-ytdlp-download.ts
 */

import 'dotenv/config';
import { extractVideoMetadata, downloadAndUploadVideo } from '@/lib/video/url-processor';

const TEST_URL = 'https://www.youtube.com/watch?v=vMZHiBhr0SM&t=1s';
const TEST_CREATOR_ID = 'e5f9d8c7-4b3a-4e2d-9f1a-8c7b6a5d4e3f';
const TEST_VIDEO_ID = 'test-' + Date.now();

async function testDownload() {
  console.log('🎬 Testing yt-dlp video processing...');
  console.log('URL:', TEST_URL);
  console.log('');

  try {
    // Step 1: Test metadata extraction
    console.log('1️⃣ Testing metadata extraction...');
    const metadata = await extractVideoMetadata(TEST_URL);

    console.log('   ✅ Metadata extracted successfully:');
    console.log('      Title:', metadata.title);
    console.log('      Duration:', metadata.duration, 'seconds');
    console.log('      Thumbnail:', metadata.thumbnail?.substring(0, 50) + '...');
    console.log('      File size:', metadata.fileSize ? `${Math.round(metadata.fileSize / 1024 / 1024)} MB` : 'unknown');

    // Step 2: Test full download and upload
    console.log('\n2️⃣ Testing full download and upload...');
    console.log('   ⚠️  This will download a ~70MB video and upload to Supabase');
    console.log('   ⏱️  This may take 1-3 minutes...\n');

    const result = await downloadAndUploadVideo(
      TEST_URL,
      TEST_CREATOR_ID,
      TEST_VIDEO_ID,
      (progress) => {
        console.log(`   Progress: ${progress}%`);
      }
    );

    console.log('\n   ✅ Download and upload successful!');
    console.log('      Storage path:', result.storagePath);
    console.log('      Supabase URL:', result.supabaseUrl);
    console.log('      Final file size:', Math.round(result.metadata.fileSize! / 1024 / 1024), 'MB');

    console.log('\n✅ All tests passed! yt-dlp is working perfectly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    if (error instanceof Error) {
      console.error('   Error message:', error.message);
      console.error('   Stack:', error.stack);
    }
    process.exit(1);
  }
}

testDownload()
  .then(() => {
    console.log('\n✨ Test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
