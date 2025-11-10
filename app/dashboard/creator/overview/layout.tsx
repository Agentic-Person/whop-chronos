import { ReactNode } from 'react';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { DashboardNav } from '@/components/layout/DashboardNav';
import { AnalyticsProvider } from '@/lib/contexts/AnalyticsContext';

export default async function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Verify user and get creator info
  const { userId } = await whopsdk.verifyUserToken(await headers());
  const user = await whopsdk.users.retrieve(userId);

  // TODO: Fetch creator tier from database
  const creatorTier = 'pro'; // Default for now

  return (
    <div className="min-h-screen bg-gray-1">
      <DashboardNav />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnalyticsProvider creatorId={userId} tier={creatorTier}>
          {children}
        </AnalyticsProvider>
      </main>
    </div>
  );
}
