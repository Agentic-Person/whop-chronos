// TypeScript types for chat analytics components

export interface ChatVolumeData {
  date: string;
  studentMessages: number;
  aiResponses: number;
  avgResponseTime: number;
}

export interface QuestionCluster {
  representative: string;
  variations: string[];
  count: number;
  avgResponseTime: number;
  referencedVideos: string[];
}

export interface QualityMetrics {
  avgLength: number;
  citationRate: number;
  followUpRate: number;
  satisfactionScore?: number;
}

export interface CostBreakdown {
  total: number;
  byModel: Record<string, number>;
  byDate: { date: string; cost: number }[];
  perMessage: number;
  perStudent: number;
}

export interface VideoReferenceData {
  videoId: string;
  videoTitle: string;
  daily: number;
  weekly: number;
  monthly: number;
}

export interface StudentChatActivityData {
  studentId: string;
  studentEmail: string;
  totalMessages: number;
  sessions: number;
  lastActive: string;
  avgSessionLength: number;
}

export interface SessionMetrics {
  totalSessions: number;
  avgMessagesPerSession: number;
  avgSessionDuration: number;
  completionRate: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  creator_id: string;
  student_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  input_tokens?: number;
  output_tokens?: number;
  model?: string;
  cost_usd?: number;
  response_time_ms?: number;
  has_video_reference?: boolean;
  video_references?: string[];
}

export interface Session {
  id: string;
  messages: ChatMessage[];
  startTime: string;
  endTime: string;
  duration: number;
  messageCount: number;
  completed: boolean;
}

export type TimeRange = '7d' | '30d' | '90d' | 'all';
export type SortBy = 'messages' | 'sessions' | 'lastActive';
