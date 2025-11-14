'use client';

/**
 * VideoMetadataPanel Component
 *
 * Display comprehensive video metadata including title, duration, progress, and last watched
 * Features:
 * - Large video title
 * - Duration in human-readable format
 * - Video ID badge
 * - Progress display from watch session data
 * - Last watched timestamp
 */

import { memo } from 'react';
import { Clock, Hash } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import { formatDuration, formatRelativeTime } from '@/lib/utils/format';

interface VideoMetadataPanelProps {
  video: {
    id: string;
    title: string;
    duration_seconds: number;
  };
  progress?: {
    percent_complete: number;
    watch_time_seconds: number;
    last_watched: string;
  };
  className?: string;
}

function VideoMetadataPanelComponent({
  video,
  progress,
  className,
}: VideoMetadataPanelProps) {
  // Truncate video ID for display (first 8 chars)
  const shortId = video.id.substring(0, 8);

  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-start md:justify-between',
        className
      )}
    >
      {/* Left Side: Title + Metadata */}
      <div className="flex-1 min-w-0 space-y-3">
        {/* Video Title */}
        <h1 className="text-2xl md:text-3xl font-bold text-gray-12 break-words">
          {video.title}
        </h1>

        {/* Metadata Row */}
        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-11">
          {/* Duration */}
          <div className="flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>{formatDuration(video.duration_seconds)}</span>
          </div>

          {/* Video ID Badge */}
          <Badge variant="default" size="sm" className="font-mono">
            <Hash className="h-3 w-3 mr-1" aria-hidden="true" />
            {shortId}
          </Badge>

          {/* Last Watched */}
          {progress?.last_watched && (
            <div className="flex items-center gap-1.5">
              <span className="text-gray-10">Last watched</span>
              <span className="font-medium text-gray-11">
                {formatRelativeTime(progress.last_watched)}
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar (if progress exists) */}
        {progress && progress.percent_complete > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-11">
                {Math.round(progress.percent_complete)}% complete
              </span>
              <span className="text-gray-10">
                {formatDuration(progress.watch_time_seconds)} watched
              </span>
            </div>
            <div className="w-full bg-gray-4 rounded-full h-2 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  progress.percent_complete >= 100
                    ? 'bg-green-9'
                    : progress.percent_complete >= 50
                      ? 'bg-blue-9'
                      : 'bg-yellow-9'
                )}
                style={{ width: `${Math.min(progress.percent_complete, 100)}%` }}
                role="progressbar"
                aria-valuenow={Math.round(progress.percent_complete)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Video progress"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Memoize component to prevent unnecessary re-renders
export const VideoMetadataPanel = memo(VideoMetadataPanelComponent);
