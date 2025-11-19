'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@whop/react/components';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  BarChart,
  Activity,
  MessageSquare,
  GraduationCap,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

// Original navigation (full creator feature set)
const originalNavigation = [
  { name: 'Dashboard', href: '/dashboard/creator/overview', icon: LayoutDashboard },
  { name: 'Courses', href: '/dashboard/creator/courses', icon: BookOpen },
  { name: 'Videos', href: '/dashboard/creator/videos', icon: Video },
  { name: 'Analytics', href: '/dashboard/creator/analytics', icon: BarChart },
  { name: 'Usage', href: '/dashboard/creator/usage', icon: Activity },
  { name: 'Chat', href: '/dashboard/creator/chat', icon: MessageSquare },
];

// Simplified navigation for development (easier dashboard switching)
const devSimpleNavigation = [
  { name: 'Dashboard', href: '/dashboard/creator/overview', icon: LayoutDashboard },
  { name: 'Courses', href: '/dashboard/creator/courses', icon: BookOpen },
  { name: 'Videos', href: '/dashboard/creator/videos', icon: Video },
  { name: 'Analytics', href: '/dashboard/creator/analytics', icon: BarChart },
  { name: 'Usage', href: '/dashboard/creator/usage', icon: Activity },
  { name: 'Student', href: '/dashboard/student', icon: GraduationCap },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Use simplified navigation when DEV_SIMPLE_NAV is enabled
  const isDevSimpleNav = process.env['NEXT_PUBLIC_DEV_SIMPLE_NAV'] === 'true';
  const navigation = isDevSimpleNav ? devSimpleNavigation : originalNavigation;

  return (
    <nav className="bg-gray-2 border-b border-gray-a4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard/creator/overview" className="flex items-center gap-2">
              <img
                src="/images/chronos_icon_128.png"
                alt="Chronos"
                className="h-8 w-8 object-contain flex-shrink-0"
              />
              <span className="font-semibold text-5 text-gray-12 hidden sm:inline">
                Chronos
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={isActive ? 'solid' : 'ghost'}
                      size="2"
                      className={cn(
                        'gap-2',
                        isActive ? 'bg-gray-a4' : 'text-gray-11 hover:text-gray-12'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-a4">
            <div className="flex flex-col gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button
                      variant={isActive ? 'solid' : 'ghost'}
                      size="2"
                      className={cn(
                        'w-full justify-start gap-2',
                        isActive ? 'bg-gray-a4' : 'text-gray-11 hover:text-gray-12'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
