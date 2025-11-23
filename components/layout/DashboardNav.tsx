'use client';

import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
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
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Check if DEV_SIMPLE_NAV is enabled for quick dashboard switching
const isDevSimpleNav = process.env.NEXT_PUBLIC_DEV_SIMPLE_NAV === 'true';

// Navigation items template - paths will be built dynamically
const navItems = [
  { name: 'Dashboard', path: 'overview', icon: LayoutDashboard },
  { name: 'Courses', path: 'courses', icon: BookOpen },
  { name: 'Videos', path: 'videos', icon: Video },
  { name: 'Analytics', path: 'analytics', icon: BarChart },
  { name: 'Usage', path: 'usage', icon: Activity },
];

export function DashboardNav() {
  const pathname = usePathname();
  const params = useParams();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Extract companyId from params or pathname
  const companyId = params.companyId as string | undefined;

  // Determine if we're using the new native auth routes or legacy routes
  const isNativeAuthRoute = pathname.startsWith('/dashboard/') && companyId;
  const isLegacyRoute = pathname.startsWith('/dashboard/creator/');

  // Build navigation based on route type
  const navigation = useMemo(() => {
    let items;
    if (isNativeAuthRoute && companyId) {
      // New native auth route structure: /dashboard/[companyId]/*
      items = navItems.map(item => ({
        name: item.name,
        href: `/dashboard/${companyId}/${item.path}`,
        icon: item.icon,
      }));
    } else if (isLegacyRoute) {
      // Legacy route structure: /dashboard/creator/*
      items = navItems.map(item => ({
        name: item.name,
        href: `/dashboard/creator/${item.path}`,
        icon: item.icon,
      }));
    } else {
      // Default fallback
      items = navItems.map(item => ({
        name: item.name,
        href: `/dashboard/creator/${item.path}`,
        icon: item.icon,
      }));
    }

    // DEV_SIMPLE_NAV: Add quick switch to student dashboard
    if (isDevSimpleNav) {
      items.push({
        name: 'Student',
        href: '/dashboard/student/chat',
        icon: GraduationCap,
      });
    }

    return items;
  }, [companyId, isNativeAuthRoute, isLegacyRoute]);

  // Home link - goes to overview
  const homeHref = isNativeAuthRoute && companyId
    ? `/dashboard/${companyId}/overview`
    : '/dashboard/creator/overview';

  return (
    <nav className="bg-gray-2 border-b border-gray-a4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href={homeHref} className="flex items-center gap-2">
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
