/**
 * Admin Endpoint: Video Diagnostics
 *
 * Get detailed diagnostic information for a specific video.
 * Useful for debugging stuck videos and understanding recovery options.
 *
 * @route GET /api/admin/video-diagnostics/[videoId]
 * @access Admin only (requires ADMIN_API_KEY)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVideoDiagnostics } from '@/lib/video/processor';
import { logger } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  // =========================================
  // STEP 1: VERIFY AUTHORIZATION
  // =========================================
  const authHeader = request.headers.get('authorization');
  const adminApiKey = process.env.ADMIN_API_KEY;

  if (!adminApiKey) {
    logger.error('ADMIN_API_KEY not configured', null, { component: 'video-diagnostics' });
    return NextResponse.json(
      { error: 'Server misconfiguration' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${adminApiKey}`) {
    logger.warn('Unauthorized admin access attempt', { component: 'video-diagnostics' });
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // =========================================
  // STEP 2: GET VIDEO DIAGNOSTICS
  // =========================================
  const { videoId } = params;

  try {
    const diagnostics = await getVideoDiagnostics(videoId);

    if (!diagnostics.video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    logger.info('Retrieved video diagnostics', {
      component: 'video-diagnostics',
      videoId,
      isStuck: diagnostics.isStuck
    });

    return NextResponse.json({
      success: true,
      videoId,
      diagnostics
    });
  } catch (error) {
    logger.error('Failed to get video diagnostics', error, {
      component: 'video-diagnostics',
      videoId
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve diagnostics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
