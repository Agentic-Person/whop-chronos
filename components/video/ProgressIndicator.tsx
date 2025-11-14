'use client';

/**
 * ProgressIndicator Component
 *
 * Display circular progress ring with completion status
 * Features:
 * - Circular progress ring (SVG-based)
 * - Percentage display in center
 * - Color coding based on progress:
 *   - 0-25%: gray
 *   - 26-50%: yellow/orange
 *   - 51-99%: blue
 *   - 100%: green with checkmark
 * - Resume point display
 * - Completion badge
 */

import { memo } from 'react';
import { Check, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDurationShort } from '@/lib/utils/format';

interface ProgressIndicatorProps {
  percent: number; // 0-100
  resumeSeconds?: number;
  isCompleted: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function ProgressIndicatorComponent({
  percent,
  resumeSeconds,
  isCompleted,
  size = 'md',
  className,
}: ProgressIndicatorProps) {
  // Size configurations
  const sizeConfig = {
    sm: { dimension: 80, strokeWidth: 6, fontSize: 'text-lg' },
    md: { dimension: 120, strokeWidth: 8, fontSize: 'text-2xl' },
    lg: { dimension: 160, strokeWidth: 10, fontSize: 'text-3xl' },
  };

  const config = sizeConfig[size];
  const radius = (config.dimension - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;

  // Get color based on progress
  const getProgressColor = () => {
    if (isCompleted || percent >= 100) return 'text-green-9';
    if (percent >= 51) return 'text-blue-9';
    if (percent >= 26) return 'text-yellow-9';
    return 'text-gray-9';
  };

  const getProgressStroke = () => {
    if (isCompleted || percent >= 100) return '#30a46c'; // green-9
    if (percent >= 51) return '#0090ff'; // blue-9
    if (percent >= 26) return '#f5d90a'; // yellow-9
    return '#9ba1a6'; // gray-9
  };

  const getBackgroundStroke = () => {
    if (isCompleted || percent >= 100) return '#e9f3ee'; // green-3
    if (percent >= 51) return '#e6f4fe'; // blue-3
    if (percent >= 26) return '#fef9e8'; // yellow-3
    return '#f2f4f6'; // gray-3
  };

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      {/* Circular Progress Ring */}
      <div className="relative" style={{ width: config.dimension, height: config.dimension }}>
        <svg
          width={config.dimension}
          height={config.dimension}
          className="transform -rotate-90"
          aria-label={`${Math.round(percent)}% complete`}
        >
          {/* Background Circle */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            stroke={getBackgroundStroke()}
            strokeWidth={config.strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <circle
            cx={config.dimension / 2}
            cy={config.dimension / 2}
            r={radius}
            stroke={getProgressStroke()}
            strokeWidth={config.strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {isCompleted || percent >= 100 ? (
            <div className="flex flex-col items-center">
              <div className="bg-green-9 text-white rounded-full p-2 mb-1">
                <Check className={cn('h-6 w-6', size === 'sm' && 'h-4 w-4')} />
              </div>
              <span className="text-xs font-medium text-green-11">Complete</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span className={cn('font-bold', getProgressColor(), config.fontSize)}>
                {Math.round(percent)}%
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Resume Point Display */}
      {!isCompleted && resumeSeconds !== undefined && resumeSeconds > 0 && percent > 0 && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-3 border border-blue-6 rounded-full">
          <Play className="h-3.5 w-3.5 text-blue-11" />
          <span className="text-sm font-medium text-blue-11">
            Resume at {formatDurationShort(resumeSeconds)}
          </span>
        </div>
      )}

      {/* Completion Badge */}
      {isCompleted && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-green-3 border border-green-6 rounded-full">
          <Check className="h-3.5 w-3.5 text-green-11" />
          <span className="text-sm font-medium text-green-11">Completed</span>
        </div>
      )}
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const ProgressIndicator = memo(ProgressIndicatorComponent);
