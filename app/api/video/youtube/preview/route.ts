/**
 * YouTube Video Preview API
 *
 * POST /api/video/youtube/preview
 * - Gets video metadata for preview without full transcript extraction
 * - Uses youtubei.js with oEmbed fallback
 * - Fast preview for UI display
 */

import { NextRequest, NextResponse } from 'next/server';
import { extractYouTubeVideoId, YouTubeProcessorError, YouTubeErrorCode, getErrorMessage } from '@/lib/video/youtube-processor';

// Lazy load youtubei.js
async function getInnertube() {
  const { Innertube } = await import('youtubei.js');
  return Innertube;
}

// Fallback: YouTube oEmbed API (always works, no auth required)
interface OEmbedResponse {
  title: string;
  author_name: string;
  thumbnail_url: string;
  thumbnail_width: number;
  thumbnail_height: number;
}

async function getOEmbedData(videoId: string): Promise<OEmbedResponse | null> {
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error('[YouTube Preview] oEmbed fallback failed:', error);
    return null;
  }
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

    let title = '';
    let duration = 0;
    let channelName = '';
    let description = '';
    let thumbnail = '';

    // Try youtubei.js first (provides duration)
    try {
      const InnertubeClass = await getInnertube();
      const youtube = await InnertubeClass.create();
      const info = await youtube.getInfo(videoId);

      // Debug logging
      console.log('[YouTube Preview] info keys:', info ? Object.keys(info) : 'null');

      if (info?.basic_info) {
        const basicInfo = info.basic_info;

        console.log('[YouTube Preview] Extracted from youtubei.js:', {
          title: basicInfo?.title,
          duration: basicInfo?.duration,
          author: basicInfo?.author,
          hasThumbnail: !!basicInfo?.thumbnail,
        });

        title = basicInfo?.title || '';
        duration = basicInfo?.duration || 0;
        channelName = basicInfo?.author || '';
        description = basicInfo?.short_description || '';

        // Get thumbnail from basic_info
        if (basicInfo?.thumbnail && Array.isArray(basicInfo.thumbnail) && basicInfo.thumbnail.length > 0) {
          const sortedThumbs = [...basicInfo.thumbnail].sort((a: any, b: any) => (b.width || 0) - (a.width || 0));
          thumbnail = sortedThumbs[0]?.url || '';
          console.log('[YouTube Preview] Found thumbnail from youtubei.js:', thumbnail);
        }
      }
    } catch (innertubeError) {
      console.error('[YouTube Preview] youtubei.js failed:', innertubeError);
      // Continue to oEmbed fallback
    }

    // Always try oEmbed for reliable title/thumbnail (it's more reliable in serverless)
    console.log('[YouTube Preview] Fetching oEmbed data for additional/fallback info');
    const oembedData = await getOEmbedData(videoId);
    if (oembedData) {
      console.log('[YouTube Preview] oEmbed data:', oembedData);
      // Use oEmbed title if we don't have one
      if (!title) {
        title = oembedData.title;
      }
      // Use oEmbed channel name if we don't have one
      if (!channelName) {
        channelName = oembedData.author_name;
      }
      // Use oEmbed thumbnail if we don't have one (or as backup)
      if (!thumbnail && oembedData.thumbnail_url) {
        thumbnail = oembedData.thumbnail_url;
      }
    }

    // Final fallback for thumbnail
    if (!thumbnail) {
      thumbnail = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`;
      console.log('[YouTube Preview] Using fallback thumbnail:', thumbnail);
    }

    const response = {
      success: true as const,
      videoId,
      title: title || 'Untitled Video',
      duration: duration,
      thumbnail,
      channelName: channelName || 'Unknown Channel',
      description: description.slice(0, 500),
    };

    console.log('[YouTube Preview] Final response:', response);

    return NextResponse.json(response);

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
