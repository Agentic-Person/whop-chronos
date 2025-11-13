/**
 * Individual Lesson API
 *
 * DELETE /api/modules/[id]/lessons/[lessonId] - Delete a lesson from a module
 * PUT /api/modules/[id]/lessons/[lessonId] - Update lesson details (optional)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * DELETE /api/modules/[id]/lessons/[lessonId]
 *
 * Delete a lesson from a module
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
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const { id: moduleId, lessonId } = await params;
    const body = await req.json();
    const { creator_id } = body;

    if (!moduleId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing module ID or lesson ID' },
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

    // Fetch lesson with module and course info for authorization
    const { data: lesson, error: fetchError } = await supabase
      .from('module_lessons')
      .select(`
        id,
        module_id,
        course_modules!inner(
          id,
          course_id,
          courses!inner(creator_id)
        )
      `)
      .eq('id', lessonId)
      .eq('module_id', moduleId)
      .single();

    if (fetchError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    const courseCreatorId = (
      (lesson as any).course_modules as {
        courses: { creator_id: string };
      }
    ).courses.creator_id;

    if (courseCreatorId !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this lesson', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Delete lesson
    const { error: deleteError } = await supabase
      .from('module_lessons')
      .delete()
      .eq('id', lessonId)
      .eq('module_id', moduleId);

    if (deleteError) {
      console.error('Error deleting lesson:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete lesson', code: 'DELETE_FAILED' },
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
    console.error('Lesson delete API error:', error);
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
 * PUT /api/modules/[id]/lessons/[lessonId]
 *
 * Update lesson details (order, title, description, etc.)
 *
 * Request body:
 * {
 *   title?: string
 *   description?: string
 *   lesson_order?: number
 *   is_required?: boolean
 *   estimated_duration_minutes?: number
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
  { params }: { params: Promise<{ id: string; lessonId: string }> },
) {
  try {
    const { id: moduleId, lessonId } = await params;
    const body = await req.json();
    const {
      title,
      description,
      lesson_order,
      is_required,
      estimated_duration_minutes,
      creator_id,
    } = body;

    if (!moduleId || !lessonId) {
      return NextResponse.json(
        { error: 'Missing module ID or lesson ID' },
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

    // Fetch lesson with module and course info for authorization
    const { data: lesson, error: fetchError } = await supabase
      .from('module_lessons')
      .select(`
        id,
        module_id,
        course_modules!inner(
          id,
          course_id,
          courses!inner(creator_id)
        )
      `)
      .eq('id', lessonId)
      .eq('module_id', moduleId)
      .single();

    if (fetchError || !lesson) {
      return NextResponse.json(
        { error: 'Lesson not found', code: 'LESSON_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    const courseCreatorId = (
      (lesson as any).course_modules as {
        courses: { creator_id: string };
      }
    ).courses.creator_id;

    if (courseCreatorId !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this lesson', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Build update object
    const updates: {
      title?: string;
      description?: string | null;
      lesson_order?: number;
      is_required?: boolean;
      estimated_duration_minutes?: number | null;
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
    if (lesson_order !== undefined) {
      if (lesson_order < 1) {
        return NextResponse.json(
          { error: 'lesson_order must be a positive integer' },
          { status: 400 },
        );
      }
      updates.lesson_order = lesson_order;
    }
    if (is_required !== undefined) updates.is_required = is_required;
    if (estimated_duration_minutes !== undefined) {
      updates.estimated_duration_minutes = estimated_duration_minutes;
    }

    // Update lesson
    const { data: updatedLesson, error: updateError } = await (supabase as any)
      .from('module_lessons')
      .update(updates)
      .eq('id', lessonId)
      .eq('module_id', moduleId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating lesson:', updateError);
      return NextResponse.json(
        { error: 'Failed to update lesson', code: 'UPDATE_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedLesson,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Lesson update API error:', error);
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
      'Access-Control-Allow-Methods': 'DELETE, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
