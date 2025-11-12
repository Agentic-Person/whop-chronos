/**
 * Course Progress API
 *
 * GET /api/courses/[courseId]/progress - Get student's progress for a course
 * POST /api/courses/[courseId]/progress - Save/update lesson completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

/**
 * GET /api/courses/[courseId]/progress
 *
 * Get student's progress for a specific course
 *
 * Query params:
 * - student_id: string (required)
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     completed_lesson_ids: string[],
 *     watch_sessions: { video_id, percent_complete, watch_time_seconds }[],
 *     course_progress_percent: number
 *   }
 * }
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');

    if (!courseId) {
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
    }

    if (!studentId) {
      return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });
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
        { status: 404 }
      );
    }

    // Get all lessons in the course
    const { data: modules, error: modulesError } = await supabase
      .from('course_modules')
      .select(`
        id,
        module_lessons (
          id,
          video_id
        )
      `)
      .eq('course_id', courseId)
      .order('display_order', { ascending: true });

    if (modulesError) {
      console.error('Error fetching modules:', modulesError);
      return NextResponse.json(
        { error: 'Failed to fetch course structure', code: 'MODULES_FETCH_FAILED' },
        { status: 500 }
      );
    }

    // Extract all video IDs from lessons
    const videoIds: string[] = [];
    const lessonMap = new Map<string, string>(); // video_id -> lesson_id

    if (modules) {
      for (const module of modules) {
        const lessons = (module as any).module_lessons || [];
        for (const lesson of lessons) {
          videoIds.push(lesson.video_id);
          lessonMap.set(lesson.video_id, lesson.id);
        }
      }
    }

    // Get watch sessions for all videos in the course
    const { data: watchSessions, error: sessionsError } = await supabase
      .from('video_watch_sessions')
      .select('video_id, percent_complete, watch_time_seconds, completed')
      .eq('student_id', studentId)
      .in('video_id', videoIds.length > 0 ? videoIds : ['']);

    if (sessionsError) {
      console.error('Error fetching watch sessions:', sessionsError);
      return NextResponse.json(
        { error: 'Failed to fetch progress', code: 'SESSIONS_FETCH_FAILED' },
        { status: 500 }
      );
    }

    // Aggregate progress by video (take highest completion)
    const videoProgress = new Map<string, { percent_complete: number; watch_time_seconds: number; completed: boolean }>();

    if (watchSessions) {
      for (const session of watchSessions) {
        const existing = videoProgress.get(session.video_id);
        if (!existing || session.percent_complete > existing.percent_complete) {
          videoProgress.set(session.video_id, {
            percent_complete: session.percent_complete,
            watch_time_seconds: session.watch_time_seconds,
            completed: session.completed,
          });
        }
      }
    }

    // Build completed lesson IDs (videos with 90%+ completion)
    const completedLessonIds: string[] = [];
    for (const [videoId, progress] of videoProgress.entries()) {
      if (progress.completed) {
        const lessonId = lessonMap.get(videoId);
        if (lessonId) {
          completedLessonIds.push(lessonId);
        }
      }
    }

    // Calculate overall course progress
    const totalLessons = videoIds.length;
    const completedLessons = completedLessonIds.length;
    const courseProgressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

    // Format watch sessions for response
    const formattedSessions = Array.from(videoProgress.entries()).map(([videoId, progress]) => ({
      video_id: videoId,
      lesson_id: lessonMap.get(videoId),
      percent_complete: progress.percent_complete,
      watch_time_seconds: progress.watch_time_seconds,
      completed: progress.completed,
    }));

    return NextResponse.json(
      {
        success: true,
        data: {
          completed_lesson_ids: completedLessonIds,
          watch_sessions: formattedSessions,
          course_progress_percent: courseProgressPercent,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Course progress GET error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/courses/[courseId]/progress
 *
 * Save/update lesson completion and watch progress
 *
 * Request body:
 * {
 *   student_id: string (required)
 *   video_id: string (required)
 *   percent_complete: number (0-100)
 *   watch_time_seconds: number
 *   completed?: boolean
 *   device_type?: 'desktop' | 'mobile' | 'tablet'
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: { session_id, ... }
 * }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const body = await req.json();
    const {
      student_id,
      video_id,
      percent_complete = 0,
      watch_time_seconds = 0,
      completed,
      device_type = 'desktop',
    } = body;

    // Validate required fields
    if (!courseId) {
      return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
    }

    if (!student_id || !video_id) {
      return NextResponse.json(
        { error: 'Missing required fields: student_id, video_id' },
        { status: 400 }
      );
    }

    // Validate percent_complete range
    if (percent_complete < 0 || percent_complete > 100) {
      return NextResponse.json(
        { error: 'percent_complete must be between 0 and 100' },
        { status: 400 }
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
        { status: 404 }
      );
    }

    // Verify video exists and is in the course
    const { data: lesson, error: lessonError } = await supabase
      .from('module_lessons')
      .select(`
        id,
        video_id,
        course_modules!inner (
          course_id
        )
      `)
      .eq('video_id', video_id)
      .eq('course_modules.course_id', courseId)
      .single();

    if (lessonError || !lesson) {
      return NextResponse.json(
        { error: 'Video not found in this course', code: 'VIDEO_NOT_IN_COURSE' },
        { status: 404 }
      );
    }

    // Determine completion status
    const isCompleted = completed !== undefined ? completed : percent_complete >= 90;

    // Create or update watch session
    const { data: session, error: sessionError } = await supabase
      .from('video_watch_sessions')
      .insert({
        video_id,
        student_id,
        watch_time_seconds,
        percent_complete,
        completed: isCompleted,
        device_type,
        referrer_type: 'course_page',
        metadata: {
          course_id: courseId,
          lesson_id: lesson.id,
        },
      })
      .select()
      .single();

    if (sessionError) {
      console.error('Error creating watch session:', sessionError);
      return NextResponse.json(
        { error: 'Failed to save progress', code: 'SESSION_CREATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: session,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Course progress POST error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
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
