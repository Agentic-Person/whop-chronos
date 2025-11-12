/**
 * Thumbnail Upload API
 *
 * POST /api/video/thumbnail
 * - Upload thumbnail to Supabase Storage
 * - Update video record with thumbnail URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/video/thumbnail
 *
 * Upload thumbnail for a video
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;
    const videoId = formData.get('videoId') as string;

    if (!file || !path) {
      return NextResponse.json(
        { error: 'Missing file or path' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('thumbnails')
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Thumbnail upload error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload thumbnail', message: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('thumbnails')
      .getPublicUrl(path);

    const thumbnailUrl = urlData.publicUrl;

    // Update video record if videoId provided
    if (videoId) {
      const { error: updateError } = await supabase
        .from('videos')
        .update({ thumbnail_url: thumbnailUrl })
        .eq('id', videoId);

      if (updateError) {
        console.error('Error updating video thumbnail:', updateError);
        // Don't fail the request, thumbnail is still uploaded
      }
    }

    return NextResponse.json(
      {
        success: true,
        url: thumbnailUrl,
        path: uploadData.path,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Thumbnail API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
