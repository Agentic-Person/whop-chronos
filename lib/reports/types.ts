// Report Types and Interfaces

export type DataType = 'videos' | 'students' | 'chat' | 'all';
export type ExportFormat = 'csv' | 'pdf' | 'json';
export type ReportFrequency = 'daily' | 'weekly' | 'monthly';
export type TemplateType = 'executive' | 'detailed' | 'student' | 'content' | 'custom';

export interface ExportOptions {
  dataType: DataType;
  format: ExportFormat;
  dateRange: {
    start: string;
    end: string;
  };
  columns?: string[];
  filters?: Record<string, any>;
  fileName?: string;
}

export interface ReportSection {
  type: 'header' | 'summary' | 'chart' | 'table' | 'text';
  title: string;
  data?: any;
  chartType?: 'line' | 'bar' | 'pie' | 'area';
  content?: string;
}

export interface ReportTemplate {
  name: string;
  description: string;
  sections: ReportSection[];
  layout: 'single-column' | 'two-column';
  includeCharts: boolean;
}

export interface ReportSchedule {
  id: string;
  creator_id: string;
  name: string;
  template: TemplateType;
  frequency: ReportFrequency;
  delivery_time: string;
  delivery_day?: number;
  recipients: string[];
  options: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ReportHistory {
  id: string;
  creator_id: string;
  schedule_id?: string;
  name: string;
  type: string;
  file_url?: string;
  file_size_bytes?: number;
  generated_at: string;
  delivered_at?: string;
  delivery_status?: 'pending' | 'sent' | 'failed';
}

export interface AnalyticsData {
  quickStats: {
    totalVideos: number;
    totalStudents: number;
    totalViews: number;
    avgCompletionRate: number;
    totalWatchTime: number;
    activeSessions: number;
  };
  videos: Array<{
    id: string;
    title: string;
    views: number;
    watch_time: number;
    completion_rate: number;
    engagement_score: number;
    created_at: string;
  }>;
  students: Array<{
    id: string;
    email: string;
    total_sessions: number;
    avg_session_duration: number;
    last_active: string;
    engagement_score: number;
  }>;
  chatMessages: Array<{
    id: string;
    session_id: string;
    role: string;
    content: string;
    created_at: string;
    video_references?: string[];
  }>;
  timeSeriesData: Array<{
    date: string;
    views: number;
    sessions: number;
    watch_time: number;
  }>;
}

export interface ReportMetadata {
  title: string;
  dateRange: {
    start: string;
    end: string;
  };
  generatedAt: string;
  creatorName?: string;
  companyName?: string;
  branding?: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
  };
}
