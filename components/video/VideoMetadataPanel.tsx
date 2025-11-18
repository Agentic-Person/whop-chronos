'use client';

/**
 * VideoMetadataPanel Component
 *
 * Displays video metadata and progress information for student lesson viewer.
 * Features:
 * - Video title and duration
 * - Progress tracking (percentage, watch time, last watched)
 * - Visual progress bar
 * - Responsive design (mobile + desktop)
 * - Frosted UI design system
 *
 * Used in: IntegratedLessonViewer page
 */

import { Clock, PlayCircle, Calendar } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';

interface VideoMetadata {
  id: string;
  title: string;
  duration_seconds: number;
}

interface ProgressData {
  percent_complete: number;
  watch_time_seconds: number;
  last_watched: string;
}

interface VideoMetadataPanelProps {
  video: VideoMetadata;
  progress?: ProgressData;
}

export function VideoMetadataPanel({ video, progress }: VideoMetadataPanelProps) {
  /**
   * Format duration from seconds to MM:SS or HH:MM:SS
   */
  const formatDuration = (seconds: number): string => {
    if (!seconds || seconds === 0) return '--:--';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Format relative time (e.g., "2 hours ago", "3 days ago")
   */
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: now.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
    });
  };

  /**
   * Cap progress at 100%
   */
  const safeProgress = progress ? Math.min(progress.percent_complete, 100) : 0;

  /**
   * Get progress badge variant
   */
  const getProgressBadgeVariant = (percent: number): 'default' | 'success' | 'warning' | 'info' => {
    if (percent >= 100) return 'success';
    if (percent >= 75) return 'info';
    if (percent >= 25) return 'warning';
    return 'default';
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base lg:text-lg">Video Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Title */}
        <div>
          <h3 className="text-sm font-medium text-gray-11 mb-1">Title</h3>
          <p className="text-gray-12 font-semibold leading-snug">{video.title}</p>
        </div>

        {/* Duration */}
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5 text-gray-11">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Duration:</span>
          </div>
          <span className="text-gray-12 font-semibold">
            {video.duration_seconds > 0 ? formatDuration(video.duration_seconds) : 'Duration unknown'}
          </span>
        </div>

        {/* Progress Section - Only show if progress data exists */}
        {progress && (
          <>
            <div className="border-t border-gray-6 pt-4 space-y-4">
              {/* Progress Header */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-11">Your Progress</h3>
                <Badge
                  variant={getProgressBadgeVariant(safeProgress)}
                  size="sm"
                >
                  {Math.round(safeProgress)}%
                </Badge>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 bg-gray-4 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-300 rounded-full",
                      safeProgress >= 100 ? "bg-green-9" : "bg-purple-9"
                    )}
                    style={{ width: `${safeProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-11">
                  {safeProgress >= 100 ? 'Completed' : `${Math.round(safeProgress)}% watched`}
                </p>
              </div>

              {/* Watch Time */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-11">
                  <PlayCircle className="h-4 w-4" />
                  <span className="font-medium">Watch Time:</span>
                </div>
                <span className="text-gray-12 font-semibold">
                  {formatDuration(progress.watch_time_seconds)}
                  {video.duration_seconds > 0 && (
                    <span className="text-gray-11 font-normal">
                      {' / '}
                      {formatDuration(video.duration_seconds)}
                    </span>
                  )}
                </span>
              </div>

              {/* Last Watched */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1.5 text-gray-11">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">Last Watched:</span>
                </div>
                <span className="text-gray-12">
                  {formatRelativeTime(progress.last_watched)}
                </span>
              </div>
            </div>
          </>
        )}

        {/* No Progress State */}
        {!progress && (
          <div className="border-t border-gray-6 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-11">
              <PlayCircle className="h-4 w-4" />
              <span>Start watching to track your progress</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
