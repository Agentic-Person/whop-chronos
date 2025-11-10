/**
 * Analytics Charts Components
 *
 * Recharts-based interactive visualization components for Chronos creator dashboard
 *
 * @module components/analytics
 */

// Main chart components
export { VideoPerformanceChart } from './VideoPerformanceChart';
export { WatchTimeChart } from './WatchTimeChart';
export { CompletionRateChart } from './CompletionRateChart';
export { EngagementHeatmap } from './EngagementHeatmap';
export { VideoComparisonChart } from './VideoComparisonChart';

// Chat Analytics Components (Agent 4)
export { ChatVolumeChart } from './ChatVolumeChart';
export { PopularQuestionsTable } from './PopularQuestionsTable';
export { ResponseQualityChart } from './ResponseQualityChart';
export { VideoReferenceHeatmap } from './VideoReferenceHeatmap';
export { StudentChatActivity } from './StudentChatActivity';
export { ChatCostTracker } from './ChatCostTracker';
export { SessionInsightsCard } from './SessionInsightsCard';

// Trend indicators
export {
  TrendIndicator,
  CompactTrendIndicator,
  TrendCard,
  metricFormatters
} from './TrendIndicator';

// Dashboard Layout Components (Agent 5)
export { AnalyticsDashboardGrid, DashboardSection, DashboardCard } from './AnalyticsDashboardGrid';
export { DashboardHeader } from './DashboardHeader';
export { DashboardSkeleton, CardSkeleton, ChartSkeleton, StatCardSkeleton } from './DashboardSkeleton';

// Analytics Controls (Agent 5)
export { DateRangePicker } from './DateRangePicker';
export { RefreshButton } from './RefreshButton';
export { ExportButton } from './ExportButton';

// Stats & Metrics (Agent 5)
export { QuickStatsCards } from './QuickStatsCards';

// Empty States (Agent 5)
export { AnalyticsEmptyState, EmptyStateWrapper } from './AnalyticsEmptyState';

// Engagement Metric Components (Agent 2)
export { default as ActiveUsersChart } from './ActiveUsersChart';
export { default as StudentRetentionChart } from './StudentRetentionChart';
export { default as CourseProgressDistribution } from './CourseProgressDistribution';
export { default as SessionDurationChart } from './SessionDurationChart';
export { default as StudentActivityTimeline } from './StudentActivityTimeline';
export { default as EngagementScoreCard } from './EngagementScoreCard';

// Type definitions
export type {
  TimeRange,
  MetricType,
  CompletionSegment,
  VideoPerformanceData,
  WatchTimeData,
  CompletionRateData,
  EngagementHeatmapData,
  VideoComparisonData,
  TrendData,
  ChartProps,
  LoadingState,
} from './types';

// Chat Analytics Types (Agent 4)
export type {
  ChatVolumeData,
  QuestionCluster,
  QualityMetrics,
  CostBreakdown,
  VideoReferenceData,
  StudentChatActivityData,
  SessionMetrics,
  ChatMessage,
  Session,
  SortBy,
} from './chat-types';

// Engagement Analytics Types (Agent 2)
export type {
  ActiveUserData,
  RetentionData,
  ProgressBucket,
  SessionDurationData,
  ActivityTimelineData,
  StudentMetrics,
  EngagementScore,
  Activity,
  CohortData,
  EngagementMetricsResponse,
  EngagementMetric,
} from './engagement-types';

// Data Export & Reports Components (Agent 6)
export { ReportTemplateSelector } from './ReportTemplateSelector';
export { ScheduledReportsManager } from './ScheduledReportsManager';
export { ReportHistoryList } from './ReportHistoryList';

// Usage & Tier Limits (Agent 3)
export { UsageMeter } from './UsageMeter';
export { UsageMetersGrid } from './UsageMetersGrid';
export { StorageBreakdownChart } from './StorageBreakdownChart';
export { AICreditsUsageChart } from './AICreditsUsageChart';
export { TierComparisonTable } from './TierComparisonTable';
export { UsageAlerts } from './UsageAlerts';
export { UpgradeSuggestion } from './UpgradeSuggestion';
export type {
  SubscriptionTier,
  TierLimits,
  UsageStat,
  UsageStats,
  StorageBreakdown,
  QuotaCheckResult,
  UsageWarningLevel,
} from './usage-types';
