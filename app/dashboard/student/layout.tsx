import { ReactNode } from 'react';
import { StudentNav } from '@/components/layout/StudentNav';
import { AuthProvider } from '@/lib/contexts/AuthContext';
import { RoleSwitcher } from '@/components/dashboard/RoleSwitcher';
import { requireAuth } from '@/lib/whop/auth';

// Force dynamic rendering since we use cookies for authentication
export const dynamic = 'force-dynamic';

export default async function StudentDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Get authenticated Whop session
  const session = await requireAuth();

  return (
    <AuthProvider session={session}>
      <div className="min-h-screen bg-gray-1">
        <StudentNav />
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-4">
            <RoleSwitcher />
          </div>
          {children}
        </main>
      </div>
    </AuthProvider>
  );
}
