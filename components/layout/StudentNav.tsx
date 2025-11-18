'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@whop/react/components';
import {
  BookOpen,
  MessageSquare,
  Settings,
  Menu,
  X,
  LogOut,
  User,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/contexts/AuthContext';

const navigation = [
  { name: 'My Courses', href: '/dashboard/student/courses', icon: BookOpen },
  { name: 'AI Chat', href: '/dashboard/student/chat', icon: MessageSquare },
  { name: 'Settings', href: '/dashboard/student/settings', icon: Settings },
];

export function StudentNav() {
  const pathname = usePathname();
  const { userId, canSwitchRole, switchToCreatorDashboard } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // TODO: Implement logout logic
    console.log('Logout clicked');
  };

  return (
    <nav className="bg-gray-2 border-b border-gray-a4">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link href="/dashboard/student/courses" className="flex items-center gap-2">
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
                        isActive ? 'bg-purple-a4' : 'text-gray-11 hover:text-gray-12'
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

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-2">
            {/* Role Switcher - Only show if user can switch roles */}
            {canSwitchRole && (
              <Button
                variant="soft"
                size="2"
                onClick={switchToCreatorDashboard}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                <span>Switch to Creator</span>
              </Button>
            )}

            {/* Logout Button */}
            <Button
              variant="ghost"
              size="2"
              onClick={handleLogout}
              className="gap-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
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
                        isActive ? 'bg-purple-a4' : 'text-gray-11 hover:text-gray-12'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Button>
                  </Link>
                );
              })}

              {/* Mobile Role Switcher */}
              {canSwitchRole && (
                <>
                  <div className="border-t border-gray-a4 my-2" />
                  <Button
                    variant="soft"
                    size="2"
                    onClick={() => {
                      switchToCreatorDashboard();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full justify-start gap-2"
                  >
                    <User className="w-4 h-4" />
                    <span>Switch to Creator</span>
                  </Button>
                </>
              )}

              {/* Mobile Logout */}
              <div className="border-t border-gray-a4 my-2" />
              <Button
                variant="ghost"
                size="2"
                onClick={handleLogout}
                className="w-full justify-start gap-2 text-red-11"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>

              {/* User Info */}
              {userId && (
                <div className="mt-4 p-3 bg-gray-a2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-a4 flex items-center justify-center">
                      <User className="w-4 h-4 text-purple-11" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-11 truncate">
                        Student ID: {userId.substring(0, 8)}...
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
