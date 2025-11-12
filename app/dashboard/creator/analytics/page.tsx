'use client';

import { useEffect, useState } from 'react';
import { Card, Badge, Button } from '@whop/react/components';
import {
  BarChart,
  TrendingUp,
  TrendingDown,
  Users,
  Video,
  MessageSquare,
  Clock,
  Play,
  Eye,
  Award,
  Download,
  Search,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart as RechartsBarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import { DateRangePicker } from '@/components/analytics/DateRangePicker';
import { RefreshButton } from '@/components/analytics/RefreshButton';
import { ExportButton } from '@/components/analytics/ExportButton';
import { DashboardSkeleton } from '@/components/analytics/DashboardSkeleton';

// Mock data for demonstration (would be fetched from API in production)
const generateMockData = () => {
  return {
    topStats: {
      totalViews: 45234,
      totalWatchTime: '2,341', // hours
      avgCompletionRate: 68.5,
      activeStudents: 1847,
      trends: {
        views: 12.3,
        watchTime: 8.7,
        completion: 4.2,
        students: 15.8,
      },
    },
    videoPerformance: Array.from({ length: 12 }, (_, i) => ({
      id: `video-${i}`,
      title: `Video ${i + 1}: Introduction to Advanced Concepts`,
      thumbnail: '',
      views: Math.floor(Math.random() * 5000) + 1000,
      watchTime: Math.floor(Math.random() * 300) + 50, // minutes
      completionRate: Math.floor(Math.random() * 40) + 60,
      engagementScore: Math.floor(Math.random() * 40) + 60,
      lastViewed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
    })),
    viewsOverTime: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      views: Math.floor(Math.random() * 1000) + 500,
      uniqueViewers: Math.floor(Math.random() * 800) + 400,
    })),
    studentEngagement: {
      activeDaily: 423,
      activeWeekly: 1247,
      activeMonthly: 1847,
      newStudents: 156,
      retentionRate: 87.3,
      avgSessionDuration: 24, // minutes
    },
    engagementOverTime: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      }),
      activeUsers: Math.floor(Math.random() * 500) + 300,
      sessions: Math.floor(Math.random() * 800) + 500,
      avgDuration: Math.floor(Math.random() * 15) + 15,
    })),
    growthMetrics: {
      enrollmentGrowth: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
          'en-US',
          { month: 'short' }
        ),
        students: Math.floor(Math.random() * 200) + 100,
      })),
      revenueGrowth: Array.from({ length: 12 }, (_, i) => ({
        month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(
          'en-US',
          { month: 'short' }
        ),
        revenue: Math.floor(Math.random() * 5000) + 2000,
      })),
    },
    chatAnalytics: {
      totalSessions: 8934,
      totalMessages: 45678,
      avgMessagesPerSession: 5.1,
      avgResponseTime: 2.3, // seconds
      costPerSession: 0.05,
      topQuestions: [
        { question: 'How do I implement authentication?', count: 234 },
        { question: 'What is the difference between X and Y?', count: 189 },
        { question: 'Can you explain the video at 12:30?', count: 156 },
        { question: 'How do I optimize performance?', count: 143 },
        { question: 'What are best practices for deployment?', count: 127 },
      ],
      chatVolumeOverTime: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
        sessions: Math.floor(Math.random() * 300) + 200,
        messages: Math.floor(Math.random() * 1500) + 1000,
      })),
    },
  };
};

export default function AnalyticsPage() {
  const { dateRange, creatorId } = useAnalytics();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ReturnType<typeof generateMockData> | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('views');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    // Simulate data fetching
    setLoading(true);
    setTimeout(() => {
      setData(generateMockData());
      setLoading(false);
    }, 1000);
  }, [dateRange, creatorId]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-11">No data available</p>
      </div>
    );
  }

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
                  {paginatedVideos.map((video) => (
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
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
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
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="2"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Student Engagement Tab */}
      {activeTab === 'engagement' && (
        <div className="space-y-6 mt-6">
          <Card className="p-6">
            <h3 className="text-5 font-semibold text-gray-12 mb-4">Student Activity Over Time</h3>
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-5 font-semibold text-gray-12 mb-4">Student Enrollment Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsBarChart data={data.growthMetrics.enrollmentGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
                  <XAxis dataKey="month" stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-a6)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="students" fill="var(--accent-9)" radius={[8, 8, 0, 0]} />
                </RechartsBarChart>
              </ResponsiveContainer>
            </Card>

            <Card className="p-6">
              <h3 className="text-5 font-semibold text-gray-12 mb-4">Revenue Growth</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.growthMetrics.revenueGrowth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--gray-a6)" />
                  <XAxis dataKey="month" stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <YAxis stroke="var(--gray-11)" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--gray-2)',
                      border: '1px solid var(--gray-a6)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="var(--green-9)"
                    strokeWidth={3}
                    dot={{ r: 4, fill: 'var(--green-9)' }}
                  />
                </LineChart>
              </ResponsiveContainer>
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
          </Card>

          {/* Top Questions */}
          <Card className="p-6">
            <h3 className="text-5 font-semibold text-gray-12 mb-4">Most Asked Questions</h3>
            <div className="space-y-3">
              {data.chatAnalytics.topQuestions.map((q, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-3 text-gray-12">{q.question}</span>
                  <Badge color="blue">{q.count} times</Badge>
                </div>
              ))}
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
