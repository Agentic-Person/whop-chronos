import { ReactNode } from 'react';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { AnalyticsProviderWithSuspense } from '@/lib/contexts/AnalyticsContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';

export default async function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // BYPASS WHOP AUTH FOR TESTING
  // TODO: Re-enable Whop authentication when ready for production
  const creatorId = 'test-creator-123';
  const tier = 'pro';

  return (
    <AuthProvider>
      <AnalyticsProviderWithSuspense creatorId={creatorId} tier={tier}>
        <div className="min-h-screen bg-gray-1">
          <DashboardNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </AnalyticsProviderWithSuspense>
    </AuthProvider>
  );
}
