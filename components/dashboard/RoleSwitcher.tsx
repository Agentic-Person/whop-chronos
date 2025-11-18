'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { UserCircle, GraduationCap } from 'lucide-react';

/**
 * RoleSwitcher - Component for dual-role users to switch between creator and student dashboards
 *
 * Only displays when user has both creator and student roles
 * Shows which dashboard is currently active
 * Switches dashboard and saves preference to localStorage
 */
export function RoleSwitcher() {
  const {
    canSwitchRole,
    currentDashboard,
    switchToCreatorDashboard,
    switchToStudentDashboard,
  } = useAuth();

  // Don't show if user can't switch roles
  if (!canSwitchRole) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-secondary/10 rounded-lg border border-border">
      <span className="text-sm text-muted-foreground">View as:</span>

      <button
        type="button"
        onClick={switchToCreatorDashboard}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${
            currentDashboard === 'creator'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-secondary text-foreground'
          }
        `}
        aria-pressed={currentDashboard === 'creator'}
        aria-label="Switch to Creator dashboard"
      >
        <UserCircle className="h-4 w-4" />
        Creator
      </button>

      <button
        type="button"
        onClick={switchToStudentDashboard}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors
          ${
            currentDashboard === 'student'
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'hover:bg-secondary text-foreground'
          }
        `}
        aria-pressed={currentDashboard === 'student'}
        aria-label="Switch to Student dashboard"
      >
        <GraduationCap className="h-4 w-4" />
        Student
      </button>
    </div>
  );
}
