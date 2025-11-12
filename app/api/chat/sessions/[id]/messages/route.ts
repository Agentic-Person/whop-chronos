/**
 * Chat Session Messages API
 *
 * GET /api/chat/sessions/[id]/messages - Get all messages in a session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMessages } from '@/lib/rag/messages';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/chat/sessions/[id]/messages
 * Fetch all messages for a specific session
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;

    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit')
      ? Number.parseInt(searchParams.get('limit')!)
      : undefined;
    const offset = searchParams.get('offset')
      ? Number.parseInt(searchParams.get('offset')!)
      : undefined;
    const role = searchParams.get('role') as 'user' | 'assistant' | 'system' | null;

    const messages = await getMessages(id, {
      limit,
      offset,
      role: role || undefined,
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
