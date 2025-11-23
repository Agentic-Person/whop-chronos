/**
 * Student Courses API
 *
 * GET /api/courses/student - List courses available to a student with progress
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

// Dev mode test IDs
const DEV_CREATOR_ID = '00000000-0000-0000-0000-000000000001';
const isDevMode = process.env.DEV_BYPASS_AUTH === 'true';

/**
 * GET /api/courses/student
 *
 * List courses for a student with their progress
 *
 * Query parameters:
 * - student_id: string (required)
 * - filter: 'all' | 'in_progress' | 'completed' (optional, default: 'all')
 * - search: string (optional)
 * - sort: 'recent' | 'progress' | 'name' (optional, default: 'recent')
 * - page: number (optional, default: 1)
 * - limit: number (optional, default: 20, max: 100)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     courses: [
 *       {
 *         id: string,
 *         title: string,
 *         description: string,
 *         thumbnail_url: string | null,
 *         module_count: number,
 *         total_duration: number, // in minutes
 *         progress: number, // 0-100
 *         status: 'not_started' | 'in_progress' | 'completed'
 *       }
 *     ]
 *   },
 *   pagination: {...}
 * }
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');
    const filter = searchParams.get('filter') || 'all';
    const search = searchParams.get('search') || '';
    const sort = searchParams.get('sort') || 'recent';
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(
      Number.parseInt(searchParams.get('limit') || '20', 10),
      100,
    );

    // Validate required fields
    if (!studentId) {
      return NextResponse.json(
        { error: 'Missing required parameter: student_id' },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // First, get all published courses with modules
    // In dev mode, filter by test creator so students only see their creator's courses
    let coursesQuery = supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        thumbnail_url,
        created_at,
        updated_at,
        course_modules (
          id,
          module_lessons (
            id,
            video_id,
            estimated_duration_minutes
          )
        )
      `)
      .eq('is_published', true)
      .eq('is_deleted', false);

    // In dev mode, filter to only show test creator's courses
    if (isDevMode) {
      coursesQuery = coursesQuery.eq('creator_id', DEV_CREATOR_ID);
    }

    // Apply search filter
    if (search) {
      coursesQuery = coursesQuery.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: courses, error: coursesError } = await coursesQuery;

    if (coursesError) {
      console.error('Error fetching courses:', coursesError);
      return NextResponse.json(
        { error: 'Failed to fetch courses', code: 'FETCH_FAILED' },
        { status: 500 },
      );
    }

    // Get student progress for all courses
    const { data: progressData, error: progressError } = await supabase
      .from('video_watch_sessions')
      .select('video_id, completed, furthest_point_reached')
      .eq('student_id', studentId);

    if (progressError) {
      console.error('Error fetching progress:', progressError);
      // Continue without progress data
    }

    // Build progress map: video_id -> { completed, furthest_point }
    type ProgressSession = {
      video_id: string;
      completed: boolean;
      furthest_point_reached: number;
    };

    const progressMap = new Map<string, { completed: boolean; furthest: number }>();
    if (progressData && Array.isArray(progressData)) {
      for (const session of progressData as ProgressSession[]) {
        const existing = progressMap.get(session.video_id);
        progressMap.set(session.video_id, {
          completed: session.completed || existing?.completed || false,
          furthest: Math.max(
            session.furthest_point_reached || 0,
            existing?.furthest || 0
          ),
        });
      }
    }

    // Calculate progress for each course
    const coursesWithProgress = courses?.map((course: any) => {
      const lessons = course.course_modules?.flatMap(
        (module: any) => module.module_lessons || []
      ) || [];

      const moduleCount = course.course_modules?.length || 0;
      const lessonCount = lessons.length;

      // Calculate total duration
      const totalDuration = lessons.reduce(
        (sum: number, lesson: any) => sum + (lesson.estimated_duration_minutes || 0),
        0
      );

      // Calculate progress
      let completedLessons = 0;
      if (lessonCount > 0) {
        for (const lesson of lessons) {
          const videoProgress = progressMap.get(lesson.video_id);
          if (videoProgress?.completed) {
            completedLessons++;
          }
        }
      }

      const progress = lessonCount > 0 ? Math.round((completedLessons / lessonCount) * 100) : 0;

      // Determine status
      let status: 'not_started' | 'in_progress' | 'completed' = 'not_started';
      if (progress === 100) {
        status = 'completed';
      } else if (progress > 0) {
        status = 'in_progress';
      }

      return {
        id: course.id,
        title: course.title,
        description: course.description,
        thumbnail_url: course.thumbnail_url,
        module_count: moduleCount,
        total_duration: totalDuration,
        progress,
        status,
        created_at: course.created_at,
        updated_at: course.updated_at,
      };
    }) || [];

    // Apply status filter
    let filteredCourses = coursesWithProgress;
    if (filter !== 'all') {
      filteredCourses = coursesWithProgress.filter(
        (course: any) => course.status === filter
      );
    }

    // Apply sorting
    switch (sort) {
      case 'recent':
        filteredCourses.sort(
          (a: any, b: any) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        break;
      case 'progress':
        filteredCourses.sort((a: any, b: any) => b.progress - a.progress);
        break;
      case 'name':
        filteredCourses.sort((a: any, b: any) =>
          a.title.localeCompare(b.title)
        );
        break;
    }

    // Apply pagination
    const total = filteredCourses.length;
    const from = (page - 1) * limit;
    const to = from + limit;
    const paginatedCourses = filteredCourses.slice(from, to);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json(
      {
        success: true,
        data: {
          courses: paginatedCourses,
        },
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage,
          hasPreviousPage,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Student courses API error:', error);
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
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
