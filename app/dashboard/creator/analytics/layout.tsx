'use client';

import { AnalyticsProviderWithSuspense, SubscriptionTier } from '@/lib/contexts/AnalyticsContext';

interface AnalyticsLayoutProps {
  children: React.ReactNode;
}

export default function AnalyticsLayout({ children }: AnalyticsLayoutProps) {
  // Get creatorId (DEV_BYPASS_AUTH or real auth)
  // Using NEXT_PUBLIC_ prefix for client-side access
  const creatorId = process.env.NEXT_PUBLIC_DEV_BYPASS_AUTH === 'true'
    ? '00000000-0000-0000-0000-000000000001'
    : '00000000-0000-0000-0000-000000000001'; // TODO: Get from real auth when available

  // Default to 'pro' tier for development
  // TODO: Fetch from creator record in production
  const tier: SubscriptionTier = 'pro';

  return (
    <AnalyticsProviderWithSuspense creatorId={creatorId} tier={tier}>
      {children}
    </AnalyticsProviderWithSuspense>
  );
}
