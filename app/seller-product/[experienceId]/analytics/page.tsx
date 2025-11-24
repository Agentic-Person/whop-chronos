/**
 * Seller Analytics Page - Whop Embedded App
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, Heading, Text } from 'frosted-ui';
import { BarChart3, Users, Video, MessageSquare, TrendingUp, Clock, Loader2 } from 'lucide-react';

interface AnalyticsData {
  totalVideos: number;
  totalViews: number;
  totalWatchTime: number;
  totalStudents: number;
  totalChatMessages: number;
  avgCompletionRate: number;
}

export default function SellerAnalyticsPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get creator data from the hidden script tag
    const dataScript = document.getElementById('__SELLER_DATA__');
    if (dataScript) {
      try {
        const data = JSON.parse(dataScript.textContent || '{}');
        if (data.creatorId) {
          fetchAnalytics(data.creatorId);
        }
      } catch (e) {
        console.error('Failed to parse seller data:', e);
        setLoading(false);
      }
    } else {
      // Use mock data for now
      setAnalytics({
        totalVideos: 0,
        totalViews: 0,
        totalWatchTime: 0,
        totalStudents: 0,
        totalChatMessages: 0,
        avgCompletionRate: 0,
      });
      setLoading(false);
    }
  }, []);

  const fetchAnalytics = async (creatorId: string) => {
    try {
      const response = await fetch(`/api/analytics/overview?creator_id=${creatorId}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Fallback to defaults
        setAnalytics({
          totalVideos: 0,
          totalViews: 0,
          totalWatchTime: 0,
          totalStudents: 0,
          totalChatMessages: 0,
          avgCompletionRate: 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setAnalytics({
        totalVideos: 0,
        totalViews: 0,
        totalWatchTime: 0,
        totalStudents: 0,
        totalChatMessages: 0,
        avgCompletionRate: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatWatchTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-gray-11" />
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Videos',
      value: analytics?.totalVideos || 0,
      icon: Video,
      color: 'purple',
    },
    {
      label: 'Total Views',
      value: analytics?.totalViews || 0,
      icon: BarChart3,
      color: 'blue',
    },
    {
      label: 'Watch Time',
      value: formatWatchTime(analytics?.totalWatchTime || 0),
      icon: Clock,
      color: 'green',
    },
    {
      label: 'Students',
      value: analytics?.totalStudents || 0,
      icon: Users,
      color: 'orange',
    },
    {
      label: 'Chat Messages',
      value: analytics?.totalChatMessages || 0,
      icon: MessageSquare,
      color: 'pink',
    },
    {
      label: 'Avg Completion',
      value: `${analytics?.avgCompletionRate || 0}%`,
      icon: TrendingUp,
      color: 'cyan',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Heading size="7" className="mb-2">Analytics</Heading>
        <Text size="3" className="text-gray-11">
          Track your content performance and student engagement
        </Text>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} size="2">
            <div className="flex items-start gap-3">
              <div className={`p-2 bg-${stat.color}-a3 rounded-lg`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-11`} />
              </div>
              <div>
                <Text size="2" className="text-gray-11">{stat.label}</Text>
                <Heading size="5">{stat.value}</Heading>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Placeholder for charts */}
      <Card size="3">
        <Heading size="5" className="mb-4">Performance Overview</Heading>
        <div className="h-64 bg-gray-a2 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-11 mx-auto mb-2" />
            <Text size="3" className="text-gray-11">
              Detailed analytics charts coming soon
            </Text>
          </div>
        </div>
      </Card>
    </div>
  );
}
