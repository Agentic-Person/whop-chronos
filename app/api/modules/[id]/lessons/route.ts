/**
 * Module Lessons API
 *
 * POST /api/modules/[id]/lessons - Add a lesson to a module
 * GET /api/modules/[id]/lessons - List all lessons in a module
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/modules/[id]/lessons
 *
 * Add a new lesson to a module
 *
 * Request body:
 * {
 *   video_id: string (required)
 *   title: string (required)
 *   description?: string
 *   lesson_order: number (required)
 *   is_required?: boolean
 *   estimated_duration_minutes?: number
 *   creator_id: string (required for authorization)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: { id, module_id, video_id, ... }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: moduleId } = await params;
    const body = await req.json();
    const {
      video_id,
      title,
      description,
      lesson_order,
      is_required = true,
      estimated_duration_minutes,
      creator_id,
    } = body;

    // Validate required fields
    if (!moduleId) {
      return NextResponse.json(
        { error: 'Missing module ID' },
        { status: 400 },
      );
    }

    if (!video_id || !title || lesson_order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: video_id, title, lesson_order' },
        { status: 400 },
      );
    }

    if (!creator_id) {
      return NextResponse.json(
        { error: 'Missing creator_id for authorization' },
        { status: 400 },
      );
    }

    // Validate title length
    if (title.length < 3 || title.length > 200) {
      return NextResponse.json(
        { error: 'Title must be between 3 and 200 characters' },
        { status: 400 },
      );
    }

    // Validate lesson_order is positive
    if (lesson_order < 1) {
      return NextResponse.json(
        { error: 'lesson_order must be a positive integer' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify module exists and user owns it
    const { data: module, error: moduleError } = await supabase
      .from('course_modules')
      .select('id, course_id, courses!inner(creator_id)')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Check authorization
    const courseCreatorId = ((module as any).courses as { creator_id: string }).creator_id;
    if (courseCreatorId !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: You do not own this module', code: 'FORBIDDEN' },
        { status: 403 },
      );
    }

    // Verify video exists and belongs to creator
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, creator_id')
      .eq('id', video_id)
      .eq('is_deleted', false)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found', code: 'VIDEO_NOT_FOUND' },
        { status: 404 },
      );
    }

    if ((video as any).creator_id !== creator_id) {
      return NextResponse.json(
        { error: 'Forbidden: Video does not belong to you', code: 'VIDEO_FORBIDDEN' },
        { status: 403 },
      );
    }

    // Create lesson
    const { data: lesson, error } = await (supabase as any)
      .from('module_lessons')
      .insert({
        module_id: moduleId,
        video_id,
        title,
        description,
        lesson_order,
        is_required,
        estimated_duration_minutes,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      // Check for unique constraint violation (duplicate video in module)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'This video is already in this module', code: 'DUPLICATE_LESSON' },
          { status: 409 },
        );
      }

      console.error('Error creating lesson:', error);
      return NextResponse.json(
        { error: 'Failed to create lesson', code: 'CREATION_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: lesson,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Lesson creation API error:', error);
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
 * GET /api/modules/[id]/lessons
 *
 * List all lessons in a module, ordered by lesson_order
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     lessons: [{ id, video_id, title, video: {...}, ... }]
 *   }
 * }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: moduleId } = await params;

    if (!moduleId) {
      return NextResponse.json(
        { error: 'Missing module ID' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify module exists
    const { data: module, error: moduleError } = await supabase
      .from('course_modules')
      .select('id')
      .eq('id', moduleId)
      .single();

    if (moduleError || !module) {
      return NextResponse.json(
        { error: 'Module not found', code: 'MODULE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Fetch lessons with video details
    const { data: lessons, error } = await supabase
      .from('module_lessons')
      .select(`
        *,
        videos (
          id,
          title,
          description,
          thumbnail_url,
          duration_seconds,
          status,
          source_type,
          youtube_video_id,
          embed_type,
          embed_id
        )
      `)
      .eq('module_id', moduleId)
      .order('lesson_order', { ascending: true });

    if (error) {
      console.error('Error fetching lessons:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons', code: 'FETCH_FAILED' },
        { status: 500 },
      );
    }

    // Format response
    const formattedLessons = lessons?.map((lesson: any) => ({
      id: lesson.id,
      module_id: lesson.module_id,
      video_id: lesson.video_id,
      title: lesson.title,
      description: lesson.description,
      lesson_order: lesson.lesson_order,
      is_required: lesson.is_required,
      estimated_duration_minutes: lesson.estimated_duration_minutes,
      metadata: lesson.metadata,
      created_at: lesson.created_at,
      updated_at: lesson.updated_at,
      video: lesson.videos,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          lessons: formattedLessons || [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Lesson list API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
