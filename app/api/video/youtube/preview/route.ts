/**
 * YouTube Video Preview API
 *
 * POST /api/video/youtube/preview
 * - Gets video metadata for preview without full transcript extraction
 * - Uses youtubei.js (no yt-dlp dependency)
 * - Fast preview for UI display
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId, YouTubeProcessorError, YouTubeErrorCode, getErrorMessage } from '@/lib/video/youtube-processor';

// Lazy load youtubei.js
async function getInnertube() {
  const { Innertube } = await import('youtubei.js');
  return Innertube;
}

interface PreviewRequest {
  videoUrl: string;
}

interface PreviewResponse {
  success: true;
  videoId: string;
  title: string;
  duration: number;
  thumbnail: string;
  channelName: string;
  description: string;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: YouTubeErrorCode;
}

/**
 * POST /api/video/youtube/preview
 *
 * Get YouTube video preview/metadata without importing
 */
export async function POST(req: NextRequest): Promise<NextResponse<PreviewResponse | ErrorResponse>> {
  try {
    const body: PreviewRequest = await req.json();
    const { videoUrl } = body;

    if (!videoUrl || typeof videoUrl !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid videoUrl' },
        { status: 400 }
      );
    }

    // Extract video ID
    let videoId: string;
    try {
      videoId = extractYouTubeVideoId(videoUrl.trim());
    } catch (error) {
      if (error instanceof YouTubeProcessorError) {
        return NextResponse.json(
          { success: false, error: error.message, code: error.code },
          { status: 400 }
        );
      }
      throw error;
    }

    console.log('[YouTube Preview] Fetching metadata for:', videoId);

    // Initialize YouTube client
    const InnertubeClass = await getInnertube();
    const youtube = await InnertubeClass.create();

    // Fetch video info
    const info = await youtube.getInfo(videoId);

    if (!info || !info.basic_info) {
      return NextResponse.json(
        { success: false, error: 'Video not found or unavailable' },
        { status: 404 }
      );
    }

    const basicInfo = info.basic_info;

    // Get best thumbnail
    let thumbnail = '';
    if (basicInfo.thumbnail && Array.isArray(basicInfo.thumbnail)) {
      const thumbnails = basicInfo.thumbnail;
      const bestThumb = thumbnails.reduce((best: any, current: any) => {
        if (!best || (current.width && current.width > (best.width || 0))) {
          return current;
        }
        return best;
      }, null);
      thumbnail = bestThumb?.url || '';
    }

    // Fallback to standard YouTube thumbnail URL
    if (!thumbnail) {
      thumbnail = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
    }

    return NextResponse.json({
      success: true,
      videoId,
      title: basicInfo.title || 'Untitled Video',
      duration: basicInfo.duration || 0,
      thumbnail,
      channelName: basicInfo.author || 'Unknown Channel',
      description: (basicInfo.short_description || '').slice(0, 500),
    });

  } catch (error) {
    console.error('[YouTube Preview] Error:', error);

    if (error instanceof YouTubeProcessorError) {
      return NextResponse.json(
        { success: false, error: getErrorMessage(error), code: error.code },
        { status: 500 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: `Failed to fetch video preview: ${errorMessage}` },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
