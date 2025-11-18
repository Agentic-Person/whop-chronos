'use client';

import { Card } from 'frosted-ui';
import { Clock, PlayCircle, CheckCircle, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  progress: number; // 0-100
  moduleCount: number;
  totalDuration: number; // in minutes
  status: 'not_started' | 'in_progress' | 'completed';
}

/**
 * CourseCard - Course preview card for student catalog
 *
 * Features:
 * - Thumbnail image with fallback
 * - Title and description with truncation
 * - Progress bar and percentage
 * - Module count and duration badges
 * - Status-based CTA button
 * - Hover elevation effect
 * - Click to navigate to course viewer
 */
export function CourseCard({
  id,
  title,
  description,
  thumbnail,
  progress,
  moduleCount,
  totalDuration,
  status,
}: CourseCardProps) {
  /**
   * Format duration as "Xh Ym" or "Xm"
   */
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  /**
   * Get CTA button text based on status
   */
  const getCtaText = (): string => {
    switch (status) {
      case 'in_progress':
        return 'Continue';
      case 'completed':
        return 'Review';
      default:
        return 'Start';
    }
  };

  /**
   * Get status icon
   */
  const StatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-11" />;
      case 'in_progress':
        return <PlayCircle className="w-4 h-4 text-blue-11" />;
      default:
        return <BookOpen className="w-4 h-4 text-gray-11" />;
    }
  };

  return (
    <Link href={`/dashboard/student/courses/${id}`}>
      <Card
        size="3"
        className={cn(
          'group cursor-pointer transition-all duration-200',
          'hover:shadow-lg hover:scale-[1.02]',
          'flex flex-col h-full'
        )}
      >
        {/* Thumbnail */}
        <div className="relative w-full h-48 bg-gray-a3 rounded-t-lg overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-a3 to-blue-a3">
              <BookOpen className="w-16 h-16 text-purple-9 opacity-50" />
            </div>
          )}

          {/* Status Badge */}
          <div className="absolute top-3 right-3 px-2 py-1 bg-gray-1/90 backdrop-blur-sm rounded-full flex items-center gap-1.5">
            <StatusIcon />
            <span className="text-xs font-medium text-gray-12 capitalize">
              {status.replace('_', ' ')}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-12 line-clamp-2 group-hover:text-purple-11 transition-colors">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-gray-11 line-clamp-3 flex-1">
            {description || 'No description available'}
          </p>

          {/* Progress Bar */}
          {progress > 0 && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-11">Progress</span>
                <span className="text-xs font-medium text-gray-12">{progress}%</span>
              </div>
              <div className="w-full bg-gray-a3 rounded-full h-2 overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    status === 'completed' ? 'bg-green-9' : 'bg-blue-9'
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Metadata Badges */}
          <div className="flex items-center gap-3 text-xs text-gray-11">
            <div className="flex items-center gap-1">
              <BookOpen className="w-4 h-4" />
              <span>{moduleCount} {moduleCount === 1 ? 'module' : 'modules'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{formatDuration(totalDuration)}</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            className={cn(
              'w-full py-2.5 px-4 rounded-lg font-medium text-sm transition-all',
              'flex items-center justify-center gap-2',
              status === 'completed'
                ? 'bg-gray-a3 text-gray-12 hover:bg-gray-a4'
                : 'bg-gradient-to-br from-purple-9 to-blue-9 text-white hover:from-purple-10 hover:to-blue-10'
            )}
          >
            <PlayCircle className="w-4 h-4" />
            {getCtaText()}
          </button>
        </div>
      </Card>
    </Link>
  );
}
