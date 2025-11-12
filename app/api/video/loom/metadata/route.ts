/**
 * Loom Video Metadata API Endpoint
 *
 * POST /api/video/loom/metadata
 *
 * Fetches metadata for a Loom video without importing it.
 * Used for preview in the video source selector.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  extractLoomVideoId,
  LoomProcessorError,
  LoomErrorCode,
  getErrorMessage
} from '@/lib/video/loom-processor';

interface MetadataRequest {
  videoUrl: string;
}

interface MetadataResponse {
  videoId: string;
  title: string;
  duration: number;
  thumbnail: string;
  creatorName: string;
  description: string;
}

/**
 * POST /api/video/loom/metadata
 *
 * Fetch Loom video metadata for preview
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body: MetadataRequest = await req.json();
    const { videoUrl } = body;

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid videoUrl' },
        { status: 400 }
      );
    }

    // Extract video ID
    const videoId = extractLoomVideoId(videoUrl.trim());

    // Get Loom API key
    const apiKey = process.env.LOOM_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Loom API key not configured' },
        { status: 500 }
      );
    }

    // Fetch metadata from Loom API
    const response = await fetch(`https://api.loom.com/v1/videos/${videoId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Video not found' },
          { status: 404 }
        );
      }
      if (response.status === 403) {
        return NextResponse.json(
          { error: 'This video is private' },
          { status: 403 }
        );
      }
      throw new Error(`Loom API error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      videoId,
      title: data.name || 'Untitled Video',
      duration: Math.floor(data.duration / 1000), // Convert ms to seconds
      thumbnail: data.thumbnail_url || '',
      creatorName: data.owner?.name || 'Unknown Creator',
      description: data.description || '',
    });

  } catch (error) {
    console.error('[Loom Metadata API] Error:', error);

    if (error instanceof LoomProcessorError) {
      return NextResponse.json(
        { error: getErrorMessage(error) },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch video metadata' },
      { status: 500 }
    );
  }
}
