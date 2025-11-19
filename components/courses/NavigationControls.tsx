'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from 'frosted-ui';
import { cn } from '@/lib/utils';

interface NavigationControlsProps {
  hasPrevious: boolean;
  hasNext: boolean;
  isCompleted: boolean;
  isLoading?: boolean;
  autoAdvance?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onMarkComplete: () => void;
  onAutoAdvanceToggle?: (enabled: boolean) => void;
  className?: string;
}

/**
 * NavigationControls - Lesson navigation and completion controls
 *
 * Features:
 * - Previous/Next lesson buttons
 * - Mark as complete button (toggle)
 * - Auto-advance checkbox
 * - Keyboard shortcuts support
 * - Responsive layout
 */
export function NavigationControls({
  hasPrevious,
  hasNext,
  isCompleted,
  isLoading = false,
  autoAdvance = false,
  onPrevious,
  onNext,
  onMarkComplete,
  onAutoAdvanceToggle,
  className = '',
}: NavigationControlsProps) {
  const [localAutoAdvance, setLocalAutoAdvance] = useState(autoAdvance);

  const handleAutoAdvanceToggle = () => {
    const newValue = !localAutoAdvance;
    setLocalAutoAdvance(newValue);
    onAutoAdvanceToggle?.(newValue);
  };

  return (
    <div className={cn('bg-gray-1 border-t border-gray-a4 p-4', className)}>
      <div className="max-w-7xl mx-auto">
        {/* Desktop Layout */}
        <div className="hidden sm:flex items-center justify-between gap-4">
          {/* Left: Previous Button */}
          <div className="w-40">
            <Button
              onClick={onPrevious}
              disabled={!hasPrevious || isLoading}
              variant="outline"
              size="md"
              className="w-full"
              icon={<ChevronLeft className="h-4 w-4" />}
              iconPosition="left"
            >
              Previous
            </Button>
          </div>

          {/* Center: Mark Complete + Auto-advance */}
          <div className="flex-1 flex items-center justify-center gap-4">
            <Button
              onClick={onMarkComplete}
              disabled={isLoading}
              variant={isCompleted ? 'secondary' : 'primary'}
              size="md"
              icon={<Check className="h-4 w-4" />}
              iconPosition="left"
            >
              {isCompleted ? 'Completed' : 'Mark as Complete'}
            </Button>

            {onAutoAdvanceToggle && (
              <label className="flex items-center gap-2 text-sm text-gray-11 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={localAutoAdvance}
                  onChange={handleAutoAdvanceToggle}
                  className="rounded border-gray-a6 text-purple-9 focus:ring-purple-9"
                />
                <span>Auto-advance</span>
              </label>
            )}
          </div>

          {/* Right: Next Button */}
          <div className="w-40">
            <Button
              onClick={onNext}
              disabled={!hasNext || isLoading}
              variant="outline"
              size="md"
              className="w-full"
              icon={<ChevronRight className="h-4 w-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="sm:hidden space-y-3">
          {/* Mark Complete Button */}
          <Button
            onClick={onMarkComplete}
            disabled={isLoading}
            variant={isCompleted ? 'secondary' : 'primary'}
            size="md"
            className="w-full"
            icon={<Check className="h-4 w-4" />}
            iconPosition="left"
          >
            {isCompleted ? 'Completed' : 'Mark as Complete'}
          </Button>

          {/* Navigation Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={onPrevious}
              disabled={!hasPrevious || isLoading}
              variant="outline"
              size="md"
              className="w-full"
              icon={<ChevronLeft className="h-4 w-4" />}
              iconPosition="left"
            >
              Previous
            </Button>
            <Button
              onClick={onNext}
              disabled={!hasNext || isLoading}
              variant="outline"
              size="md"
              className="w-full"
              icon={<ChevronRight className="h-4 w-4" />}
              iconPosition="right"
            >
              Next
            </Button>
          </div>

          {/* Auto-advance (Mobile) */}
          {onAutoAdvanceToggle && (
            <label className="flex items-center justify-center gap-2 text-sm text-gray-11 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={localAutoAdvance}
                onChange={handleAutoAdvanceToggle}
                className="rounded border-gray-a6 text-purple-9 focus:ring-purple-9"
              />
              <span>Auto-advance to next lesson</span>
            </label>
          )}
        </div>
      </div>
    </div>
  );
}
