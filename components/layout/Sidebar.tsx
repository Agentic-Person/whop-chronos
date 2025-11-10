"use client";

import {
  LayoutDashboard,
  Video,
  Users,
  BookOpen,
  BarChart3,
  Settings,
  MessageSquare,
  ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarProps {
  userRole?: "creator" | "student";
  isOpen?: boolean;
  onClose?: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const creatorNavItems: NavItem[] = [
  {
    label: "Overview",
    href: "/dashboard/creator/overview",
    icon: LayoutDashboard,
  },
  {
    label: "Videos",
    href: "/dashboard/creator/videos",
    icon: Video,
  },
  {
    label: "Courses",
    href: "/dashboard/creator/courses",
    icon: BookOpen,
  },
  {
    label: "Students",
    href: "/dashboard/creator/students",
    icon: Users,
  },
  {
    label: "Analytics",
    href: "/dashboard/creator/analytics",
    icon: BarChart3,
  },
  {
    label: "Settings",
    href: "/dashboard/creator/settings",
    icon: Settings,
  },
];

const studentNavItems: NavItem[] = [
  {
    label: "My Courses",
    href: "/dashboard/student/courses",
    icon: BookOpen,
  },
  {
    label: "AI Chat",
    href: "/dashboard/student/chat",
    icon: MessageSquare,
  },
  {
    label: "Settings",
    href: "/dashboard/student/settings",
    icon: Settings,
  },
];

export function Sidebar({
  userRole = "creator",
  isOpen = true,
  onClose
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = userRole === "creator" ? creatorNavItems : studentNavItems;

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-gray-200 bg-white transition-transform duration-300 lg:sticky lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
              <span className="text-lg font-bold text-white">C</span>
            </div>
            <span className="text-xl font-bold">Chronos</span>
          </Link>

          {/* Close button (mobile only) */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-purple-50 text-purple-700"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-semibold text-purple-700">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 p-4">
          <div className="rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-4">
            <p className="text-sm font-semibold text-gray-900">
              {userRole === "creator" ? "Pro Plan" : "Student"}
            </p>
            <p className="mt-1 text-xs text-gray-600">
              {userRole === "creator"
                ? "Unlimited videos & students"
                : "Full access to all courses"}
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
