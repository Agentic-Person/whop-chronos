import { ReactNode } from 'react';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { AnalyticsProviderWithSuspense } from '@/lib/contexts/AnalyticsContext';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';
import { requireAuth } from '@/lib/whop/auth';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Get authenticated Whop session
  const session = await requireAuth();
  const creatorId = session.user.id;
  const tier = 'pro'; // TODO: Get tier from Whop membership validation

  return (
    <AuthProvider session={session}>
      <AnalyticsProviderWithSuspense creatorId={creatorId} tier={tier}>
        <div className="min-h-screen bg-gray-1">
          <DashboardNav />
          <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="mb-4">
              <RoleSwitcher />
            </div>
            {children}
          </main>
        </div>
      </AnalyticsProviderWithSuspense>
    </AuthProvider>
  );
}
