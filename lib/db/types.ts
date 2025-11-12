/**
 * Database Types
 *
 * Auto-generated TypeScript types for Supabase database schema
 * Generate with: npx supabase gen types typescript --project-id <project-id> > lib/db/types.ts
 *
 * Or use Supabase CLI:
 * supabase gen types typescript --linked > lib/db/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      creators: {
        Row: {
          id: string;
          whop_company_id: string;
          whop_user_id: string;
          email: string;
          name: string | null;
          subscription_tier: 'basic' | 'pro' | 'enterprise';
          settings: Json;
          created_at: string;
          updated_at: string;
          last_login_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          whop_company_id: string;
          whop_user_id: string;
          email: string;
          name?: string | null;
          subscription_tier?: 'basic' | 'pro' | 'enterprise';
          settings?: Json;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          whop_company_id?: string;
          whop_user_id?: string;
          email?: string;
          name?: string | null;
          subscription_tier?: 'basic' | 'pro' | 'enterprise';
          settings?: Json;
          created_at?: string;
          updated_at?: string;
          last_login_at?: string | null;
          is_active?: boolean;
        };
      };
      students: {
        Row: {
          id: string;
          whop_user_id: string;
          whop_membership_id: string;
          creator_id: string;
          email: string;
          name: string | null;
          preferences: Json;
          created_at: string;
          updated_at: string;
          last_active_at: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          whop_user_id: string;
          whop_membership_id: string;
          creator_id: string;
          email: string;
          name?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          whop_user_id?: string;
          whop_membership_id?: string;
          creator_id?: string;
          email?: string;
          name?: string | null;
          preferences?: Json;
          created_at?: string;
          updated_at?: string;
          last_active_at?: string | null;
          is_active?: boolean;
        };
      };
      videos: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          url: string | null;
          storage_path: string | null;
          thumbnail_url: string | null;
          duration_seconds: number | null;
          transcript: string | null;
          transcript_language: string | null;
          status: 'pending' | 'uploading' | 'transcribing' | 'processing' | 'embedding' | 'completed' | 'failed';
          error_message: string | null;
          processing_started_at: string | null;
          processing_completed_at: string | null;
          file_size_bytes: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          is_deleted: boolean;
          source_type: 'youtube' | 'upload' | 'mux' | 'loom';
          youtube_video_id: string | null;
          youtube_channel_id: string | null;
          whop_lesson_id: string | null;
          mux_asset_id: string | null;
          mux_playback_id: string | null;
          embed_type: 'youtube' | 'loom' | 'vimeo' | 'wistia' | null;
          embed_id: string | null;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          url?: string | null;
          storage_path?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          transcript?: string | null;
          transcript_language?: string | null;
          status?: 'pending' | 'uploading' | 'transcribing' | 'processing' | 'embedding' | 'completed' | 'failed';
          error_message?: string | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          source_type?: 'youtube' | 'upload' | 'mux' | 'loom';
          youtube_video_id?: string | null;
          youtube_channel_id?: string | null;
          whop_lesson_id?: string | null;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          embed_type?: 'youtube' | 'loom' | 'vimeo' | 'wistia' | null;
          embed_id?: string | null;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          url?: string | null;
          storage_path?: string | null;
          thumbnail_url?: string | null;
          duration_seconds?: number | null;
          transcript?: string | null;
          transcript_language?: string | null;
          status?: 'pending' | 'uploading' | 'transcribing' | 'processing' | 'embedding' | 'completed' | 'failed';
          error_message?: string | null;
          processing_started_at?: string | null;
          processing_completed_at?: string | null;
          file_size_bytes?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          is_deleted?: boolean;
          source_type?: 'youtube' | 'upload' | 'mux' | 'loom';
          youtube_video_id?: string | null;
          youtube_channel_id?: string | null;
          whop_lesson_id?: string | null;
          mux_asset_id?: string | null;
          mux_playback_id?: string | null;
          embed_type?: 'youtube' | 'loom' | 'vimeo' | 'wistia' | null;
          embed_id?: string | null;
        };
      };
      video_chunks: {
        Row: {
          id: string;
          video_id: string;
          chunk_index: number;
          chunk_text: string;
          embedding: number[] | null;
          start_time_seconds: number;
          end_time_seconds: number;
          word_count: number;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          chunk_index: number;
          chunk_text: string;
          embedding?: number[] | null;
          start_time_seconds: number;
          end_time_seconds: number;
          word_count: number;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          chunk_index?: number;
          chunk_text?: string;
          embedding?: number[] | null;
          start_time_seconds?: number;
          end_time_seconds?: number;
          word_count?: number;
          metadata?: Json;
          created_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          creator_id: string;
          title: string;
          description: string | null;
          thumbnail_url: string | null;
          is_published: boolean;
          display_order: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
          published_at: string | null;
          is_deleted: boolean;
        };
        Insert: {
          id?: string;
          creator_id: string;
          title: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          display_order?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          is_deleted?: boolean;
        };
        Update: {
          id?: string;
          creator_id?: string;
          title?: string;
          description?: string | null;
          thumbnail_url?: string | null;
          is_published?: boolean;
          display_order?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          published_at?: string | null;
          is_deleted?: boolean;
        };
      };
      course_modules: {
        Row: {
          id: string;
          course_id: string;
          title: string;
          description: string | null;
          video_ids: string[];
          display_order: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          course_id: string;
          title: string;
          description?: string | null;
          video_ids?: string[];
          display_order: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          course_id?: string;
          title?: string;
          description?: string | null;
          video_ids?: string[];
          display_order?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          student_id: string;
          creator_id: string;
          title: string | null;
          context_video_ids: string[];
          metadata: Json;
          created_at: string;
          updated_at: string;
          last_message_at: string | null;
        };
        Insert: {
          id?: string;
          student_id: string;
          creator_id: string;
          title?: string | null;
          context_video_ids?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
        Update: {
          id?: string;
          student_id?: string;
          creator_id?: string;
          title?: string | null;
          context_video_ids?: string[];
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          last_message_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          video_references: Json;
          token_count: number | null;
          model: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          role: 'user' | 'assistant' | 'system';
          content: string;
          video_references?: Json;
          token_count?: number | null;
          model?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          role?: 'user' | 'assistant' | 'system';
          content?: string;
          video_references?: Json;
          token_count?: number | null;
          model?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      video_analytics: {
        Row: {
          id: string;
          video_id: string;
          date: string;
          views: number;
          unique_viewers: number;
          total_watch_time_seconds: number;
          average_watch_time_seconds: number | null;
          completion_rate: number | null;
          ai_interactions: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          date: string;
          views?: number;
          unique_viewers?: number;
          total_watch_time_seconds?: number;
          average_watch_time_seconds?: number | null;
          completion_rate?: number | null;
          ai_interactions?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          date?: string;
          views?: number;
          unique_viewers?: number;
          total_watch_time_seconds?: number;
          average_watch_time_seconds?: number | null;
          completion_rate?: number | null;
          ai_interactions?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_metrics: {
        Row: {
          id: string;
          creator_id: string;
          date: string;
          storage_used_bytes: number;
          videos_uploaded: number;
          total_video_duration_seconds: number;
          ai_credits_used: number;
          transcription_minutes: number;
          chat_messages_sent: number;
          active_students: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creator_id: string;
          date: string;
          storage_used_bytes?: number;
          videos_uploaded?: number;
          total_video_duration_seconds?: number;
          ai_credits_used?: number;
          transcription_minutes?: number;
          chat_messages_sent?: number;
          active_students?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          creator_id?: string;
          date?: string;
          storage_used_bytes?: number;
          videos_uploaded?: number;
          total_video_duration_seconds?: number;
          ai_credits_used?: number;
          transcription_minutes?: number;
          chat_messages_sent?: number;
          active_students?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      vector_index_stats: {
        Row: {
          total_chunks: number | null;
          chunks_with_embeddings: number | null;
          chunks_without_embeddings: number | null;
          embedding_coverage_percent: number | null;
        };
      };
    };
    Functions: {
      search_video_chunks: {
        Args: {
          query_embedding: number[];
          match_count?: number;
          similarity_threshold?: number;
          filter_video_ids?: string[] | null;
        };
        Returns: {
          chunk_id: string;
          video_id: string;
          chunk_text: string;
          start_time_seconds: number;
          end_time_seconds: number;
          similarity: number;
        }[];
      };
    };
    Enums: {
      subscription_tier: 'basic' | 'pro' | 'enterprise';
      video_status: 'pending' | 'uploading' | 'transcribing' | 'processing' | 'embedding' | 'completed' | 'failed';
      chat_role: 'user' | 'assistant' | 'system';
    };
  };
}
