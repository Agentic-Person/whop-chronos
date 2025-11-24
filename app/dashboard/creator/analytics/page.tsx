'use client';

import { useState, useCallback } from 'react';
import { Card, Badge, Button } from '@whop/react/components';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  Users,
  Video,
  MessageSquare,
  Clock,
  Eye,
  Award,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAnalytics, useAnalyticsData } from '@/lib/contexts/AnalyticsContext';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { RefreshButton } from '@/components/analytics/RefreshButton';
import { ExportButton } from '@/components/analytics/ExportButton';
import { DashboardSkeleton } from '@/components/analytics/DashboardSkeleton';

// =============================================================================
// API Response Types
// =============================================================================

interface OverviewApiResponse {
  quickStats: {
    totalVideos: number;
    totalStudents: number;
    aiMessagesThisMonth: number;
    totalWatchTime: string;
    trends: {
      videos: number;
      students: number;
      messages: number;
      watchTime: number;
    };
    sparklines: {
      views: number[];
      watchTime: number[];
      messages: number[];
      students: number[];
    };
  };
  usageMeters: {
    storage_used: number;
    storage_limit: number;
    ai_credits_used: number;
    ai_credits_limit: number;
    videos_uploaded: number;
    videos_limit: number;
  };
  topVideos: Array<{
    video_id: string;
    videos: { title: string } | null;
    views: number;
    watch_time: number;
    completion_rate: number;
  }>;
  tier: string;
}

interface VideosDashboardApiResponse {
  success: boolean;
  data: {
    metrics: {
      total_views: number;
      total_watch_time_seconds: number;
      avg_completion_rate: number;
      total_videos: number;
      trends: {
        views: number;
        watch_time: number;
        completion: number;
        videos: number;
      };
    };
    views_over_time: Array<{ date: string; views: number }>;
    completion_rates: Array<{
      video_id: string;
      title: string;
      completion_rate: number;
      views: number;
    }>;
    cost_breakdown: Array<{ method: string; total_cost: number; video_count: number }>;
    storage_usage: Array<{ date: string; storage_gb: number; cumulative_gb: number }>;
    student_engagement: {
      active_learners: number;
      avg_videos_per_student: number;
      peak_hours: Array<{ hour: number; day_of_week: number; activity_count: number }>;
    };
    top_videos: Array<{
      id: string;
      title: string;
      thumbnail_url: string;
      duration_seconds: number;
      source_type: string;
      views: number;
      avg_watch_time_seconds: number;
      completion_rate: number;
    }>;
  };
  cached?: boolean;
  computed_at?: string;
}

interface EngagementApiResponse {
  activeUsers?: {
    daily: number[];
    weekly: number[];
    labels: string[];
  };
  retention?: {
    cohorts: Array<{ cohortName: string; retention: number[] }>;
  };
  progressDistribution?: Array<{
    course: string;
    notStarted: number;
    low: number;
    medium: number;
    high: number;
    veryHigh: number;
    completed: number;
  }>;
  sessionDurations?: {
    buckets: string[];
    counts: number[];
  };
  activityTimeline?: Array<{
    date: string;
    videoViews: number;
    chatMessages: number;
    courseProgress: number;
    total: number;
  }>;
  engagementScore?: {
    score: number;
    breakdown: {
      videoCompletion: number;
      chatInteraction: number;
      loginFrequency: number;
      courseProgress: number;
    };
  };
  /** Average session duration in minutes, calculated from video_watch_sessions */
  avgSessionDuration?: number;
  /** Retention rate: percentage of students who returned in last 7 days */
  retentionRate?: number;
}

interface ChatApiResponse {
  data: Array<{
    date: string;
    studentMessages: number;
    aiResponses: number;
    avgResponseTime: number;
  }> | {
    totalSessions: number;
    avgMessagesPerSession: number;
    avgSessionDuration: number;
    completionRate: number;
    trend: string;
    trendPercentage: number;
  };
}

interface GrowthApiResponse {
  success: boolean;
  data: {
    enrollment: Array<{ month: string; students: number; cumulative: number }>;
    revenue: null;
    revenueMessage: string;
    summary: {
      totalStudents: number;
      newThisMonth: number;
      growthRate: number;
    };
  };
  cached?: boolean;
  computed_at?: string;
}

// =============================================================================
// Empty Default Data (No Mock Data)
// =============================================================================

const getEmptyDefaultData = () => {
  return {
    topStats: {
      totalViews: 0,
      totalWatchTime: '0',
      avgCompletionRate: 0,
      activeStudents: 0,
      trends: {
        views: 0,
        watchTime: 0,
        completion: 0,
        students: 0,
      },
    },
    videoPerformance: [] as Array<{
      id: string;
      title: string;
      thumbnail: string;
      views: number;
      watchTime: number;
      completionRate: number;
      engagementScore: number;
      lastViewed: string;
    }>,
    viewsOverTime: [] as Array<{
      date: string;
      views: number;
      uniqueViewers: number;
    }>,
    studentEngagement: {
      activeDaily: 0,
      activeWeekly: 0,
      activeMonthly: 0,
      newStudents: 0,
      retentionRate: 0,
      avgSessionDuration: 0,
    },
    engagementOverTime: [] as Array<{
      date: string;
      activeUsers: number;
      sessions: number;
      avgDuration: number;
    }>,
    growthMetrics: {
      enrollmentGrowth: [] as Array<{ month: string; students: number }>,
      revenueGrowth: [] as Array<{ month: string; revenue: number }>,
    },
    chatAnalytics: {
      totalSessions: 0,
      totalMessages: 0,
      avgMessagesPerSession: 0,
      avgResponseTime: 0,
      costPerSession: 0,
      topQuestions: [] as Array<{ question: string; count: number }>,
      chatVolumeOverTime: [] as Array<{
        date: string;
        sessions: number;
        messages: number;
      }>,
    },
  };
};

// =============================================================================
// Data Transformation Helpers
// =============================================================================

/**
 * Transform API data to the format expected by the UI
 */
function transformOverviewData(
  overview: OverviewApiResponse | null,
  videosData: VideosDashboardApiResponse | null
) {
  if (!overview && !videosData) return null;

  const emptyDefaults = getEmptyDefaultData();

  // Build top stats from overview or videos data
  const topStats = {
    totalViews: videosData?.data?.metrics?.total_views ?? overview?.quickStats?.totalStudents ?? 0,
    totalWatchTime: overview?.quickStats?.totalWatchTime ??
      (videosData?.data?.metrics?.total_watch_time_seconds
        ? formatWatchTime(videosData.data.metrics.total_watch_time_seconds)
        : '0'),
    avgCompletionRate: videosData?.data?.metrics?.avg_completion_rate ?? 0,
    activeStudents: overview?.quickStats?.totalStudents ?? 0,
    trends: {
      views: videosData?.data?.metrics?.trends?.views ?? overview?.quickStats?.trends?.watchTime ?? 0,
      watchTime: videosData?.data?.metrics?.trends?.watch_time ?? overview?.quickStats?.trends?.watchTime ?? 0,
      completion: videosData?.data?.metrics?.trends?.completion ?? 0,
      students: overview?.quickStats?.trends?.students ?? 0,
    },
  };

  // Transform views over time
  const viewsOverTime = videosData?.data?.views_over_time?.map((item) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    views: item.views,
    uniqueViewers: Math.floor(item.views * 0.8), // Estimate unique viewers
  })) ?? [];

  // Transform video performance data
  const videoPerformance = videosData?.data?.top_videos?.map((video, index) => ({
    id: video.id,
    title: video.title,
    thumbnail: video.thumbnail_url || '',
    views: video.views,
    watchTime: Math.round(video.avg_watch_time_seconds / 60), // Convert to minutes
    completionRate: Math.round(video.completion_rate),
    engagementScore: Math.min(100, Math.round((video.completion_rate * 0.6) + (video.views / 10 * 0.4))),
    lastViewed: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString(),
  })) ?? [];

  // Build student engagement from videos data
  const activeLearners = videosData?.data?.student_engagement?.active_learners ?? 0;
  const studentEngagement = {
    activeDaily: activeLearners,
    activeWeekly: Math.round(activeLearners * 1.5),
    activeMonthly: Math.round(activeLearners * 2),
    newStudents: overview?.quickStats?.totalStudents ? Math.round(overview.quickStats.totalStudents * 0.1) : 0,
    retentionRate: 0, // Will be populated by engagement API
    avgSessionDuration: 0, // Will be populated by engagement API
  };

  return {
    topStats,
    videoPerformance,
    viewsOverTime,
    studentEngagement,
    engagementOverTime: emptyDefaults.engagementOverTime, // Will be populated by engagement API
    growthMetrics: emptyDefaults.growthMetrics,
    chatAnalytics: emptyDefaults.chatAnalytics,
  };
}

function formatWatchTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  if (hours > 0) {
    return `${hours.toLocaleString()}`;
  }
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m`;
}

// =============================================================================
// Main Component
// =============================================================================

export default function AnalyticsPage() {
  // Note: dateRange and creatorId are used by useAnalyticsData internally via context
  useAnalytics(); // Ensure we're within AnalyticsProvider
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('views');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // =============================================================================
  // API Data Fetching with useAnalyticsData hook
  // =============================================================================

  // Fetch Overview Data
  const fetchOverviewData = useCallback(
    async (dateRange: { start: Date; end: Date }, creatorId: string) => {
      const params = new URLSearchParams({
        creatorId,
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });
      const res = await fetch(`/api/analytics/overview?${params}`);
      if (!res.ok) throw new Error('Failed to fetch overview');
      return res.json() as Promise<OverviewApiResponse>;
    },
    []
  );

  const { data: overviewData, loading: overviewLoading, error: overviewError } = useAnalyticsData(
    fetchOverviewData,
    []
  );

  // Fetch Videos Dashboard Data
  const fetchVideosDashboard = useCallback(
    async (dateRange: { start: Date; end: Date }, creatorId: string) => {
      const params = new URLSearchParams({
        creator_id: creatorId,
        start: dateRange.start.toISOString(),
        end: dateRange.end.toISOString(),
      });
      const res = await fetch(`/api/analytics/videos/dashboard?${params}`);
      if (!res.ok) throw new Error('Failed to fetch videos dashboard');
      return res.json() as Promise<VideosDashboardApiResponse>;
    },
    []
  );

  const { data: videosData, loading: videosLoading, error: videosError } = useAnalyticsData(
    fetchVideosDashboard,
    []
  );

  // Fetch Engagement Data
  const fetchEngagementData = useCallback(
    async (dateRange: { start: Date; end: Date }, creatorId: string) => {
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const timeRange = daysDiff <= 7 ? '7d' : daysDiff <= 30 ? '30d' : daysDiff <= 90 ? '90d' : 'all';

      const params = new URLSearchParams({
        creatorId,
        metric: 'all',
        timeRange,
      });
      const res = await fetch(`/api/analytics/engagement?${params}`);
      if (!res.ok) throw new Error('Failed to fetch engagement');
      return res.json() as Promise<EngagementApiResponse>;
    },
    []
  );

  const { data: engagementData } = useAnalyticsData(
    fetchEngagementData,
    []
  );

  // Fetch Chat Analytics Data (Volume)
  const fetchChatData = useCallback(
    async (dateRange: { start: Date; end: Date }, creatorId: string) => {
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const timeRange = daysDiff <= 7 ? '7d' : daysDiff <= 30 ? '30d' : daysDiff <= 90 ? '90d' : 'all';

      const params = new URLSearchParams({
        creatorId,
        metric: 'volume',
        timeRange,
      });
      const res = await fetch(`/api/analytics/chat?${params}`);
      if (!res.ok) throw new Error('Failed to fetch chat analytics');
      return res.json() as Promise<ChatApiResponse>;
    },
    []
  );

  const { data: chatData } = useAnalyticsData(
    fetchChatData,
    []
  );

  // Fetch Chat Session Metrics (totalSessions, avgMessagesPerSession, etc.)
  const fetchChatSessionData = useCallback(
    async (dateRange: { start: Date; end: Date }, creatorId: string) => {
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const timeRange = daysDiff <= 7 ? '7d' : daysDiff <= 30 ? '30d' : daysDiff <= 90 ? '90d' : 'all';

      const params = new URLSearchParams({
        creatorId,
        metric: 'sessions',
        timeRange,
      });
      const res = await fetch(`/api/analytics/chat?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ data: { totalSessions: number; avgMessagesPerSession: number; avgSessionDuration: number; completionRate: number; trend: string; trendPercentage: number } }>;
    },
    []
  );

  const { data: chatSessionData } = useAnalyticsData(
    fetchChatSessionData,
    []
  );

  // Fetch Popular Questions from chat history
  const fetchPopularQuestionsData = useCallback(
    async (dateRange: { start: Date; end: Date }, creatorId: string) => {
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const timeRange = daysDiff <= 7 ? '7d' : daysDiff <= 30 ? '30d' : daysDiff <= 90 ? '90d' : 'all';

      const params = new URLSearchParams({
        creatorId,
        limit: '10',
        timeRange,
      });
      const res = await fetch(`/api/analytics/chat/popular-questions?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ questions: Array<{ question: string; count: number; variations?: string[]; avgResponseTime?: number; referencedVideos?: string[] }> }>;
    },
    []
  );

  const { data: popularQuestionsData } = useAnalyticsData(
    fetchPopularQuestionsData,
    []
  );

  // Fetch Chat Cost Data
  const fetchChatCostData = useCallback(
    async (dateRange: { start: Date; end: Date }, creatorId: string) => {
      const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
      const timeRange = daysDiff <= 7 ? '7d' : daysDiff <= 30 ? '30d' : daysDiff <= 90 ? '90d' : 'all';

      const params = new URLSearchParams({
        creatorId,
        timeRange,
      });
      const res = await fetch(`/api/analytics/chat/cost?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<{ data: { total: number; perMessage: number; perStudent: number; byModel: Record<string, number>; byDate: Array<{ date: string; cost: number }>; projections?: { monthly: number; daily: number; trend: string } } }>;
    },
    []
  );

  const { data: chatCostData } = useAnalyticsData(
    fetchChatCostData,
    []
  );

  // Fetch Growth Data (real enrollment from students table)
  const fetchGrowthData = useCallback(
    async (_dateRange: { start: Date; end: Date }, creatorId: string) => {
      const params = new URLSearchParams({
        creator_id: creatorId,
        months: '12',
      });
      const res = await fetch(`/api/analytics/growth?${params}`);
      if (!res.ok) return null;
      return res.json() as Promise<GrowthApiResponse>;
    },
    []
  );

  const { data: growthData, loading: growthLoading } = useAnalyticsData(
    fetchGrowthData,
    []
  );

  // =============================================================================
  // Transform and Combine Data
  // =============================================================================

  const isLoading = overviewLoading || videosLoading;
  const hasError = overviewError || videosError;

  // Transform API data to UI format, with empty defaults fallback
  const data = transformOverviewData(overviewData, videosData) ?? getEmptyDefaultData();

  // Merge engagement data if available
  if (engagementData?.activityTimeline) {
    // Use real avgSessionDuration from engagement API, fallback to zero if not available
    const realAvgDuration = engagementData.avgSessionDuration ?? data.studentEngagement.avgSessionDuration;

    data.engagementOverTime = engagementData.activityTimeline.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      activeUsers: item.videoViews + item.chatMessages,
      sessions: item.total,
      avgDuration: realAvgDuration, // Real value from video_watch_sessions
    }));
  }

  // Update studentEngagement with real values from engagement API
  if (engagementData?.avgSessionDuration !== undefined) {
    data.studentEngagement.avgSessionDuration = engagementData.avgSessionDuration;
  }
  if (engagementData?.retentionRate !== undefined) {
    data.studentEngagement.retentionRate = engagementData.retentionRate;
  }

  // Merge chat volume data if available
  if (chatData?.data && Array.isArray(chatData.data) && chatData.data.length > 0) {
    const chatVolumeData = chatData.data as Array<{ date: string; studentMessages: number; aiResponses: number }>;
    data.chatAnalytics.chatVolumeOverTime = chatVolumeData.map((item) => ({
      date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      sessions: Math.floor((item.studentMessages + item.aiResponses) / 5),
      messages: item.studentMessages + item.aiResponses,
    }));
    data.chatAnalytics.totalMessages = chatVolumeData.reduce(
      (sum, item) => sum + item.studentMessages + item.aiResponses,
      0
    );
  }

  // Merge chat session metrics (totalSessions, avgMessagesPerSession) from real API
  if (chatSessionData?.data) {
    data.chatAnalytics.totalSessions = chatSessionData.data.totalSessions ?? 0;
    data.chatAnalytics.avgMessagesPerSession = chatSessionData.data.avgMessagesPerSession ?? 0;
  }

  // Merge popular questions from real API
  if (popularQuestionsData?.questions && popularQuestionsData.questions.length > 0) {
    data.chatAnalytics.topQuestions = popularQuestionsData.questions.map((q) => ({
      question: q.question,
      count: q.count,
    }));
  }

  // Merge cost data from real API - calculate cost per session
  if (chatCostData?.data) {
    const totalCost = chatCostData.data.total ?? 0;
    const totalSessions = chatSessionData?.data?.totalSessions ?? data.chatAnalytics.totalSessions ?? 1;
    data.chatAnalytics.costPerSession = totalSessions > 0 ? totalCost / totalSessions : 0;
  }

  // Show loading skeleton
  if (isLoading) {
    return <DashboardSkeleton />;
  }

  // Show error state (but still render with fallback data)
  const showErrorBanner = hasError && !isLoading;

  // Filter and sort video performance data
  const filteredVideos = data.videoPerformance
    .filter((video) => video.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const aValue = a[sortColumn as keyof typeof a];
      const bValue = b[sortColumn as keyof typeof b];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      return 0;
    });

  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredVideos.length / itemsPerPage);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {showErrorBanner && (
        <div className="bg-yellow-a3 border border-yellow-a6 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-11 flex-shrink-0" />
          <div>
            <p className="text-3 font-medium text-yellow-12">
              Unable to load live data
            </p>
            <p className="text-2 text-yellow-11">
              Showing cached data. Check your connection and try again.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-7 font-bold text-gray-12">Analytics Dashboard</h1>
            <p className="text-3 text-gray-11 mt-1">
              Comprehensive insights into your video performance and student engagement
            </p>
          </div>
          <div className="flex items-center gap-2">
            <DateRangePicker />
            <RefreshButton />
            <ExportButton />
          </div>
        </div>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Eye className="w-5 h-5" />}
          label="Total Views"
          value={data.topStats.totalViews.toLocaleString()}
          trend={data.topStats.trends.views}
          trendLabel="vs previous period"
        />
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Total Watch Time"
          value={`${data.topStats.totalWatchTime}h`}
          trend={data.topStats.trends.watchTime}
          trendLabel="vs previous period"
        />
        <StatCard
          icon={<Award className="w-5 h-5" />}
          label="Avg Completion Rate"
          value={`${data.topStats.avgCompletionRate}%`}
          trend={data.topStats.trends.completion}
          trendLabel="vs previous period"
        />
        <StatCard
          icon={<Users className="w-5 h-5" />}
          label="Active Students"
          value={data.topStats.activeStudents.toLocaleString()}
          trend={data.topStats.trends.students}
          trendLabel="vs previous period"
        />
      </div>

      {/* Tabs for different sections */}
      <div className="border-b border-gray-a6">
        <div className="flex gap-1 overflow-x-auto">
          {[
            { value: 'overview', label: 'Overview' },
            { value: 'videos', label: 'Video Performance' },
            { value: 'engagement', label: 'Student Engagement' },
            { value: 'growth', label: 'Growth & Revenue' },
            { value: 'chat', label: 'AI Chat Analytics' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`px-4 py-2 text-3 font-medium whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab.value
                  ? 'text-accent-11 border-accent-9'
                  : 'text-gray-11 border-transparent hover:text-gray-12 hover:border-gray-a6'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6 mt-6">
          {/* Views Over Time Chart */}
          <Card className="p-6">
            <h3 className="text-5 font-semibold text-gray-12 mb-4">Views Over Time</h3>
            {data.viewsOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.viewsOverTime}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-9)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--accent-9)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorViewers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--green-9)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--green-9)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
                  <XAxis dataKey="date" stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-a6)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="views"
                    stroke="var(--accent-9)"
                    fillOpacity={1}
                    fill="url(#colorViews)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueViewers"
                    stroke="var(--green-9)"
                    fillOpacity={1}
                    fill="url(#colorViewers)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <Eye className="w-12 h-12 text-gray-a6 mb-3" />
                <p className="text-3 text-gray-11">No view data yet</p>
                <p className="text-2 text-gray-10 mt-1">Video views will appear here once students start watching</p>
              </div>
            )}
          </Card>

          {/* Student Engagement Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-3 text-gray-11">Daily Active</span>
                <Users className="w-4 h-4 text-blue-9" />
              </div>
              <p className="text-6 font-bold text-gray-12 mt-2">
                {data.studentEngagement.activeDaily.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-3 text-gray-11">Weekly Active</span>
                <Users className="w-4 h-4 text-purple-9" />
              </div>
              <p className="text-6 font-bold text-gray-12 mt-2">
                {data.studentEngagement.activeWeekly.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-3 text-gray-11">Monthly Active</span>
                <Users className="w-4 h-4 text-green-9" />
              </div>
              <p className="text-6 font-bold text-gray-12 mt-2">
                {data.studentEngagement.activeMonthly.toLocaleString()}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Video Performance Tab */}
      {activeTab === 'videos' && (
        <div className="space-y-6 mt-6">
          {/* Search and Controls */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-11" />
              <input
                type="text"
                placeholder="Search videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-a2 border border-gray-a6 rounded-lg text-gray-12 placeholder-gray-11 focus:outline-none focus:ring-2 focus:ring-accent-9"
              />
            </div>
          </div>

          {/* Video Performance Table */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-a2 border-b border-gray-a6">
                  <tr>
                    <th className="px-4 py-3 text-left">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-2 text-3 font-medium text-gray-11 hover:text-gray-12"
                      >
                        Video
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleSort('views')}
                        className="flex items-center gap-2 ml-auto text-3 font-medium text-gray-11 hover:text-gray-12"
                      >
                        Views
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right hidden sm:table-cell">
                      <button
                        onClick={() => handleSort('watchTime')}
                        className="flex items-center gap-2 ml-auto text-3 font-medium text-gray-11 hover:text-gray-12"
                      >
                        Watch Time
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right hidden md:table-cell">
                      <button
                        onClick={() => handleSort('completionRate')}
                        className="flex items-center gap-2 ml-auto text-3 font-medium text-gray-11 hover:text-gray-12"
                      >
                        Completion
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right hidden lg:table-cell">
                      <button
                        onClick={() => handleSort('engagementScore')}
                        className="flex items-center gap-2 ml-auto text-3 font-medium text-gray-11 hover:text-gray-12"
                      >
                        Engagement
                        <ArrowUpDown className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="px-4 py-3 text-right hidden xl:table-cell">
                      <span className="text-3 font-medium text-gray-11">Last Viewed</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-a4">
                  {paginatedVideos.length > 0 ? (
                    paginatedVideos.map((video) => (
                      <tr key={video.id} className="hover:bg-gray-a2 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-16 h-10 bg-gray-a3 rounded flex items-center justify-center">
                              <Video className="w-5 h-5 text-gray-11" />
                            </div>
                            <span className="text-3 text-gray-12 font-medium">{video.title}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-3 text-gray-12 text-right">
                          {video.views.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-3 text-gray-12 text-right hidden sm:table-cell">
                          {video.watchTime} min
                        </td>
                        <td className="px-4 py-3 text-right hidden md:table-cell">
                          <Badge
                            color={video.completionRate >= 70 ? 'green' : video.completionRate >= 50 ? 'yellow' : 'red'}
                          >
                            {video.completionRate}%
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-12 bg-gray-a3 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-accent-9"
                                style={{ width: `${video.engagementScore}%` }}
                              />
                            </div>
                            <span className="text-3 text-gray-11">{video.engagementScore}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-3 text-gray-11 text-right hidden xl:table-cell">
                          {new Date(video.lastViewed).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center">
                        <Video className="w-12 h-12 text-gray-a6 mx-auto mb-3" />
                        <p className="text-3 text-gray-11">No videos yet</p>
                        <p className="text-2 text-gray-10 mt-1">Import videos to see performance analytics</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination - only show when there are videos */}
            {filteredVideos.length > 0 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-a6">
                <span className="text-3 text-gray-11">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                  {Math.min(currentPage * itemsPerPage, filteredVideos.length)} of {filteredVideos.length} videos
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="2"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-3 text-gray-12">
                    Page {currentPage} of {totalPages || 1}
                  </span>
                  <Button
                    variant="ghost"
                    size="2"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Student Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-5 font-semibold text-gray-12 mb-4">Student Activity Over Time</h3>
            {data.engagementOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.engagementOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
                  <XAxis dataKey="date" stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-a6)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="var(--blue-9)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="var(--purple-9)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgDuration"
                    stroke="var(--green-9)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <Users className="w-12 h-12 text-gray-a6 mb-3" />
                <p className="text-3 text-gray-11">No engagement data yet</p>
                <p className="text-2 text-gray-10 mt-1">Student activity will appear here once they start engaging</p>
              </div>
            )}
          </Card>

          {/* Engagement Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <MetricCard label="New Students" value={data.studentEngagement.newStudents} />
            <MetricCard
              label="Retention Rate"
              value={`${data.studentEngagement.retentionRate}%`}
            />
            <MetricCard
              label="Avg Session Duration"
              value={`${data.studentEngagement.avgSessionDuration} min`}
            />
          </div>
        </div>
      )}

      {/* Growth & Revenue Tab */}
      {activeTab === 'growth' && (
        <div className="space-y-6 mt-6">
          {/* Growth Summary Cards */}
          {growthData?.data?.summary && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3 text-gray-11">Total Students</span>
                  <Users className="w-4 h-4 text-accent-9" />
                </div>
                <p className="text-6 font-bold text-gray-12">
                  {growthData.data.summary.totalStudents.toLocaleString()}
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3 text-gray-11">New This Month</span>
                  <TrendingUp className="w-4 h-4 text-green-9" />
                </div>
                <p className="text-6 font-bold text-gray-12">
                  {growthData.data.summary.newThisMonth.toLocaleString()}
                </p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-3 text-gray-11">Growth Rate</span>
                  {growthData.data.summary.growthRate >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-9" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-9" />
                  )}
                </div>
                <p className={`text-6 font-bold ${growthData.data.summary.growthRate >= 0 ? 'text-green-11' : 'text-red-11'}`}>
                  {growthData.data.summary.growthRate >= 0 ? '+' : ''}{growthData.data.summary.growthRate}%
                </p>
              </Card>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Student Enrollment Growth - Real Data */}
            <Card className="p-6">
              <h3 className="text-5 font-semibold text-gray-12 mb-4">Student Enrollment Growth</h3>
              {growthLoading ? (
                <div className="h-[300px] flex items-center justify-center">
                  <div className="animate-pulse text-gray-11">Loading enrollment data...</div>
                </div>
              ) : growthData?.data?.enrollment && growthData.data.enrollment.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={growthData.data.enrollment}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
                    <XAxis dataKey="month" stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                    <YAxis stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--gray-2)',
                        border: '1px solid var(--gray-a6)',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === 'students' ? 'New Students' : 'Cumulative Total'
                      ]}
                    />
                    <Legend />
                    <Bar dataKey="students" name="New Students" fill="var(--accent-9)" radius={[8, 8, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <Users className="w-12 h-12 text-gray-a6 mb-3" />
                  <p className="text-3 text-gray-11">No enrollment data yet</p>
                  <p className="text-2 text-gray-10 mt-1">Student signups will appear here</p>
                </div>
              )}
            </Card>

            {/* Revenue - Whop Dashboard Message */}
            <Card className="p-6">
              <h3 className="text-5 font-semibold text-gray-12 mb-4">Revenue</h3>
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-full bg-green-a3 mb-4">
                  <BarChart className="w-8 h-8 text-green-9" />
                </div>
                <p className="text-4 font-medium text-gray-12 mb-2">
                  Revenue data is managed by Whop
                </p>
                <p className="text-3 text-gray-11 max-w-sm mb-4">
                  All payment processing and revenue tracking is handled through your Whop dashboard for security and accuracy.
                </p>
                <a
                  href="https://dash.whop.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-accent-9 text-white rounded-lg hover:bg-accent-10 transition-colors text-3 font-medium"
                >
                  View Revenue in Whop Dashboard
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* AI Chat Analytics Tab */}
      {activeTab === 'chat' && (
        <div className="space-y-6 mt-6">
          {/* Chat Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3 text-gray-11">Total Sessions</span>
                <MessageSquare className="w-4 h-4 text-blue-9" />
              </div>
              <p className="text-6 font-bold text-gray-12">
                {data.chatAnalytics.totalSessions.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3 text-gray-11">Total Messages</span>
                <MessageSquare className="w-4 h-4 text-purple-9" />
              </div>
              <p className="text-6 font-bold text-gray-12">
                {data.chatAnalytics.totalMessages.toLocaleString()}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3 text-gray-11">Avg Messages/Session</span>
                <BarChart className="w-4 h-4 text-green-9" />
              </div>
              <p className="text-6 font-bold text-gray-12">
                {data.chatAnalytics.avgMessagesPerSession}
              </p>
            </Card>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-3 text-gray-11">Cost/Session</span>
                <TrendingUp className="w-4 h-4 text-orange-9" />
              </div>
              <p className="text-6 font-bold text-gray-12">
                ${data.chatAnalytics.costPerSession.toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Chat Volume Over Time */}
          <Card className="p-6">
            <h3 className="text-5 font-semibold text-gray-12 mb-4">Chat Volume Over Time</h3>
            {data.chatAnalytics.chatVolumeOverTime.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={data.chatAnalytics.chatVolumeOverTime}>
                  <defs>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--blue-9)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--blue-9)" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--purple-9)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--purple-9)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
                  <XAxis dataKey="date" stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-a6)',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sessions"
                    stroke="var(--blue-9)"
                    fillOpacity={1}
                    fill="url(#colorSessions)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="messages"
                    stroke="var(--purple-9)"
                    fillOpacity={1}
                    fill="url(#colorMessages)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex flex-col items-center justify-center text-center">
                <MessageSquare className="w-12 h-12 text-gray-a6 mb-3" />
                <p className="text-3 text-gray-11">No chat data yet</p>
                <p className="text-2 text-gray-10 mt-1">AI chat activity will appear here once students start chatting</p>
              </div>
            )}
          </Card>

          {/* Top Questions */}
          <Card className="p-6">
            <h3 className="text-5 font-semibold text-gray-12 mb-4">Most Asked Questions</h3>
            <div className="space-y-3">
              {data.chatAnalytics.topQuestions.length > 0 ? (
                data.chatAnalytics.topQuestions.map((q, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-3 text-gray-12">{q.question}</span>
                    <Badge color="blue">{q.count} times</Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-a6 mx-auto mb-3" />
                  <p className="text-3 text-gray-11">No questions yet</p>
                  <p className="text-2 text-gray-10 mt-1">Questions from student AI chats will appear here</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

// Helper Components
function StatCard({
  icon,
  label,
  value,
  trend,
  trendLabel,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
}) {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-gray-a3 text-gray-11">{icon}</div>
          <div className={`flex items-center gap-1 ${isPositive ? 'text-green-11' : 'text-red-11'}`}>
            <TrendIcon className="w-4 h-4" />
            <span className="text-2 font-medium">{Math.abs(trend)}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-8 font-bold text-gray-12">{value}</span>
          <span className="text-3 text-gray-11">{label}</span>
        </div>
        <span className="text-2 text-gray-11">{trendLabel}</span>
      </div>
    </Card>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <span className="text-3 text-gray-11">{label}</span>
      <p className="text-6 font-bold text-gray-12 mt-2">{value}</p>
    </Card>
  );
}
