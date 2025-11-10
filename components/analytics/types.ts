/**
 * Shared TypeScript types for analytics chart components
 */

export type TimeRange = '7d' | '30d' | '90d' | 'all';

export type MetricType = 'views' | 'watchTime' | 'completionRate';

export type CompletionSegment = 'Completed' | 'High' | 'Medium' | 'Low';

export interface VideoPerformanceData {
  date: string; // ISO format (YYYY-MM-DD)
  views: number;
  watchTime: number; // in seconds
  uniqueViewers: number;
}

export interface WatchTimeData {
  videoId: string;
  videoTitle: string;
  watchTime: number; // in seconds
  thumbnailUrl?: string;
}

export interface CompletionRateData {
  segment: CompletionSegment;
  count: number;
  percentage: number;
  color: string;
}

export interface EngagementHeatmapData {
  hour: number; // 0-23
  day: string; // 'Mon', 'Tue', etc.
  value: number; // engagement metric value
}

export interface VideoComparisonData {
  date: string; // ISO format (YYYY-MM-DD)
  [videoId: string]: string | number; // dynamic keys for each video
}

export interface TrendData {
  currentValue: number;
  previousValue: number;
  metric: string;
  period?: string; // e.g., "vs last week"
}

export interface ChartProps {
  className?: string;
  height?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}
