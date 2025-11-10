"use client";

import { useState } from "react";
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { Footer } from "./Footer";

interface DashboardLayoutProps {
  children: React.ReactNode;
  userRole?: "creator" | "student";
  showFooter?: boolean;
}

export function DashboardLayout({
  children,
  userRole = "creator",
  showFooter = false,
}: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full">
      {/* Sidebar */}
      <Sidebar
        userRole={userRole}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-1 flex-col lg:ml-64">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          showMenuButton={true}
          userRole={userRole}
        />

        {/* Page content */}
        <main className="flex-1 bg-gray-50">
          {children}
        </main>

        {/* Optional footer */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
}
