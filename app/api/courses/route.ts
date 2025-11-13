/**
 * Courses API
 *
 * POST /api/courses - Create new course
 * GET /api/courses - List courses for creator
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * POST /api/courses
 *
 * Create a new course
 *
 * Request body:
 * {
 *   creator_id: string (required)
 *   title: string (required)
 *   description?: string
 *   thumbnail_url?: string
 *   is_published?: boolean
 *   display_order?: number
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: { id, title, description, ... }
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      creator_id,
      title,
      description,
      thumbnail_url,
      is_published = false,
      display_order,
    } = body;

    // Validate required fields
    if (!creator_id || !title) {
      return NextResponse.json(
        { error: 'Missing required fields: creator_id, title' },
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

    // Verify creator exists
    const { data: creator, error: creatorError } = await supabase
      .from('creators')
      .select('id')
      .eq('id', creator_id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found', code: 'CREATOR_NOT_FOUND' },
        { status: 404 },
      );
    }

    // Create course
    const { data: course, error } = await (supabase as any)
      .from('courses')
      .insert({
        creator_id,
        title,
        description,
        thumbnail_url,
        is_published,
        display_order,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating course:', error);
      return NextResponse.json(
        { error: 'Failed to create course', code: 'CREATION_FAILED' },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: course,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Course creation API error:', error);
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
 * GET /api/courses
 *
 * List courses for a creator
 *
 * Query parameters:
 * - creator_id: string (required)
 * - include_unpublished: boolean (optional, default: false)
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 20, max: 100)
 *
 * Response:
 * {
 *   success: true,
 *   data: { courses: [...] },
 *   pagination: { page, limit, total, totalPages, hasNextPage, hasPreviousPage }
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const creatorId = searchParams.get('creator_id');
    const includeUnpublished = searchParams.get('include_unpublished') === 'true';
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit') || '20', 10),
      100,
    );

    // Validate required fields
    if (!creatorId) {
      return NextResponse.json(
        { error: 'Missing required parameter: creator_id' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Build query with module_lessons count
    let query = supabase
      .from('courses')
      .select('*, course_modules(id, module_lessons(id))', { count: 'exact' })
      .eq('creator_id', creatorId)
      .eq('is_deleted', false);

    // Filter by published status
    if (!includeUnpublished) {
      query = query.eq('is_published', true);
    }

    // Apply sorting
    query = query.order('display_order', { ascending: true, nullsFirst: false });
    query = query.order('created_at', { ascending: false });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Execute query
    const { data: courses, error, count } = await query;

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json(
        { error: 'Failed to fetch courses', code: 'FETCH_FAILED' },
        { status: 500 },
      );
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    // Format response with module count and lesson count
    const formattedCourses = courses?.map((course: any) => {
      // Calculate total lesson count across all modules
      const lessonCount = course.course_modules?.reduce((total: number, module: any) => {
        return total + (module.module_lessons?.length || 0);
      }, 0) || 0;

      return {
        id: course.id,
        creator_id: course.creator_id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        is_published: course.is_published,
        display_order: course.display_order,
        module_count: course.course_modules?.length || 0,
        lesson_count: lessonCount,
        created_at: course.created_at,
        updated_at: course.updated_at,
        published_at: course.published_at,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          courses: formattedCourses || [],
        },
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Course list API error:', error);
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
