/**
 * Course Modules API
 *
 * POST /api/courses/[id]/modules - Create new module in course
 * GET /api/courses/[id]/modules - List modules for course
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/courses/[id]/modules
 *
 * Create a new module in a course
 *
 * Request body:
 * {
 *   title: string (required)
 *   description?: string
 *   display_order: number (required)
 *   video_ids?: string[] (optional, defaults to empty array)
 *   creator_id: string (required for authorization)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: { id, title, description, ... }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: courseId } = await params;
    const body = await req.json();
    const { title, description, display_order, video_ids = [], creator_id } = body;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing course ID' },
        { status: 400 },
      );
    }

    if (!title || display_order === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, display_order' },
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

    const supabase = getServiceSupabase();

    // Verify course exists and user owns it
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, creator_id')
      .eq('id', courseId)
      .eq('is_deleted', false)
      .single();

    if (courseError || !course) {
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

    // Create module
    const { data: module, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title,
        description,
        display_order,
        video_ids,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating module:', error);
      return NextResponse.json(
        { error: 'Failed to create module', code: 'CREATION_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: module,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Module creation API error:', error);
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
 * GET /api/courses/[id]/modules
 *
 * List all modules for a course
 *
 * Response:
 * {
 *   success: true,
 *   data: { modules: [...] }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: courseId } = await params;

    if (!courseId) {
      return NextResponse.json(
        { error: 'Missing course ID' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify course exists
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('is_deleted', false)
      .single();

    if (courseError || !course) {
      return NextResponse.json(
        { error: 'Course not found', code: 'COURSE_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Fetch modules
    const { data: modules, error } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', courseId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching modules:', error);
      return NextResponse.json(
        { error: 'Failed to fetch modules', code: 'FETCH_FAILED' },
        { status: 500 },
      );
    }

    // Add video count to each module
    const formattedModules = modules?.map((module) => ({
      ...module,
      video_count: module.video_ids?.length || 0,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          modules: formattedModules || [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Module list API error:', error);
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
