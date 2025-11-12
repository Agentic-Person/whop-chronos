/**
 * Test YouTube download functionality
 * Run with: npx tsx scripts/test-youtube-download.ts
 */

import 'dotenv/config';
import ytdl from '@distube/ytdl-core';

const TEST_URL = 'https://www.youtube.com/watch?v=vMZHiBhr0SM&t=1s';

async function testDownload() {
  console.log('🎬 Testing YouTube download...');
  console.log('URL:', TEST_URL);
  console.log('');

  try {
    // Step 1: Validate URL
    console.log('1️⃣ Validating URL...');
    const isValid = ytdl.validateURL(TEST_URL);
    if (!isValid) {
      throw new Error('Invalid YouTube URL');
    }
    console.log('   ✅ URL is valid');

    // Step 2: Get video info
    console.log('\n2️⃣ Fetching video info...');
    const info = await ytdl.getInfo(TEST_URL);
    const videoDetails = info.videoDetails;

    console.log('   ✅ Video info retrieved:');
    console.log('      Title:', videoDetails.title);
    console.log('      Duration:', videoDetails.lengthSeconds, 'seconds');
    console.log('      Available formats:', info.formats.length);

    // Step 3: Choose format
    console.log('\n3️⃣ Selecting video format...');
    const format = ytdl.chooseFormat(info.formats, {
      quality: 'highestvideo',
      filter: 'audioandvideo',
    });

    if (!format) {
      throw new Error('No suitable video format found');
    }

    console.log('   ✅ Format selected:');
    console.log('      Container:', format.container);
    console.log('      Quality:', format.qualityLabel || 'unknown');
    console.log('      Size:', format.contentLength ? `${Math.round(parseInt(format.contentLength) / 1024 / 1024)} MB` : 'unknown');

    // Step 4: Test download stream (first 10 chunks only)
    console.log('\n4️⃣ Testing download stream...');
    const stream = ytdl(TEST_URL, { format });

    let chunkCount = 0;
    let totalBytes = 0;

    for await (const chunk of stream) {
      chunkCount++;
      totalBytes += chunk.length;

      if (chunkCount >= 10) {
        stream.destroy(); // Stop after 10 chunks
        break;
      }
    }

    console.log('   ✅ Stream working:');
    console.log('      Chunks received:', chunkCount);
    console.log('      Bytes downloaded:', totalBytes);

    console.log('\n✅ All tests passed! YouTube download is working.');

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
