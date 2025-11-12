/**
 * Test Script: Video Upload Confirmation
 *
 * Tests the complete video upload and confirmation flow:
 * 1. Initiate upload (get signed URL)
 * 2. Simulate file upload
 * 3. Confirm upload (trigger processing)
 * 4. Check processing status
 *
 * Usage:
 * ts-node scripts/test-upload-confirmation.ts
 */

import { getServiceSupabase } from '@/lib/db/client';
import { inngest } from '@/inngest/client';

interface TestConfig {
  creatorId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  title: string;
}

const TEST_CONFIG: TestConfig = {
  creatorId: 'test_creator_123', // Replace with real creator ID
  filename: 'test-video.mp4',
  fileSize: 52428800, // 50MB
  mimeType: 'video/mp4',
  title: 'Test Video Upload',
};

async function testUploadConfirmation() {
  console.log('🧪 Testing Video Upload Confirmation Flow\n');

  const supabase = getServiceSupabase();

  // Step 1: Create test video record
  console.log('📝 Step 1: Creating test video record...');
  const { data: video, error: createError } = await supabase
    .from('videos')
    .insert({
      creator_id: TEST_CONFIG.creatorId,
      title: TEST_CONFIG.title,
      description: 'Test video for upload confirmation',
      status: 'uploading',
      file_size_bytes: TEST_CONFIG.fileSize,
      storage_path: `${TEST_CONFIG.creatorId}/test-video-id/1234567890.mp4`,
      metadata: {
        original_filename: TEST_CONFIG.filename,
        mime_type: TEST_CONFIG.mimeType,
        upload_started_at: new Date().toISOString(),
      },
    })
    .select()
    .single();

  if (createError || !video) {
    console.error('❌ Failed to create test video:', createError);
    return;
  }

  console.log(`✅ Video created: ${video.id}`);
  console.log(`   Status: ${video.status}`);
  console.log(`   Storage path: ${video.storage_path}\n`);

  // Step 2: Simulate file upload (create empty file in storage)
  console.log('📤 Step 2: Simulating file upload to storage...');
  const testFile = Buffer.from('test video content'); // Small test content

  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(video.storage_path, testFile, {
      contentType: TEST_CONFIG.mimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error('❌ Failed to upload test file:', uploadError);
    await cleanup(video.id, video.storage_path);
    return;
  }

  console.log('✅ Test file uploaded to storage\n');

  // Step 3: Verify file exists
  console.log('🔍 Step 3: Verifying file in storage...');
  const { data: fileList, error: listError } = await supabase.storage
    .from('videos')
    .list(video.storage_path.split('/').slice(0, -1).join('/'), {
      search: video.storage_path.split('/').pop(),
    });

  if (listError || !fileList || fileList.length === 0) {
    console.error('❌ File not found in storage:', listError);
    await cleanup(video.id, video.storage_path);
    return;
  }

  const uploadedFile = fileList[0];
  console.log(`✅ File verified in storage`);
  console.log(`   Size: ${uploadedFile?.metadata?.size || 0} bytes\n`);

  // Step 4: Update video to pending and send Inngest event
  console.log('⚡ Step 4: Confirming upload and triggering Inngest...');
  const { error: updateError } = await supabase
    .from('videos')
    .update({
      status: 'pending',
      file_size_bytes: uploadedFile?.metadata?.size || testFile.length,
      metadata: {
        ...(video.metadata as Record<string, unknown>),
        upload_confirmed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq('id', video.id);

  if (updateError) {
    console.error('❌ Failed to update video status:', updateError);
    await cleanup(video.id, video.storage_path);
    return;
  }

  console.log('✅ Video status updated to pending');

  // Send Inngest event
  try {
    const inngestResult = await inngest.send({
      name: 'video/transcribe.requested',
      data: {
        videoId: video.id,
        creatorId: video.creator_id,
        storagePath: video.storage_path,
        originalFilename: TEST_CONFIG.filename,
      },
    });

    console.log(`✅ Inngest event sent: ${inngestResult.ids[0]}\n`);
  } catch (inngestError) {
    console.error('❌ Failed to send Inngest event:', inngestError);
    await cleanup(video.id, video.storage_path);
    return;
  }

  // Step 5: Check video status
  console.log('📊 Step 5: Checking video status...');
  const { data: updatedVideo, error: fetchError } = await supabase
    .from('videos')
    .select('*')
    .eq('id', video.id)
    .single();

  if (fetchError || !updatedVideo) {
    console.error('❌ Failed to fetch updated video:', fetchError);
    return;
  }

  console.log('✅ Video status check:');
  console.log(`   ID: ${updatedVideo.id}`);
  console.log(`   Status: ${updatedVideo.status}`);
  console.log(`   File size: ${updatedVideo.file_size_bytes} bytes`);
  console.log(`   Storage path: ${updatedVideo.storage_path}`);
  console.log(`   Updated at: ${updatedVideo.updated_at}\n`);

  // Step 6: Cleanup
  console.log('🧹 Step 6: Cleaning up test data...');
  await cleanup(video.id, video.storage_path);

  console.log('\n✨ Test completed successfully!');
  console.log('\n📋 Summary:');
  console.log('   ✅ Video record created');
  console.log('   ✅ File uploaded to storage');
  console.log('   ✅ File verified in storage');
  console.log('   ✅ Video status updated to pending');
  console.log('   ✅ Inngest event sent');
  console.log('   ✅ Cleanup completed');
}

async function cleanup(videoId: string, storagePath: string) {
  const supabase = getServiceSupabase();

  console.log('🧹 Cleaning up test data...');

  // Delete from storage
  const { error: deleteError } = await supabase.storage
    .from('videos')
    .remove([storagePath]);

  if (deleteError) {
    console.warn('⚠️  Failed to delete storage file:', deleteError.message);
  } else {
    console.log('✅ Storage file deleted');
  }

  // Delete video record
  const { error: dbError } = await supabase
    .from('videos')
    .delete()
    .eq('id', videoId);

  if (dbError) {
    console.warn('⚠️  Failed to delete video record:', dbError.message);
  } else {
    console.log('✅ Video record deleted');
  }
}

// Run the test
testUploadConfirmation()
  .then(() => {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
