/**
 * Chat Sessions API
 *
 * GET    /api/chat/sessions - List sessions for student
 * POST   /api/chat/sessions - Create new session
 * PATCH  /api/chat/sessions/:id - Rename session
 * DELETE /api/chat/sessions/:id - Archive session
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  listSessions,
  createSession,
  updateSession,
  archiveSession,
} from '@/lib/rag/sessions';
import type { SessionFilters, PaginationOptions } from '@/lib/rag/types';

/**
 * GET /api/chat/sessions
 * List chat sessions with filters and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse filters
    const filters: SessionFilters = {
      student_id: searchParams.get('student_id') || undefined,
      creator_id: searchParams.get('creator_id') || undefined,
      from_date: searchParams.get('from_date') || undefined,
      to_date: searchParams.get('to_date') || undefined,
      has_title:
        searchParams.get('has_title') === 'true'
          ? true
          : searchParams.get('has_title') === 'false'
            ? false
            : undefined,
      min_messages: searchParams.get('min_messages')
        ? Number.parseInt(searchParams.get('min_messages')!)
        : undefined,
      search_query: searchParams.get('search') || undefined,
    };

    // Parse pagination
    const pagination: PaginationOptions = {
      page: searchParams.get('page')
        ? Number.parseInt(searchParams.get('page')!)
        : 1,
      limit: searchParams.get('limit')
        ? Number.parseInt(searchParams.get('limit')!)
        : 20,
      sort_by:
        (searchParams.get('sort_by') as
          | 'created_at'
          | 'updated_at'
          | 'last_message_at'
          | 'message_count') || 'last_message_at',
      sort_order:
        (searchParams.get('sort_order') as 'asc' | 'desc') || 'desc',
    };

    const result = await listSessions(filters, pagination);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to list sessions:', error);
    return NextResponse.json(
      {
        error: 'Failed to list sessions',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/chat/sessions
 * Create a new chat session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { student_id, creator_id, title, context_video_ids, metadata } =
      body;

    if (!student_id || !creator_id) {
      return NextResponse.json(
        { error: 'student_id and creator_id are required' },
        { status: 400 },
      );
    }

    const session = await createSession({
      student_id,
      creator_id,
      title: title || null,
      context_video_ids: context_video_ids || [],
      metadata: metadata || {},
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/chat/sessions/:id
 * Update session (rename, update context videos, etc.)
 */
export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { title, context_video_ids, metadata } = body;

    const updates: Record<string, unknown> = {};
    if (title !== undefined) updates['title'] = title;
    if (context_video_ids !== undefined)
      updates['context_video_ids'] = context_video_ids;
    if (metadata !== undefined) updates['metadata'] = metadata;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No updates provided' },
        { status: 400 },
      );
    }

    const session = await updateSession(sessionId, updates);

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

/**
 * DELETE /api/chat/sessions/:id
 * Archive session (soft delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'session_id is required' },
        { status: 400 },
      );
    }

    await archiveSession(sessionId);

    return NextResponse.json({ success: true, message: 'Session archived' });
  } catch (error) {
    console.error('Failed to archive session:', error);
    return NextResponse.json(
      {
        error: 'Failed to archive session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
