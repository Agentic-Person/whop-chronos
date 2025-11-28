"use client";

import { Menu, Bell, Settings, LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface HeaderProps {
  onMenuClick?: () => void;
  showMenuButton?: boolean;
  userRole?: "creator" | "student";
}

export function Header({
  onMenuClick,
  showMenuButton = true,
  userRole = "creator"
}: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showUserMenu]);

  // Handle keyboard navigation for dropdown
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setShowUserMenu(false);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          <Link href="/" className="flex items-center gap-2">
            <img
              src="/images/chronos_icon_128.png"
              alt="Chronos"
              className="h-8 w-8 object-contain flex-shrink-0"
            />
            <span className="hidden text-xl font-bold md:inline-block">
              Chronos
            </span>
          </Link>
        </div>

        {/* Center section - Search or breadcrumbs could go here */}
        <div className="hidden flex-1 justify-center md:flex">
          {/* Placeholder for search or navigation */}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            aria-label="View notifications (1 unread)"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              onKeyDown={handleKeyDown}
              className="flex items-center gap-2 rounded-lg p-2 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              aria-label="User menu"
              aria-haspopup="menu"
              aria-expanded={showUserMenu}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-600">
                <User className="h-4 w-4 text-white" />
              </div>
              <span className="hidden text-sm font-medium md:inline-block">
                {userRole === "creator" ? "Creator" : "Student"}
              </span>
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-lg border border-gray-200 bg-white shadow-lg"
                role="menu"
                aria-orientation="vertical"
                onKeyDown={handleKeyDown}
              >
                <div className="p-2">
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                    role="menuitem"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                  <button
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    role="menuitem"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
