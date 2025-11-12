/**
 * Database Types
 *
 * Auto-generated TypeScript types for Supabase database schema
 * Last Updated: November 12, 2025 (Agent 1 - Video Implementation)
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// Type alias for module lesson
export type ModuleLesson = Database['public']['Tables']['module_lessons']['Row'];
export type ModuleLessonInsert = Database['public']['Tables']['module_lessons']['Insert'];
export type ModuleLessonUpdate = Database['public']['Tables']['module_lessons']['Update'];

// Type alias for video analytics events
export type VideoAnalyticsEvent = Database['public']['Tables']['video_analytics_events']['Row'];
export type VideoAnalyticsEventInsert = Database['public']['Tables']['video_analytics_events']['Insert'];

// Type alias for video watch sessions
export type VideoWatchSession = Database['public']['Tables']['video_watch_sessions']['Row'];
export type VideoWatchSessionInsert = Database['public']['Tables']['video_watch_sessions']['Insert'];
export type VideoWatchSessionUpdate = Database['public']['Tables']['video_watch_sessions']['Update'];

// Export full database interface (content continues but truncated for brevity)
export interface Database {
  public: {
    Tables: {
      module_lessons: {
        Row: {
          id: string;
          module_id: string;
          video_id: string;
          lesson_order: number;
          title: string;
          description: string | null;
          is_required: boolean;
          estimated_duration_minutes: number | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          module_id: string;
          video_id: string;
          lesson_order: number;
          title: string;
          description?: string | null;
          is_required?: boolean;
          estimated_duration_minutes?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          module_id?: string;
          video_id?: string;
          lesson_order?: number;
          title?: string;
          description?: string | null;
          is_required?: boolean;
          estimated_duration_minutes?: number | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      video_analytics_events: {
        Row: {
          id: string;
          event_type: 'video_imported' | 'video_transcribed' | 'video_embedded' | 'video_added_to_course' | 'video_started' | 'video_progress' | 'video_completed' | 'video_rewatched';
          video_id: string;
          creator_id: string;
          student_id: string | null;
          course_id: string | null;
          module_id: string | null;
          metadata: Json;
          timestamp: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          event_type: 'video_imported' | 'video_transcribed' | 'video_embedded' | 'video_added_to_course' | 'video_started' | 'video_progress' | 'video_completed' | 'video_rewatched';
          video_id: string;
          creator_id: string;
          student_id?: string | null;
          course_id?: string | null;
          module_id?: string | null;
          metadata?: Json;
          timestamp?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          event_type?: 'video_imported' | 'video_transcribed' | 'video_embedded' | 'video_added_to_course' | 'video_started' | 'video_progress' | 'video_completed' | 'video_rewatched';
          video_id?: string;
          creator_id?: string;
          student_id?: string | null;
          course_id?: string | null;
          module_id?: string | null;
          metadata?: Json;
          timestamp?: string;
          created?: string;
        };
      };
      video_watch_sessions: {
        Row: {
          id: string;
          video_id: string;
          student_id: string;
          session_start: string;
          session_end: string | null;
          watch_time_seconds: number;
          percent_complete: number;
          completed: boolean;
          device_type: 'desktop' | 'mobile' | 'tablet' | null;
          referrer_type: 'course_page' | 'direct_link' | 'search' | 'chat_reference' | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          video_id: string;
          student_id: string;
          session_start?: string;
          session_end?: string | null;
          watch_time_seconds?: number;
          percent_complete?: number;
          completed?: boolean;
          device_type?: 'desktop' | 'mobile' | 'tablet' | null;
          referrer_type?: 'course_page' | 'direct_link' | 'search' | 'chat_reference' | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          video_id?: string;
          student_id?: string;
          session_start?: string;
          session_end?: string | null;
          watch_time_seconds?: number;
          percent_complete?: number;
          completed?: boolean;
          device_type?: 'desktop' | 'mobile' | 'tablet' | null;
          referrer_type?: 'course_page' | 'direct_link' | 'search' | 'chat_reference' | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
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
          source_type: 'youtube' | 'mux' | 'loom' | 'upload';
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
          status?: 'pending' | 'uploading' | 'transcribing' | 'processing' | 
