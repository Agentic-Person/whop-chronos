/**
 * Session Export API
 *
 * GET /api/chat/export/[id]?format=json - Export session as JSON
 * GET /api/chat/export/[id]?format=markdown - Export session as Markdown
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  exportSessionAsJSON,
  exportSessionAsMarkdown,
} from '@/lib/rag/messages';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/chat/export/[id]
 * Export session in specified format
 */
export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    if (format === 'json') {
      const data = await exportSessionAsJSON(id);

      return NextResponse.json(data, {
        headers: {
          'Content-Disposition': `attachment; filename="session-${id}.json"`,
          'Content-Type': 'application/json',
        },
      });
    }

    if (format === 'markdown') {
      const markdown = await exportSessionAsMarkdown(id);

      return new NextResponse(markdown, {
        headers: {
          'Content-Disposition': `attachment; filename="session-${id}.md"`,
          'Content-Type': 'text/markdown',
        },
      });
    }

    return NextResponse.json(
      { error: `Unsupported format: ${format}` },
      { status: 400 },
    );
  } catch (error) {
    console.error('Failed to export session:', error);
    return NextResponse.json(
      {
        error: 'Failed to export session',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
