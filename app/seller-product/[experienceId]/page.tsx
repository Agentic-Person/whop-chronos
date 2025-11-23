/**
 * Seller Product Page - Whop Embedded App
 *
 * This is the main page shown to sellers/creators when they access the app from Whop.
 * Authentication is handled by the layout.
 *
 * Route: /seller-product/[experienceId]
 */

'use client';

import { useParams } from 'next/navigation';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import { OverviewMetrics } from '@/components/analytics/OverviewMetrics';
import { RecentVideos } from '@/components/analytics/RecentVideos';
import { QuickActions } from '@/components/analytics/QuickActions';

export default function SellerProductPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;
  const { creatorId } = useAnalytics();

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-12 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-11">
          Welcome back! Here's how your content is performing.
        </p>
      </div>

      {/* Quick Actions */}
      <QuickActions basePath={`/seller-product/${experienceId}`} />

      {/* Overview Metrics */}
      <OverviewMetrics />

      {/* Recent Videos */}
      <RecentVideos />

      {/* Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href={`/seller-product/${experienceId}/videos`}
          className="p-6 bg-gray-2 border border-gray-a4 rounded-lg hover:border-gray-a6 transition-colors"
        >
          <h3 className="font-semibold text-gray-12 mb-2">Videos</h3>
          <p className="text-sm text-gray-11">Manage your video library</p>
        </a>
        <a
          href={`/seller-product/${experienceId}/courses`}
          className="p-6 bg-gray-2 border border-gray-a4 rounded-lg hover:border-gray-a6 transition-colors"
        >
          <h3 className="font-semibold text-gray-12 mb-2">Courses</h3>
          <p className="text-sm text-gray-11">Build and organize courses</p>
        </a>
        <a
          href={`/seller-product/${experienceId}/analytics`}
          className="p-6 bg-gray-2 border border-gray-a4 rounded-lg hover:border-gray-a6 transition-colors"
        >
          <h3 className="font-semibold text-gray-12 mb-2">Analytics</h3>
          <p className="text-sm text-gray-11">View detailed analytics</p>
        </a>
      </div>
    </div>
  );
}
