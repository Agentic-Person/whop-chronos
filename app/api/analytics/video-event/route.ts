/**
 * Video Analytics Event Tracking API
 *
 * POST /api/analytics/video-event - Track video analytics events
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/db/client';

export const runtime = 'nodejs';

type EventType =
  | 'video_imported'
  | 'video_transcribed'
  | 'video_embedded'
  | 'video_added_to_course'
  | 'video_started'
  | 'video_progress'
  | 'video_completed'
  | 'video_rewatched';

interface VideoEventMetadata {
  source_type?: 'youtube' | 'mux' | 'loom' | 'upload';
  duration_seconds?: number;
  percent_complete?: number;
  watch_time_seconds?: number;
  cost?: number;
  transcript_method?: string;
  course_id?: string;
  module_id?: string;
}

/**
 * POST /api/analytics/video-event
 *
 * Track a video analytics event
 *
 * Request body:
 * {
 *   event_type: 'video_started' | 'video_progress' | 'video_completed' | ...
 *   video_id: string (required)
 *   creator_id: string (required)
 *   student_id?: string (optional, null for creator events)
 *   course_id?: string (optional)
 *   module_id?: string (optional)
 *   metadata: {
 *     source_type?: string
 *     duration_seconds?: number
 *     percent_complete?: number
 *     watch_time_seconds?: number
 *     cost?: number
 *     transcript_method?: string
 *   }
 * }
 *
 * Response:
 * {
 *   success: true,
 *   event_id: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      event_type,
      video_id,
      creator_id,
      student_id,
      course_id,
      module_id: _module_id,
      metadata = {},
    } = body;

    // Validate required fields
    if (!event_type || !video_id || !creator_id) {
      return NextResponse.json(
        { error: 'Missing required fields: event_type, video_id, creator_id' },
        { status: 400 },
      );
    }

    // Validate event_type
    const validEventTypes: EventType[] = [
      'video_imported',
      'video_transcribed',
      'video_embedded',
      'video_added_to_course',
      'video_started',
      'video_progress',
      'video_completed',
      'video_rewatched',
    ];

    if (!validEventTypes.includes(event_type as EventType)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validEventTypes.join(', ')}` },
        { status: 400 },
      );
    }

    const supabase = getServiceSupabase();

    // Verify video exists
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

    // Store event in metadata table (we'll use video_analytics for aggregation)
    // For now, we'll update video_analytics incrementally based on event type
    const today = new Date().toISOString().split('T')[0]!; // YYYY-MM-DD

    // Handle different event types
    if (event_type === 'video_started' || event_type === 'video_progress' || event_type === 'video_completed') {
      // Student viewing events - update video_analytics
      await updateVideoAnalytics(supabase, video_id, today, event_type, metadata, student_id);
    }

    // For creator events (imported, transcribed, embedded, added_to_course)
    // We can track these in a separate table or in video metadata
    if (event_type === 'video_added_to_course') {
      // Update video metadata to track course associations
      const { data: currentVideo } = await supabase
        .from('videos')
        .select('metadata')
        .eq('id', video_id)
        .single();

      const currentMetadata = ((currentVideo as any)?.metadata as Record<string, unknown>) || {};
      const courses = (currentMetadata['courses'] as string[]) || [];

      if (course_id && !courses.includes(course_id)) {
        courses.push(course_id);
        await (supabase
          .from('videos')
          .update as any)({
            metadata: {
              ...currentMetadata,
              courses,
            },
          })
          .eq('id', video_id);
      }
    }

    // Return success with a generated event ID
    const eventId = `${event_type}_${video_id}_${Date.now()}`;

    return NextResponse.json(
      {
        success: true,
        event_id: eventId,
        message: `Event ${event_type} tracked successfully`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Video event tracking API error:', error);
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
 * Update video analytics based on event type
 */
async function updateVideoAnalytics(
  supabase: ReturnType<typeof getServiceSupabase>,
  videoId: string,
  date: string,
  eventType: string,
  metadata: VideoEventMetadata,
  studentId?: string,
): Promise<void> {
  // Get or create analytics record for today
  const { data: existingAnalytics } = await supabase
    .from('video_analytics')
    .select('*')
    .eq('video_id', videoId)
    .eq('date', date)
    .single();

  const updates: {
    video_id: string;
    date: string;
    views?: number;
    unique_viewers?: number;
    total_watch_time_seconds?: number;
    average_watch_time_seconds?: number;
    completion_rate?: number;
    ai_interactions?: number;
    metadata: Record<string, unknown>;
  } = {
    video_id: videoId,
    date,
    metadata: (existingAnalytics as any)?.metadata || {},
  };

  if (existingAnalytics) {
    // Update existing record
    const analytics = existingAnalytics as any;
    if (eventType === 'video_started') {
      updates.views = (analytics.views || 0) + 1;

      // Track unique viewers in metadata
      const viewersSet = new Set(
        ((analytics.metadata as Record<string, string[]>)?.['viewers'] as string[]) || [],
      );
      if (studentId) viewersSet.add(studentId);
      updates.unique_viewers = viewersSet.size;
      updates.metadata = {
        ...analytics.metadata,
        viewers: Array.from(viewersSet),
      };
    }

    if (eventType === 'video_progress' && metadata.watch_time_seconds) {
      updates.total_watch_time_seconds =
        (analytics.total_watch_time_seconds || 0) + metadata.watch_time_seconds;
      updates.average_watch_time_seconds =
        (updates.total_watch_time_seconds || 0) / (updates.views || analytics.views || 1);
    }

    if (eventType === 'video_completed') {
      const completedCount = ((analytics.metadata as Record<string, number>)?.['completed_count'] as number) || 0;
      const newCompletedCount = completedCount + 1;
      const totalViews = analytics.views || 1;

      updates.completion_rate = (newCompletedCount / totalViews) * 100;
      updates.metadata = {
        ...analytics.metadata,
        completed_count: newCompletedCount,
      };
    }

    await (supabase
      .from('video_analytics')
      .update as any)(updates)
      .eq('video_id', videoId)
      .eq('date', date);
  } else {
    // Create new record
    const initialData = {
      video_id: videoId,
      date,
      views: eventType === 'video_started' ? 1 : 0,
      unique_viewers: studentId ? 1 : 0,
      total_watch_time_seconds: metadata.watch_time_seconds || 0,
      average_watch_time_seconds: metadata.watch_time_seconds || 0,
      completion_rate: eventType === 'video_completed' ? 100 : 0,
      ai_interactions: 0,
      metadata: {
        viewers: studentId ? [studentId] : [],
        completed_count: eventType === 'video_completed' ? 1 : 0,
      },
    };

    await (supabase.from('video_analytics').insert as any)(initialData);
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
