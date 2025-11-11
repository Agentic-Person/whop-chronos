import { ReactNode } from 'react';
import { DashboardNav } from '@/components/layout/DashboardNav';

export default async function CreatorDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // BYPASS WHOP AUTH FOR TESTING
  // TODO: Re-enable Whop authentication when ready for production

  return (
    <div className="min-h-screen bg-gray-1">
      <DashboardNav />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
