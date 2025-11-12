/**
 * Video Upload API
 *
 * POST /api/video/upload
 * - Validates creator permissions and quotas
 * - Creates video record in database
 * - Generates signed upload URL for direct client upload
 * - Triggers Inngest background processing job
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';
import {
  validateVideoUpload,
  createUploadUrl,
  generateVideoPath,
  cleanupFailedUpload,
} from '@/lib/video/storage';
import { inngest } from '@/inngest/client';
import {
  isValidVideoUrl,
  downloadAndUploadVideo,
  extractVideoMetadata,
} from '@/lib/video/url-processor';

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

interface UploadRequest {
  // For file uploads
  filename?: string;
  fileSize?: number;
  mimeType?: string;

  // For URL uploads
  videoUrl?: string;

  // Common fields
  title?: string;
  description?: string;
  creatorId: string; // From authenticated session
}

/**
 * POST /api/video/upload
 *
 * Generate signed upload URL and create video record
 * OR download from URL and upload to storage
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UploadRequest;
    const {
      filename,
      fileSize,
      mimeType,
      videoUrl,
      title,
      description,
      creatorId,
    } = body;

    // Determine upload type
    const isUrlUpload = !!videoUrl;

    // Validate based on upload type
    if (isUrlUpload) {
      // URL upload validation
      if (!videoUrl || !creatorId) {
        return NextResponse.json(
          {
            error: 'Missing required fields for URL upload: videoUrl, creatorId',
          },
          { status: 400 },
        );
      }

      // Validate URL format
      if (!isValidVideoUrl(videoUrl)) {
        return NextResponse.json(
          {
            error:
              'Invalid video URL. Only YouTube URLs are currently supported.',
          },
          { status: 400 },
        );
      }

      // Handle URL upload
      return handleUrlUpload(videoUrl, title, description, creatorId);
    } else {
      // File upload validation
      if (!filename || !fileSize || !creatorId) {
        return NextResponse.json(
          {
            error: 'Missing required fields for file upload: filename, fileSize, creatorId',
          },
          { status: 400 },
        );
      }

      // Validate file size is positive
      if (fileSize <= 0) {
        return NextResponse.json(
          { error: 'Invalid file size' },
          { status: 400 },
        );
      }

      // Handle file upload (existing logic)
      return handleFileUpload(
        filename,
        fileSize,
        mimeType,
        title,
        description,
        creatorId,
      );
    }
  } catch (error) {
    console.error('Upload API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Handle URL-based video upload
 */
async function handleUrlUpload(
  videoUrl: string,
  title: string | undefined,
  description: string | undefined,
  creatorId: string,
): Promise<NextResponse> {
  try {
    // Extract metadata first (fast, no download)
    console.log('[Upload API] Extracting metadata from URL:', videoUrl);
    const metadata = await extractVideoMetadata(videoUrl);

    // Validate file size if available
    if (metadata.fileSize) {
      const validation = await validateVideoUpload(
        creatorId,
        metadata.fileSize,
        `${metadata.title}.mp4`,
      );

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: 'Upload validation failed',
            errors: validation.errors,
            quotaInfo: validation.quotaInfo,
          },
          { status: 403 },
        );
      }
    }

    const supabase = getServiceSupabase();

    // Create video record with pending status
    console.log('[Upload API] Creating video record...');
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        creator_id: creatorId,
        title: title || metadata.title,
        description: description || metadata.description || null,
        status: 'uploading',
        duration_seconds: metadata.duration,
        thumbnail_url: metadata.thumbnail,
        file_size_bytes: metadata.fileSize || 0,
        metadata: {
          source_url: videoUrl,
          upload_started_at: new Date().toISOString(),
          upload_type: 'url',
        },
      })
      .select()
      .single();

    if (videoError || !video) {
      console.error('Error creating video record:', videoError);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 },
      );
    }

    // Download and upload video (this may take a while)
    console.log('[Upload API] Downloading and uploading video...');
    const processedVideo = await downloadAndUploadVideo(
      videoUrl,
      creatorId,
      video.id,
    );

    // Update video record with storage info
    console.log('[Upload API] Updating video with storage info...');
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        storage_path: processedVideo.storagePath,
        file_size_bytes: processedVideo.metadata.fileSize || 0,
        status: 'pending',
        metadata: {
          ...video.metadata,
          upload_completed_at: new Date().toISOString(),
        },
      })
      .eq('id', video.id);

    if (updateError) {
      console.error('Error updating video with storage info:', updateError);
      await cleanupFailedUpload(video.id, processedVideo.storagePath);
      return NextResponse.json(
        { error: 'Failed to update video record' },
        { status: 500 },
      );
    }

    console.log('[Upload API] Video uploaded successfully, video ID:', video.id);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        video: {
          id: video.id,
          title: video.title,
          status: 'pending',
          duration: metadata.duration,
          thumbnail: metadata.thumbnail,
        },
        upload: {
          type: 'url',
          storagePath: processedVideo.storagePath,
          supabaseUrl: processedVideo.supabaseUrl,
        },
        instructions: {
          message: 'Video successfully downloaded and uploaded',
          nextStep:
            'Call POST /api/video/{id}/confirm to start transcription processing',
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Upload API] URL upload error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process video URL',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * Handle file-based video upload (existing logic)
 */
async function handleFileUpload(
  filename: string,
  fileSize: number,
  mimeType: string,
  title: string | undefined,
  description: string | undefined,
  creatorId: string,
): Promise<NextResponse> {
  try {
    // Validate video upload against quotas
    const validation = await validateVideoUpload(
      creatorId,
      fileSize,
      filename,
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Upload validation failed',
          errors: validation.errors,
          quotaInfo: validation.quotaInfo,
        },
        { status: 403 },
      );
    }

    const supabase = getServiceSupabase();

    // Create video record
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .insert({
        creator_id: creatorId,
        title: title || filename,
        description: description || null,
        status: 'pending',
        file_size_bytes: fileSize,
        metadata: {
          original_filename: filename,
          mime_type: mimeType,
          upload_started_at: new Date().toISOString(),
          upload_type: 'file',
        },
      })
      .select()
      .single();

    if (videoError || !video) {
      console.error('Error creating video record:', videoError);
      return NextResponse.json(
        { error: 'Failed to create video record' },
        { status: 500 },
      );
    }

    // Generate storage path
    const storagePath = generateVideoPath(creatorId, video.id, filename);

    // Update video with storage path
    const { error: updateError } = await supabase
      .from('videos')
      .update({
        storage_path: storagePath,
        status: 'uploading',
      })
      .eq('id', video.id);

    if (updateError) {
      console.error('Error updating video storage path:', updateError);
      await cleanupFailedUpload(video.id);
      return NextResponse.json(
        { error: 'Failed to prepare upload' },
        { status: 500 },
      );
    }

    // Create signed upload URL
    const uploadUrl = await createUploadUrl(storagePath);

    if (!uploadUrl) {
      await cleanupFailedUpload(video.id, storagePath);
      return NextResponse.json(
        { error: 'Failed to generate upload URL' },
        { status: 500 },
      );
    }

    // Return upload instructions
    return NextResponse.json(
      {
        success: true,
        video: {
          id: video.id,
          title: video.title,
          status: video.status,
        },
        upload: {
          type: 'file',
          url: uploadUrl.url,
          token: uploadUrl.token,
          storagePath: storagePath,
          method: 'PUT',
          headers: {
            'Content-Type': mimeType,
          },
        },
        quotaInfo: validation.quotaInfo,
        warnings: validation.warnings,
        instructions: {
          message:
            'Upload the file to the provided URL using PUT request with the file as body',
          example:
            "fetch(upload.url, { method: 'PUT', body: file, headers: upload.headers })",
          nextStep:
            'After successful upload, call POST /api/video/{id}/confirm to start processing',
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('[Upload API] File upload error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
