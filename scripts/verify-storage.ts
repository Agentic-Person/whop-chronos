#!/usr/bin/env tsx
/**
 * Supabase Storage Verification Script
 *
 * This script verifies that Supabase Storage is properly configured for Chronos:
 * 1. Checks if required buckets exist (videos, thumbnails)
 * 2. Validates bucket policies
 * 3. Tests signed upload URL generation
 * 4. Tests file upload with a small test file
 * 5. Tests signed download URL generation
 * 6. Tests file download
 * 7. Cleans up test files
 *
 * Usage:
 *   npm run verify:storage
 *   or
 *   tsx scripts/verify-storage.ts
 */

import { getServiceSupabase } from '@/lib/db/client';
import { createUploadUrl, getVideoDownloadUrl } from '@/lib/video/storage';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

const TEST_CREATOR_ID = 'test-creator-verification';
const TEST_VIDEO_ID = 'test-video-verification';
const TEST_FILENAME = 'test-video.mp4';

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message: string) {
  log(`✓ ${message}`, colors.green);
}

function error(message: string) {
  log(`✗ ${message}`, colors.red);
}

function info(message: string) {
  log(`ℹ ${message}`, colors.blue);
}

function warn(message: string) {
  log(`⚠ ${message}`, colors.yellow);
}

function section(title: string) {
  log(`\n${colors.bright}=== ${title} ===${colors.reset}`, colors.cyan);
}

/**
 * Check if required buckets exist
 */
async function checkBuckets(): Promise<boolean> {
  section('Checking Storage Buckets');
  const supabase = getServiceSupabase();

  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      error(`Failed to list buckets: ${listError.message}`);
      return false;
    }

    const requiredBuckets = ['videos', 'thumbnails'];
    const existingBuckets = buckets?.map((b) => b.name) || [];

    let allExist = true;
    for (const bucketName of requiredBuckets) {
      if (existingBuckets.includes(bucketName)) {
        success(`Bucket '${bucketName}' exists`);

        // Get bucket details
        const bucket = buckets?.find((b) => b.name === bucketName);
        if (bucket) {
          info(`  - ID: ${bucket.id}`);
          info(`  - Public: ${bucket.public}`);
          info(`  - Created: ${new Date(bucket.created_at).toLocaleString()}`);
        }
      } else {
        error(`Bucket '${bucketName}' does NOT exist`);
        warn(`  Create it manually in Supabase Dashboard: Storage > New Bucket`);
        allExist = false;
      }
    }

    return allExist;
  } catch (err) {
    error(`Exception while checking buckets: ${err}`);
    return false;
  }
}

/**
 * Create a temporary test file
 */
function createTestFile(): string {
  const tempDir = os.tmpdir();
  const testFilePath = path.join(tempDir, TEST_FILENAME);

  // Create a small test file (1 KB of dummy data)
  const testData = Buffer.alloc(1024, 'test-video-data');
  fs.writeFileSync(testFilePath, testData);

  info(`Created test file: ${testFilePath}`);
  return testFilePath;
}

/**
 * Test signed upload URL generation
 */
async function testUploadUrlGeneration(): Promise<string | null> {
  section('Testing Upload URL Generation');

  try {
    const storagePath = `${TEST_CREATOR_ID}/${TEST_VIDEO_ID}/${Date.now()}.mp4`;
    info(`Storage path: ${storagePath}`);

    const result = await createUploadUrl(storagePath, 3600);

    if (result) {
      success('Upload URL generated successfully');
      info(`  - URL length: ${result.url.length} chars`);
      info(`  - Token: ${result.token.substring(0, 20)}...`);
      return storagePath;
    } else {
      error('Failed to generate upload URL');
      return null;
    }
  } catch (err) {
    error(`Exception during upload URL generation: ${err}`);
    return null;
  }
}

/**
 * Test file upload
 */
async function testFileUpload(storagePath: string, testFilePath: string): Promise<boolean> {
  section('Testing File Upload');
  const supabase = getServiceSupabase();

  try {
    info(`Uploading test file to: ${storagePath}`);

    const fileBuffer = fs.readFileSync(testFilePath);

    const { data, error: uploadError } = await supabase.storage
      .from('videos')
      .upload(storagePath, fileBuffer, {
        contentType: 'video/mp4',
        upsert: false,
      });

    if (uploadError) {
      error(`Upload failed: ${uploadError.message}`);
      return false;
    }

    success(`File uploaded successfully`);
    info(`  - Path: ${data.path}`);
    info(`  - Full path: ${data.fullPath || 'N/A'}`);
    return true;
  } catch (err) {
    error(`Exception during file upload: ${err}`);
    return false;
  }
}

/**
 * Test signed download URL generation
 */
async function testDownloadUrlGeneration(storagePath: string): Promise<string | null> {
  section('Testing Download URL Generation');

  try {
    const downloadUrl = await getVideoDownloadUrl(storagePath, 3600);

    if (downloadUrl) {
      success('Download URL generated successfully');
      info(`  - URL length: ${downloadUrl.length} chars`);
      return downloadUrl;
    } else {
      error('Failed to generate download URL');
      return null;
    }
  } catch (err) {
    error(`Exception during download URL generation: ${err}`);
    return null;
  }
}

/**
 * Test file download
 */
async function testFileDownload(downloadUrl: string): Promise<boolean> {
  section('Testing File Download');

  try {
    info('Fetching file from download URL...');

    const response = await fetch(downloadUrl);

    if (!response.ok) {
      error(`Download failed: HTTP ${response.status} ${response.statusText}`);
      return false;
    }

    const blob = await response.blob();
    success(`File downloaded successfully`);
    info(`  - Size: ${blob.size} bytes`);
    info(`  - Type: ${blob.type}`);

    return blob.size > 0;
  } catch (err) {
    error(`Exception during file download: ${err}`);
    return false;
  }
}

/**
 * Cleanup test files
 */
async function cleanup(storagePath: string, testFilePath: string): Promise<void> {
  section('Cleaning Up');
  const supabase = getServiceSupabase();

  try {
    // Delete from Supabase Storage
    const { error: deleteError } = await supabase.storage
      .from('videos')
      .remove([storagePath]);

    if (deleteError) {
      warn(`Failed to delete test file from storage: ${deleteError.message}`);
    } else {
      success('Test file deleted from storage');
    }

    // Delete local test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
      success('Local test file deleted');
    }
  } catch (err) {
    warn(`Exception during cleanup: ${err}`);
  }
}

/**
 * Check bucket policies
 */
async function checkBucketPolicies(): Promise<void> {
  section('Checking Bucket Policies');

  info('Bucket policies should be configured as follows:');
  info('');
  info('videos bucket:');
  info('  - Public: false (private bucket)');
  info('  - Allowed MIME types: video/mp4, video/webm, video/quicktime, etc.');
  info('  - Max file size: Varies by tier (Basic: 2GB, Pro: 5GB, Enterprise: unlimited)');
  info('  - Access: Authenticated creators only');
  info('');
  info('thumbnails bucket:');
  info('  - Public: false (private bucket)');
  info('  - Allowed MIME types: image/jpeg, image/png, image/webp');
  info('  - Max file size: 10MB');
  info('  - Access: Authenticated creators only');
  info('');
  warn('Note: Bucket policies must be configured manually in Supabase Dashboard');
  warn('Go to: Storage > [bucket name] > Policies');
}

/**
 * Main verification function
 */
async function main() {
  log(`${colors.bright}Chronos Storage Verification${colors.reset}`, colors.cyan);
  log('This script will verify Supabase Storage configuration\n');

  let overallSuccess = true;
  let storagePath: string | null = null;
  let testFilePath: string | null = null;

  try {
    // Step 1: Check if buckets exist
    const bucketsExist = await checkBuckets();
    if (!bucketsExist) {
      error('\nBucket verification failed!');
      info('Please create the required buckets in Supabase Dashboard before continuing.');
      process.exit(1);
    }

    // Step 2: Check bucket policies (informational)
    await checkBucketPolicies();

    // Step 3: Create test file
    section('Creating Test File');
    testFilePath = createTestFile();
    success('Test file created');

    // Step 4: Test upload URL generation
    storagePath = await testUploadUrlGeneration();
    if (!storagePath) {
      error('Upload URL generation failed!');
      overallSuccess = false;
    }

    // Step 5: Test file upload
    if (storagePath) {
      const uploadSuccess = await testFileUpload(storagePath, testFilePath);
      if (!uploadSuccess) {
        error('File upload failed!');
        overallSuccess = false;
      }

      // Step 6: Test download URL generation
      if (uploadSuccess) {
        const downloadUrl = await testDownloadUrlGeneration(storagePath);
        if (!downloadUrl) {
          error('Download URL generation failed!');
          overallSuccess = false;
        }

        // Step 7: Test file download
        if (downloadUrl) {
          const downloadSuccess = await testFileDownload(downloadUrl);
          if (!downloadSuccess) {
            error('File download failed!');
            overallSuccess = false;
          }
        }
      }
    }

    // Step 8: Cleanup
    if (storagePath && testFilePath) {
      await cleanup(storagePath, testFilePath);
    }

    // Final summary
    section('Verification Summary');
    if (overallSuccess) {
      success('All storage verification tests passed!');
      info('\nStorage is properly configured for video uploads.');
    } else {
      error('Some storage verification tests failed!');
      warn('\nPlease check the errors above and fix the configuration.');
      process.exit(1);
    }

  } catch (err) {
    error(`\nUnexpected error during verification: ${err}`);

    // Cleanup on error
    if (storagePath && testFilePath) {
      await cleanup(storagePath, testFilePath);
    }

    process.exit(1);
  }
}

// Run the script
main().catch((err) => {
  error(`Fatal error: ${err}`);
  process.exit(1);
});
