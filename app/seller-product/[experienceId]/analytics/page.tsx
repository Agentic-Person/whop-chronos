/**
 * Seller Analytics Page - Whop Embedded App
 */

'use client';

import { useParams } from 'next/navigation';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';

export default function SellerAnalyticsPage() {
  const params = useParams();
  const experienceId = params.experienceId as string;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-12 mb-2">Analytics</h1>
        <p className="text-gray-11">Track your content performance</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}
