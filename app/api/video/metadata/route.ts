/**
 * Video Metadata API
 *
 * POST /api/video/metadata
 * - Extracts video metadata from URL without downloading
 * - Returns title, duration, thumbnail, description
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractVideoMetadata, isValidVideoUrl } from '@/lib/video/url-processor';

export const runtime = 'nodejs';
export const maxDuration = 60; // 1 minute

interface MetadataRequest {
  videoUrl: string;
}

/**
 * POST /api/video/metadata
 *
 * Extract metadata from video URL
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as MetadataRequest;
    const { videoUrl } = body;

    // Validate required fields
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Missing required field: videoUrl' },
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

    // Extract metadata
    console.log('[Metadata API] Extracting metadata from URL:', videoUrl);
    const metadata = await extractVideoMetadata(videoUrl);

    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    console.error('[Metadata API] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to extract video metadata',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
