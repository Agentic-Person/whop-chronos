/**
 * Individual Session API
 *
 * GET /api/chat/sessions/[id] - Get session details with messages
 * GET /api/chat/sessions/[id]?analytics=true - Get session analytics
 * PATCH /api/chat/sessions/[id] - Update session metadata
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession, updateSession } from '@/lib/rag/sessions';
import { getSessionAnalytics } from '@/lib/rag/analytics';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/chat/sessions/[id]
 * Get session details with optional analytics
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const includeMessages = searchParams.get('messages') === 'true';
    const includeAnalytics = searchParams.get('analytics') === 'true';

    if (includeAnalytics) {
      const analytics = await getSessionAnalytics(id);
      return NextResponse.json(analytics);
    }

    const session = await getSession(id, includeMessages);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to get session:', error);
    return NextResponse.json(
      {
        error: 'Failed to get session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/chat/sessions/[id]
 * Update session metadata
 */
export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const { title, context_video_ids, metadata } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates.title = title;
    if (context_video_ids !== undefined)
      updates.context_video_ids = context_video_ids;
    if (metadata !== undefined) updates.metadata = metadata;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 },
      );
    }

    const session = await updateSession(id, updates);

    return NextResponse.json(session);
  } catch (error) {
    console.error('Failed to update session:', error);
    return NextResponse.json(
      {
        error: 'Failed to update session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
