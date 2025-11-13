/**
 * Chat Message Management
 *
 * CRUD operations for chat messages with:
 * - Store all messages with video references
 * - Message editing/deletion
 * - Thread management
 * - Export capabilities (JSON, Markdown)
 */

import { getServiceSupabase } from '../db/client';
import { Tables } from '../db/client';
import type {
  ChatMessage,
  ChatMessageInsert,
  ChatMessageUpdate,
  VideoReference,
  SessionExport,
} from './types';
import { touchSession } from './sessions';
import { getSessionAnalytics } from './analytics';

/**
 * Create a new chat message
 */
export async function createMessage(
  data: Omit<ChatMessageInsert, 'id' | 'created_at'>,
): Promise<ChatMessage> {
  const supabase = getServiceSupabase();

  const { data: message, error } = await (supabase as any)
    .from(Tables.CHAT_MESSAGES)
    .insert({
      session_id: data.session_id,
      role: data.role,
      content: data.content,
      video_references: data.video_references || [],
      token_count: data.token_count || null,
      model: data.model || null,
      metadata: data.metadata || {},
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create message: ${error.message}`);
  }

  // Update session's last_message_at
  await touchSession(data.session_id);

  return message;
}

/**
 * Get messages for a session
 */
export async function getMessages(
  sessionId: string,
  options: {
    limit?: number;
    offset?: number;
    role?: 'user' | 'assistant' | 'system';
  } = {},
): Promise<ChatMessage[]> {
  const supabase = getServiceSupabase();

  let query = supabase
    .from(Tables.CHAT_MESSAGES)
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (options.role) {
    query = query.eq('role', options.role);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(
      options.offset,
      options.offset + (options.limit || 100) - 1,
    );
  }

  const { data: messages, error } = await query;

  if (error) {
    throw new Error(`Failed to get messages: ${error.message}`);
  }

  return messages || [];
}

/**
 * Get a single message by ID
 */
export async function getMessage(messageId: string): Promise<ChatMessage | null> {
  const supabase = getServiceSupabase();

  const { data: message, error } = await supabase
    .from(Tables.CHAT_MESSAGES)
    .select('*')
    .eq('id', messageId)
    .single();

  if (error) {
    return null;
  }

  return message;
}

/**
 * Update a message (for editing)
 */
export async function updateMessage(
  messageId: string,
  updates: ChatMessageUpdate,
): Promise<ChatMessage> {
  const supabase = getServiceSupabase();

  const { data: message, error } = await (supabase as any)
    .from(Tables.CHAT_MESSAGES)
    .update(updates)
    .eq('id', messageId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update message: ${error.message}`);
  }

  return message;
}

/**
 * Delete a message
 */
export async function deleteMessage(messageId: string): Promise<void> {
  const supabase = getServiceSupabase();

  const { error } = await supabase
    .from(Tables.CHAT_MESSAGES)
    .delete()
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to delete message: ${error.message}`);
  }
}

/**
 * Get message count for a session
 */
export async function getMessageCount(sessionId: string): Promise<number> {
  const supabase = getServiceSupabase();

  const { count, error } = await supabase
    .from(Tables.CHAT_MESSAGES)
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to count messages: ${error.message}`);
  }

  return count || 0;
}

/**
 * Search messages by content
 */
export async function searchMessages(
  query: string,
  options: {
    session_id?: string;
    creator_id?: string;
    student_id?: string;
    limit?: number;
  } = {},
): Promise<ChatMessage[]> {
  const supabase = getServiceSupabase();

  let messagesQuery = supabase
    .from(Tables.CHAT_MESSAGES)
    .select('*, chat_sessions!inner(creator_id, student_id)')
    .ilike('content', `%${query}%`);

  if (options.session_id) {
    messagesQuery = messagesQuery.eq('session_id', options.session_id);
  }

  if (options.creator_id) {
    messagesQuery = messagesQuery.eq(
      'chat_sessions.creator_id',
      options.creator_id,
    );
  }

  if (options.student_id) {
    messagesQuery = messagesQuery.eq(
      'chat_sessions.student_id',
      options.student_id,
    );
  }

  if (options.limit) {
    messagesQuery = messagesQuery.limit(options.limit);
  }

  const { data: messages, error } = await messagesQuery.order('created_at', {
    ascending: false,
  });

  if (error) {
    throw new Error(`Failed to search messages: ${error.message}`);
  }

  return messages || [];
}

/**
 * Export session as JSON
 */
export async function exportSessionAsJSON(
  sessionId: string,
): Promise<SessionExport> {
  const supabase = getServiceSupabase();

  // Get session
  const { data: session, error: sessionError } = await supabase
    .from(Tables.CHAT_SESSIONS)
    .select('*')
    .eq('id', sessionId)
    .single();

  if (sessionError || !session) {
    throw new Error('Session not found');
  }

  // Get messages
  const messages = await getMessages(sessionId);

  // Get analytics
  const analytics = await getSessionAnalytics(sessionId);

  return {
    session,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
      created_at: m.created_at,
      video_references: m.video_references as unknown as VideoReference[] | undefined,
    })),
    analytics,
    exported_at: new Date().toISOString(),
  };
}

/**
 * Export session as Markdown
 */
export async function exportSessionAsMarkdown(
  sessionId: string,
): Promise<string> {
  const exportData = await exportSessionAsJSON(sessionId);

  let markdown = `# ${exportData.session.title || 'Chat Session'}\n\n`;
  markdown += `**Created:** ${new Date(exportData.session.created_at).toLocaleString()}\n`;
  markdown += `**Messages:** ${exportData.analytics.message_count}\n`;
  markdown += `**Duration:** ${exportData.analytics.duration_minutes} minutes\n\n`;

  markdown += '---\n\n';

  for (const message of exportData.messages) {
    const role = message.role === 'user' ? 'You' : 'Assistant';
    const timestamp = new Date(message.created_at).toLocaleTimeString();

    markdown += `### ${role} (${timestamp})\n\n`;
    markdown += `${message.content}\n\n`;

    if (message.video_references && message.video_references.length > 0) {
      markdown += '**Video References:**\n';
      for (const ref of message.video_references) {
        markdown += `- ${ref.video_title} at ${Math.floor(ref.timestamp / 60)}:${String(ref.timestamp % 60).padStart(2, '0')}\n`;
      }
      markdown += '\n';
    }
  }

  markdown += '---\n\n';
  markdown += `*Exported on ${new Date(exportData.exported_at).toLocaleString()}*\n`;

  return markdown;
}

/**
 * Get conversation history in OpenAI format
 * Useful for continuing conversations
 */
export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export async function getConversationHistory(
  sessionId: string,
  limit?: number,
): Promise<ConversationMessage[]> {
  const messages = await getMessages(sessionId, { limit });

  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));
}

/**
 * Get messages with video references
 */
export async function getMessagesWithVideoRefs(
  sessionId: string,
): Promise<
  Array<ChatMessage & { video_references_parsed: VideoReference[] }>
> {
  const messages = await getMessages(sessionId);

  return messages.map((m) => ({
    ...m,
    video_references_parsed: (m.video_references as unknown as VideoReference[]) || [],
  }));
}

/**
 * Count messages by role
 */
export async function countMessagesByRole(sessionId: string): Promise<{
  user: number;
  assistant: number;
  system: number;
}> {
  const supabase = getServiceSupabase();

  const { data: messages, error } = await (supabase as any)
    .from(Tables.CHAT_MESSAGES)
    .select('role')
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to count messages: ${error.message}`);
  }

  const counts = {
    user: 0,
    assistant: 0,
    system: 0,
  };

  for (const message of (messages as any) || []) {
    counts[message.role as keyof typeof counts]++;
  }

  return counts;
}
