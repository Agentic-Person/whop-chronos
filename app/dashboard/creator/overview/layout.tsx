import { ReactNode } from 'react';
// import { headers } from 'next/headers';
// import { whopsdk } from '@/lib/whop-sdk';
import { AnalyticsProvider } from '@/lib/contexts/AnalyticsContext';

export default async function OverviewLayout({
  children,
}: {
  children: ReactNode;
}) {
  // BYPASS WHOP AUTH FOR TESTING
  // TODO: Re-enable Whop authentication when ready for production
  // const { userId } = await whopsdk.verifyUserToken(await headers());
  // const user = await whopsdk.users.retrieve(userId);

  // Use test creator ID from seed data
  const userId = '00000000-0000-0000-0000-000000000001'; // test.creator@example.com
  const creatorTier = 'pro'; // From seed data

  return (
    <AnalyticsProvider creatorId={userId} tier={creatorTier}>
      {children}
    </AnalyticsProvider>
  );
}
