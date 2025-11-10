/**
 * RAG Chat Types
 *
 * Type definitions for chat sessions, messages, analytics, and cost tracking
 */

import type { Database } from '../db/types';

// Database table types
export type ChatSession = Database['public']['Tables']['chat_sessions']['Row'];
export type ChatSessionInsert = Database['public']['Tables']['chat_sessions']['Insert'];
export type ChatSessionUpdate = Database['public']['Tables']['chat_sessions']['Update'];

export type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
export type ChatMessageInsert = Database['public']['Tables']['chat_messages']['Insert'];
export type ChatMessageUpdate = Database['public']['Tables']['chat_messages']['Update'];

// Video reference structure in chat messages
export interface VideoReference {
  video_id: string;
  video_title: string;
  timestamp: number;
  chunk_text: string;
  similarity: number;
}

// Session with full details
export interface SessionWithMessages extends ChatSession {
  messages: ChatMessage[];
  message_count: number;
  total_tokens: number;
  total_cost: number;
}

// Session list item with summary
export interface SessionListItem {
  id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string | null;
  message_count: number;
  preview: string | null; // First user message preview
  video_count: number;
}

// Session analytics
export interface SessionAnalytics {
  session_id: string;
  duration_minutes: number;
  message_count: number;
  user_messages: number;
  assistant_messages: number;
  total_tokens: number;
  total_cost: number;
  videos_referenced: number;
  avg_response_time_ms: number | null;
  most_referenced_videos: Array<{
    video_id: string;
    video_title: string;
    reference_count: number;
  }>;
}

// Creator-level chat analytics
export interface CreatorChatAnalytics {
  creator_id: string;
  period: 'day' | 'week' | 'month' | 'all';
  total_sessions: number;
  total_messages: number;
  total_students: number;
  total_tokens: number;
  total_cost: number;
  avg_messages_per_session: number;
  avg_session_duration_minutes: number;
  most_active_students: Array<{
    student_id: string;
    student_name: string | null;
    session_count: number;
    message_count: number;
  }>;
  most_referenced_videos: Array<{
    video_id: string;
    video_title: string;
    reference_count: number;
    unique_sessions: number;
  }>;
  common_topics: Array<{
    keyword: string;
    count: number;
  }>;
  peak_usage_hours: Array<{
    hour: number;
    message_count: number;
  }>;
}

// Cost breakdown
export interface CostBreakdown {
  input_tokens: number;
  output_tokens: number;
  embedding_queries: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  embedding_cost: number;
  total_cost: number;
}

// Cost calculator options
export interface CostCalculatorOptions {
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  embedding_queries?: number;
}

// Usage tracking for analytics
export interface ChatUsageMetrics {
  creator_id: string;
  date: string;
  sessions_created: number;
  messages_sent: number;
  tokens_used: number;
  cost_usd: number;
  unique_students: number;
  avg_session_duration_minutes: number;
}

// Session export formats
export type ExportFormat = 'json' | 'pdf' | 'markdown';

export interface SessionExport {
  session: ChatSession;
  messages: Array<{
    role: string;
    content: string;
    created_at: string;
    video_references?: VideoReference[];
  }>;
  analytics: SessionAnalytics;
  exported_at: string;
}

// Session filters
export interface SessionFilters {
  student_id?: string;
  creator_id?: string;
  from_date?: string;
  to_date?: string;
  has_title?: boolean;
  min_messages?: number;
  video_ids?: string[];
  search_query?: string;
}

// Pagination
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'last_message_at' | 'message_count';
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}
