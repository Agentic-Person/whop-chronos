/**
 * Individual Module API
 *
 * GET /api/modules/[id] - Get module details with video information
 * PUT /api/modules/[id] - Update module
 * DELETE /api/modules/[id] - Delete module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/modules/[id]
 *
 * Get module details including video information
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id, title, description, video_ids, videos: [...]
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing module ID' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Fetch module
    const { data: module, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !module) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Fetch videos if video_ids exist
    let videos = [];
    if (module.video_ids && module.video_ids.length > 0) {
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('id, title, description, thumbnail_url, duration_seconds, status, source_type, youtube_video_id')
        .in('id', module.video_ids)
        .eq('is_deleted', false);

      if (!videoError && videoData) {
        // Maintain the order from video_ids array
        videos = module.video_ids
          .map((videoId: string) => videoData.find((v) => v.id === videoId))
          .filter(Boolean);
      }
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          ...module,
          videos,
          video_count: videos.length,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Module fetch API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * PUT /api/modules/[id]
 *
 * Update module details
 *
 * Request body:
 * {
 *   title?: string
 *   description?: string
 *   display_order?: number
 *   video_ids?: string[]
 *   creator_id: string (required for authorization)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: { id, title, ... }
 * }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { title, description, display_order, video_ids, creator_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing module ID' },
        { status: 400 },
      );
    }

    if (!creator_id) {
      return NextResponse.json(
        { error: 'Missing creator_id for authorization' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Fetch module with course info for authorization
    const { data: module, error: fetchError } = await supabase
      .from('course_modules')
      .select('id, course_id, courses!inner(creator_id)')
      .eq('id', id)
      .single();

    if (fetchError || !module) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    const courseCreatorId = (module.courses as { creator_id: string }).creator_id;
    if (courseCreatorId !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this module', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Build update object
    const updates: {
      title?: string;
      description?: string | null;
      display_order?: number;
      video_ids?: string[];
    } = {};

    if (title !== undefined) {
      if (title.length < 3 || title.length > 200) {
        return NextResponse.json(
          { error: 'Title must be between 3 and 200 characters' },
          { status: 400 },
        );
      }
      updates.title = title;
    }
    if (description !== undefined) updates.description = description;
    if (display_order !== undefined) updates.display_order = display_order;
    if (video_ids !== undefined) {
      // Validate video_ids is an array
      if (!Array.isArray(video_ids)) {
        return NextResponse.json(
          { error: 'video_ids must be an array' },
          { status: 400 },
        );
      }
      updates.video_ids = video_ids;
    }

    // Update module
    const { data: updatedModule, error: updateError } = await supabase
      .from('course_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating module:', updateError);
      return NextResponse.json(
        { error: 'Failed to update module', code: 'UPDATE_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedModule,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Module update API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * DELETE /api/modules/[id]
 *
 * Delete a module
 *
 * Request body:
 * {
 *   creator_id: string (required for authorization)
 * }
 *
 * Response:
 * {
 *   success: true
 * }
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { creator_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing module ID' },
        { status: 400 },
      );
    }

    if (!creator_id) {
      return NextResponse.json(
        { error: 'Missing creator_id for authorization' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Fetch module with course info for authorization
    const { data: module, error: fetchError } = await supabase
      .from('course_modules')
      .select('id, course_id, courses!inner(creator_id)')
      .eq('id', id)
      .single();

    if (fetchError || !module) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    const courseCreatorId = (module.courses as { creator_id: string }).creator_id;
    if (courseCreatorId !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this module', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Delete module (cascade will handle related data)
    const { error: deleteError } = await supabase
      .from('course_modules')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting module:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete module', code: 'DELETE_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Module delete API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
