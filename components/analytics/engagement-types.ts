/**
 * Student Engagement Analytics Type Definitions
 * Used across engagement metric components and API endpoints
 */

export interface ActiveUserData {
  date: string;
  dau: number;
  mau: number;
  change: number; // % vs previous period
}

export interface RetentionData {
  cohort: string; // 'Week of Jan 1'
  week0: number; // Always 100%
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5: number;
  week6: number;
  week7: number;
  week8: number;
  week9: number;
  week10: number;
  week11: number;
  week12: number;
}

export interface ProgressBucket {
  course: string;
  notStarted: number;
  low: number; // 0-25%
  medium: number; // 26-50%
  high: number; // 51-75%
  veryHigh: number; // 76-99%
  completed: number; // 100%
}

export interface SessionDurationData {
  bucket: string;
  count: number;
  range: [number, number]; // minutes
}

export interface ActivityTimelineData {
  date: string;
  videoViews: number;
  chatMessages: number;
  courseProgress: number;
  total: number;
}

export interface StudentMetrics {
  videoCompletionRate: number; // 0-100
  chatInteractionFrequency: number; // messages per day
  loginFrequency: number; // logins per week
  courseProgressRate: number; // 0-100
}

export interface EngagementScore {
  total: number; // 0-100
  breakdown: {
    videoCompletion: number; // weighted 30%
    chatInteraction: number; // weighted 25%
    loginFrequency: number; // weighted 20%
    courseProgress: number; // weighted 25%
  };
}

export interface Activity {
  studentId: string;
  creatorId: string;
  type: 'video_view' | 'chat_message' | 'course_progress' | 'login';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

export interface CohortData {
  cohortId: string;
  cohortName: string;
  startDate: Date;
  initialSize: number;
  retentionByWeek: number[]; // Array of retention percentages
}

export interface EngagementMetricsResponse {
  activeUsers?: ActiveUserData[];
  retention?: RetentionData[];
  progressDistribution?: ProgressBucket[];
  sessionDurations?: SessionDurationData[];
  activityTimeline?: ActivityTimelineData[];
  engagementScore?: EngagementScore;
}

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all';

export type EngagementMetric =
  | 'active_users'
  | 'retention'
  | 'progress'
  | 'session_duration'
  | 'activity_timeline'
  | 'engagement_score';
