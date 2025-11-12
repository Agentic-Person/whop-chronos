/**
 * Individual Course API
 *
 * GET /api/courses/[id] - Get course details
 * PUT /api/courses/[id] - Update course
 * DELETE /api/courses/[id] - Delete course
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/courses/[id]
 *
 * Get detailed course information including modules
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     id, title, description, modules: [...]
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
        { error: 'Missing course ID' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Fetch course with modules
    const { data: course, error } = await supabase
      .from('courses')
      .select(
        `
        *,
        course_modules (
          id,
          title,
          description,
          video_ids,
          display_order,
          created_at,
          updated_at
        )
      `,
      )
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (error || !course) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Sort modules by display_order
    const sortedModules = course.course_modules?.sort(
      (a: { display_order: number }, b: { display_order: number }) =>
        a.display_order - b.display_order,
    );

    return NextResponse.json(
      {
        success: true,
        data: {
          ...course,
          course_modules: sortedModules || [],
          module_count: sortedModules?.length || 0,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Course fetch API error:', error);
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
 * PUT /api/courses/[id]
 *
 * Update course details
 *
 * Request body:
 * {
 *   title?: string
 *   description?: string
 *   thumbnail_url?: string
 *   is_published?: boolean
 *   display_order?: number
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
    const {
      title,
      description,
      thumbnail_url,
      is_published,
      display_order,
      creator_id,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Missing course ID' },
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

    // Verify course exists and user owns it
    const { data: existingCourse, error: fetchError } = await supabase
      .from('courses')
      .select('id, creator_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !existingCourse) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    if (existingCourse.creator_id !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this course', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Build update object (only include provided fields)
    const updates: {
      title?: string;
      description?: string | null;
      thumbnail_url?: string | null;
      is_published?: boolean;
      display_order?: number | null;
      published_at?: string | null;
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
    if (thumbnail_url !== undefined) updates.thumbnail_url = thumbnail_url;
    if (display_order !== undefined) updates.display_order = display_order;

    // Handle publishing status change
    if (is_published !== undefined) {
      updates.is_published = is_published;
      // Set published_at timestamp when publishing for the first time
      if (is_published && !existingCourse.published_at) {
        updates.published_at = new Date().toISOString();
      }
    }

    // Update course
    const { data: updatedCourse, error: updateError } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating course:', updateError);
      return NextResponse.json(
        { error: 'Failed to update course', code: 'UPDATE_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedCourse,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Course update API error:', error);
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
 * DELETE /api/courses/[id]
 *
 * Soft delete a course
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
        { error: 'Missing course ID' },
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

    // Verify course exists and user owns it
    const { data: course, error: fetchError } = await supabase
      .from('courses')
      .select('id, creator_id')
      .eq('id', id)
      .eq('is_deleted', false)
      .single();

    if (fetchError || !course) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    if (course.creator_id !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this course', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Soft delete the course
    const { error: deleteError } = await supabase
      .from('courses')
      .update({ is_deleted: true })
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting course:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete course', code: 'DELETE_FAILED' },
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
    console.error('Course delete API error:', error);
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
