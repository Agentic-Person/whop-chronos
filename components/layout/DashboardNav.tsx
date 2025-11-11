'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@whop/react/components';
import {
  LayoutDashboard,
  BookOpen,
  BarChart,
  Activity,
  MessageSquare,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard/creator/overview', icon: LayoutDashboard },
  { name: 'Courses', href: '/dashboard/creator/courses', icon: BookOpen },
  { name: 'Analytics', href: '/dashboard/creator/analytics', icon: BarChart },
  { name: 'Usage', href: '/dashboard/creator/usage', icon: Activity },
  { name: 'Chat', href: '/dashboard/creator/chat', icon: MessageSquare },
];

export function DashboardNav() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-2 border-b border-gray-a4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard/creator/overview" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-9 to-purple-9 flex items-center justify-center">
                <span className="text-white font-bold text-4">C</span>
              </div>
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
