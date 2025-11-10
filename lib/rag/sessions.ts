/**
 * Chat Session Management
 *
 * CRUD operations for chat sessions with:
 * - Auto-create session on first message
 * - Lazy title generation from first message
 * - Session search and filtering
 * - Soft delete with archive
 * - Session metadata management
 */

import { getServiceSupabase } from '../db/client';
import { Tables } from '../db/client';
import type {
  ChatSession,
  ChatSessionInsert,
  ChatSessionUpdate,
  SessionWithMessages,
  SessionListItem,
  SessionFilters,
  PaginationOptions,
  PaginatedResponse,
} from './types';
import { generateSessionTitle } from './title-generator';

/**
 * Create a new chat session
 * Called automatically on first message if no session exists
 */
export async function createSession(
  data: Omit<ChatSessionInsert, 'id' | 'created_at' | 'updated_at'>,
): Promise<ChatSession> {
  const supabase = getServiceSupabase();

  const { data: session, error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .insert({
      student_id: data.student_id,
      creator_id: data.creator_id,
      title: data.title || null, // Will be generated later
      context_video_ids: data.context_video_ids || [],
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`);
  }

  return session;
}

/**
 * Get session by ID with optional message loading
 */
export async function getSession(
  sessionId: string,
  includeMessages = false,
): Promise<SessionWithMessages | ChatSession | null> {
  const supabase = getServiceSupabase();

  const { data: session, error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .select('*')
    .eq('id', sessionId)
    .single();

  if (error || !session) {
    return null;
  }

  if (!includeMessages) {
    return session;
  }

  // Load messages
  const { data: messages, error: messagesError } = await supabase
    .from(Tables.CHAT_MESSAGES)
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (messagesError) {
    throw new Error(`Failed to load messages: ${messagesError.message}`);
  }

  const totalTokens = messages.reduce(
    (sum, msg) => sum + (msg.token_count || 0),
    0,
  );

  return {
    ...session,
    messages: messages || [],
    message_count: messages?.length || 0,
    total_tokens: totalTokens,
    total_cost: 0, // Will be calculated by cost calculator
  };
}

/**
 * Get or create session for a student
 * Returns active session or creates new one
 */
export async function getOrCreateSession(
  studentId: string,
  creatorId: string,
  contextVideoIds: string[] = [],
): Promise<ChatSession> {
  const supabase = getServiceSupabase();

  // Try to find most recent active session
  const { data: existingSession } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .select('*')
    .eq('student_id', studentId)
    .eq('creator_id', creatorId)
    .order('last_message_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // If session exists and is recent (< 24 hours old), use it
  if (existingSession) {
    const lastActivity = existingSession.last_message_at || existingSession.created_at;
    const hoursSinceActivity =
      (Date.now() - new Date(lastActivity).getTime()) / (1000 * 60 * 60);

    if (hoursSinceActivity < 24) {
      return existingSession;
    }
  }

  // Create new session
  return createSession({
    student_id: studentId,
    creator_id: creatorId,
    context_video_ids: contextVideoIds,
  });
}

/**
 * Update session title (lazy generation)
 */
export async function updateSessionTitle(
  sessionId: string,
  title: string,
): Promise<void> {
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .update({ title })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to update session title: ${error.message}`);
  }
}

/**
 * Generate and set session title from first message
 * Called after first user message is sent
 */
export async function generateAndSetTitle(
  sessionId: string,
  firstMessage: string,
): Promise<string> {
  try {
    const title = await generateSessionTitle(firstMessage);
    await updateSessionTitle(sessionId, title);
    return title;
  } catch (error) {
    // Fallback to date-based title
    const fallbackTitle = `Chat from ${new Date().toLocaleDateString()}`;
    await updateSessionTitle(sessionId, fallbackTitle);
    return fallbackTitle;
  }
}

/**
 * Update session metadata
 */
export async function updateSession(
  sessionId: string,
  updates: ChatSessionUpdate,
): Promise<ChatSession> {
  const supabase = getServiceSupabase();

  const { data: session, error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update session: ${error.message}`);
  }

  return session;
}

/**
 * Update last_message_at timestamp
 * Called automatically when message is added
 */
export async function touchSession(sessionId: string): Promise<void> {
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', sessionId);

  if (error) {
    console.error('Failed to touch session:', error);
    // Don't throw - this is not critical
  }
}

/**
 * Archive session (soft delete)
 */
export async function archiveSession(sessionId: string): Promise<void> {
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .update({
      metadata: {
        archived: true,
        archived_at: new Date().toISOString(),
      },
    })
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to archive session: ${error.message}`);
  }
}

/**
 * Hard delete session and all messages
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = getServiceSupabase();

  // Messages will be cascade deleted by database constraint
  const { error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .delete()
    .eq('id', sessionId);

  if (error) {
    throw new Error(`Failed to delete session: ${error.message}`);
  }
}

/**
 * List sessions with filters and pagination
 */
export async function listSessions(
  filters: SessionFilters = {},
  pagination: PaginationOptions = {},
): Promise<PaginatedResponse<SessionListItem>> {
  const supabase = getServiceSupabase();

  const {
    page = 1,
    limit = 20,
    sort_by = 'last_message_at',
    sort_order = 'desc',
  } = pagination;

  const offset = (page - 1) * limit;

  // Build query
  let query = supabase
    .from(Tables.CHAT_SESSIONS)
    .select('*, chat_messages(count)', { count: 'exact' });

  // Apply filters
  if (filters.student_id) {
    query = query.eq('student_id', filters.student_id);
  }

  if (filters.creator_id) {
    query = query.eq('creator_id', filters.creator_id);
  }

  if (filters.from_date) {
    query = query.gte('created_at', filters.from_date);
  }

  if (filters.to_date) {
    query = query.lte('created_at', filters.to_date);
  }

  if (filters.has_title !== undefined) {
    if (filters.has_title) {
      query = query.not('title', 'is', null);
    } else {
      query = query.is('title', null);
    }
  }

  if (filters.video_ids && filters.video_ids.length > 0) {
    query = query.overlaps('context_video_ids', filters.video_ids);
  }

  // Exclude archived
  query = query.or('metadata->>archived.is.null,metadata->>archived.eq.false');

  // Apply sorting
  query = query.order(sort_by, {
    ascending: sort_order === 'asc',
    nullsFirst: sort_order === 'desc',
  });

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data: sessions, error, count } = await query;

  if (error) {
    throw new Error(`Failed to list sessions: ${error.message}`);
  }

  // Get first message preview for each session
  const sessionIds = sessions?.map((s) => s.id) || [];
  const { data: firstMessages } = await supabase
    .from(Tables.CHAT_MESSAGES)
    .select('session_id, content')
    .in('session_id', sessionIds)
    .eq('role', 'user')
    .order('created_at', { ascending: true });

  const firstMessageMap = new Map(
    firstMessages?.map((m) => [m.session_id, m.content]) || [],
  );

  const items: SessionListItem[] =
    sessions?.map((session) => ({
      id: session.id,
      title: session.title,
      created_at: session.created_at,
      updated_at: session.updated_at,
      last_message_at: session.last_message_at,
      message_count: Array.isArray(session.chat_messages)
        ? session.chat_messages.length
        : 0,
      preview: firstMessageMap.get(session.id)?.slice(0, 100) || null,
      video_count: session.context_video_ids?.length || 0,
    })) || [];

  return {
    data: items,
    total: count || 0,
    page,
    limit,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Search sessions by title or message content
 */
export async function searchSessions(
  query: string,
  filters: SessionFilters = {},
  pagination: PaginationOptions = {},
): Promise<PaginatedResponse<SessionListItem>> {
  const supabase = getServiceSupabase();

  // Search in both session titles and message content
  const { data: matchingSessions } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .select('id')
    .ilike('title', `%${query}%`);

  const { data: matchingMessages } = await supabase
    .from(Tables.CHAT_MESSAGES)
    .select('session_id')
    .ilike('content', `%${query}%`);

  const sessionIds = new Set([
    ...(matchingSessions?.map((s) => s.id) || []),
    ...(matchingMessages?.map((m) => m.session_id) || []),
  ]);

  // Return all sessions if no matches
  if (sessionIds.size === 0) {
    return {
      data: [],
      total: 0,
      page: 1,
      limit: pagination.limit || 20,
      total_pages: 0,
    };
  }

  // Filter sessions by IDs and other filters
  return listSessions(
    {
      ...filters,
      // We'll need to add custom filtering here
    },
    pagination,
  );
}

/**
 * Get session count for student
 */
export async function getSessionCount(studentId: string): Promise<number> {
  const supabase = getServiceSupabase();

  const { count, error } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .or('metadata->>archived.is.null,metadata->>archived.eq.false');

  if (error) {
    throw new Error(`Failed to count sessions: ${error.message}`);
  }

  return count || 0;
}
