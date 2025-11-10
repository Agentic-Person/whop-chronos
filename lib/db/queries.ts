/**
 * Database Query Helpers
 *
 * Centralized database query functions with type safety
 * Organized by domain/table
 */

import { getServiceSupabase } from './client';
import type { Database } from './types';

type Tables = Database['public']['Tables'];

// =====================================================
// CREATOR QUERIES
// =====================================================

/**
 * Get creator by Whop company ID
 */
export async function getCreatorByWhopCompanyId(whopCompanyId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('creators')
    .select('*')
    .eq('whop_company_id', whopCompanyId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found
    throw error;
  }

  return data;
}

/**
 * Create or update creator
 */
export async function upsertCreator(
  creator: Partial<Tables['creators']['Insert']> & {
    whop_company_id: string;
  },
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('creators')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(creator as any, {
      onConflict: 'whop_company_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update creator settings
 */
export async function updateCreatorSettings(
  creatorId: string,
  settings: Record<string, unknown>,
) {
  const supabase = getServiceSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = (await supabase
    .from('creators')
    // @ts-expect-error Supabase type mismatch with JSON column
    .update({ settings })
    .eq('id', creatorId)
    .select()
    .single()) as any;

  if (error) throw error;
  return data;
}

// =====================================================
// STUDENT QUERIES
// =====================================================

/**
 * Get student by Whop user ID
 */
export async function getStudentByWhopUserId(whopUserId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('whop_user_id', whopUserId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Get student by membership ID
 */
export async function getStudentByMembershipId(membershipId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('whop_membership_id', membershipId)
    .eq('is_active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Create or update student
 */
export async function upsertStudent(
  student: Partial<Tables['students']['Insert']> & {
    whop_user_id: string;
  },
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('students')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(student as any, {
      onConflict: 'whop_user_id',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Deactivate student (membership expired/cancelled)
 */
export async function deactivateStudent(membershipId: string) {
  const supabase = getServiceSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await supabase
    .from('students')
    // @ts-expect-error Supabase type mismatch
    .update({ is_active: false })
    .eq('whop_membership_id', membershipId)) as any;

  if (error) throw error;
}

// =====================================================
// VIDEO QUERIES
// =====================================================

/**
 * Get videos by creator with pagination
 */
export async function getCreatorVideos(
  creatorId: string,
  options?: {
    limit?: number;
    offset?: number;
    status?: Tables['videos']['Row']['status'];
    includeDeleted?: boolean;
  },
) {
  const supabase = getServiceSupabase();

  let query = supabase
    .from('videos')
    .select('*, video_chunks(count)', { count: 'exact' })
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (!options?.includeDeleted) {
    query = query.eq('is_deleted', false);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  return { videos: data || [], total: count || 0 };
}

/**
 * Get video by ID with full details
 */
export async function getVideoById(videoId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('videos')
    .select(`
      *,
      creator:creators(*),
      chunks:video_chunks(count)
    `)
    .eq('id', videoId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Update video status
 */
export async function updateVideoStatus(
  videoId: string,
  status: Tables['videos']['Row']['status'],
  errorMessage?: string,
) {
  const supabase = getServiceSupabase();

  const updateData: Partial<Tables['videos']['Update']> = {
    status,
    error_message: errorMessage || null,
  };

  if (status === 'processing') {
    updateData.processing_started_at = new Date().toISOString();
  } else if (status === 'completed') {
    updateData.processing_completed_at = new Date().toISOString();
  }

  // @ts-expect-error Supabase type mismatch
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await supabase.from('videos').update(updateData).eq('id', videoId)) as any;

  if (error) throw error;
}

/**
 * Soft delete video
 */
export async function softDeleteVideo(videoId: string) {
  const supabase = getServiceSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = (await supabase
    .from('videos')
    // @ts-expect-error Supabase type mismatch
    .update({ is_deleted: true })
    .eq('id', videoId)) as any;

  if (error) throw error;
}

// =====================================================
// VIDEO CHUNK QUERIES
// =====================================================

/**
 * Bulk insert video chunks with embeddings
 */
export async function insertVideoChunks(
  chunks: Tables['video_chunks']['Insert'][],
) {
  const supabase = getServiceSupabase();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await supabase.from('video_chunks').insert(chunks as any).select();

  if (error) throw error;
  return data;
}

/**
 * Search video chunks by semantic similarity
 * Uses the search_video_chunks database function
 */
export async function searchVideoChunks(
  queryEmbedding: number[],
  options?: {
    matchCount?: number;
    similarityThreshold?: number;
    filterVideoIds?: string[];
  },
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase.rpc('search_video_chunks', {
    query_embedding: queryEmbedding,
    match_count: options?.matchCount || 5,
    similarity_threshold: options?.similarityThreshold || 0.7,
    filter_video_ids: options?.filterVideoIds || null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (error) throw error;
  return data;
}

// =====================================================
// COURSE QUERIES
// =====================================================

/**
 * Get courses by creator
 */
export async function getCreatorCourses(creatorId: string, publishedOnly = false) {
  const supabase = getServiceSupabase();

  let query = supabase
    .from('courses')
    .select(`
      *,
      modules:course_modules(
        *,
        video_count:video_ids
      )
    `)
    .eq('creator_id', creatorId)
    .eq('is_deleted', false)
    .order('display_order', { ascending: true });

  if (publishedOnly) {
    query = query.eq('is_published', true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Get course by ID with modules
 */
export async function getCourseById(courseId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      creator:creators(*),
      modules:course_modules(
        *,
        videos:video_ids
      )
    `)
    .eq('id', courseId)
    .order('display_order', { foreignTable: 'course_modules' })
    .single();

  if (error) throw error;
  return data;
}

// =====================================================
// CHAT QUERIES
// =====================================================

/**
 * Create chat session
 */
export async function createChatSession(
  session: Tables['chat_sessions']['Insert'],
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('chat_sessions')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(session as any)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get chat session with messages
 */
export async function getChatSessionWithMessages(sessionId: string) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('chat_sessions')
    .select(`
      *,
      messages:chat_messages(*)
    `)
    .eq('id', sessionId)
    .order('created_at', { foreignTable: 'chat_messages', ascending: true })
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add message to chat session
 */
export async function addChatMessage(
  message: Tables['chat_messages']['Insert'],
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('chat_messages')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert(message as any)
    .select()
    .single();

  if (error) throw error;

  // Update session's last_message_at
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (await supabase
    .from('chat_sessions')
    // @ts-expect-error Supabase type mismatch
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', message.session_id)) as any;

  return data;
}

/**
 * Get student's recent chat sessions
 */
export async function getStudentChatSessions(studentId: string, limit = 20) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*, messages:chat_messages(count)')
    .eq('student_id', studentId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
}

// =====================================================
// ANALYTICS QUERIES
// =====================================================

/**
 * Record video analytics for a date
 */
export async function upsertVideoAnalytics(
  analytics: Tables['video_analytics']['Insert'],
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('video_analytics')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(analytics as any, {
      onConflict: 'video_id,date',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get video analytics for date range
 */
export async function getVideoAnalytics(
  videoId: string,
  startDate: string,
  endDate: string,
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('video_analytics')
    .select('*')
    .eq('video_id', videoId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Get creator overview analytics
 */
export async function getCreatorAnalytics(
  creatorId: string,
  startDate: string,
  endDate: string,
) {
  const supabase = getServiceSupabase();

  // Get all video analytics for creator's videos
  const { data, error } = await supabase
    .from('video_analytics')
    .select(`
      *,
      video:videos!inner(creator_id)
    `)
    .eq('video.creator_id', creatorId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// =====================================================
// USAGE METRICS QUERIES
// =====================================================

/**
 * Record usage metrics for a date
 */
export async function upsertUsageMetrics(
  metrics: Tables['usage_metrics']['Insert'],
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('usage_metrics')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(metrics as any, {
      onConflict: 'creator_id,date',
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get creator's current usage for quota checks
 */
export async function getCurrentUsage(creatorId: string) {
  const supabase = getServiceSupabase();

  const today = new Date().toISOString().split('T')[0] || '';

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('date', today)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

/**
 * Get usage metrics for date range
 */
export async function getUsageMetrics(
  creatorId: string,
  startDate: string,
  endDate: string,
) {
  const supabase = getServiceSupabase();

  const { data, error } = await supabase
    .from('usage_metrics')
    .select('*')
    .eq('creator_id', creatorId)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// =====================================================
// USAGE STATS QUERIES
// =====================================================

/**
 * Get creator's current usage statistics
 * Used for quota checks and usage dashboards
 */
export async function getCreatorUsageStats(creatorId: string) {
  const supabase = getServiceSupabase();

  // Get video count and total storage
  const { data: videos } = await supabase
    .from('videos')
    .select('id, file_size_bytes')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  const videoCount = videos?.length || 0;
  const totalStorageBytes =
    videos?.reduce((sum, v) => sum + (v.file_size_bytes || 0), 0) || 0;

  // Get AI message count for current month
  const firstOfMonth = new Date();
  firstOfMonth.setDate(1);
  firstOfMonth.setHours(0, 0, 0, 0);

  const { data: messages } = await supabase
    .from('chat_messages')
    .select('id, session:chat_sessions!inner(creator_id)')
    .eq('session.creator_id', creatorId)
    .gte('created_at', firstOfMonth.toISOString());

  const aiMessageCount = messages?.length || 0;

  // Get active student count
  const { data: students } = await supabase
    .from('students')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('is_active', true);

  const studentCount = students?.length || 0;

  // Get course count
  const { data: courses } = await supabase
    .from('courses')
    .select('id')
    .eq('creator_id', creatorId)
    .eq('is_deleted', false);

  const courseCount = courses?.length || 0;

  return {
    videoCount,
    totalStorageBytes,
    aiMessageCount,
    studentCount,
    courseCount,
  };
}
