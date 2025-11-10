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

export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutes

interface UploadRequest {
  filename: string;
  fileSize: number;
  mimeType: string;
  title?: string;
  description?: string;
  creatorId: string; // From authenticated session
}

/**
 * POST /api/video/upload
 *
 * Generate signed upload URL and create video record
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as UploadRequest;
    const { filename, fileSize, mimeType, title, description, creatorId } =
      body;

    // Validate required fields
    if (!filename || !fileSize || !creatorId) {
      return NextResponse.json(
        {
          error: 'Missing required fields: filename, fileSize, creatorId',
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
