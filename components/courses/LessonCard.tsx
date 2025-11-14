'use client';

/**
 * LessonCard Component
 *
 * Display individual lesson with thumbnail, duration, source type, and selection state
 * Features:
 * - Medium thumbnail (80x45px, 16:9 aspect ratio)
 * - Video title with text truncation (max 2 lines)
 * - Duration badge (bottom-right corner)
 * - Source type badge (top-left corner)
 * - Active/selected state styling
 * - Hover effects
 */

import { memo } from 'react';
import { Youtube, Radio, Video as VideoIcon, Upload } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { formatDurationShort } from '@/lib/utils/format';

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    thumbnail: string | null;
    duration_seconds: number;
    source_type: 'youtube' | 'loom' | 'mux' | 'upload';
  };
  isSelected: boolean;
  onSelect: (lessonId: string) => void;
}

function LessonCardComponent({ lesson, isSelected, onSelect }: LessonCardProps) {
  // Get source type icon
  const getSourceIcon = () => {
    switch (lesson.source_type) {
      case 'youtube':
        return <Youtube className="h-3 w-3 text-red-11" aria-label="YouTube video" />;
      case 'loom':
        return <Radio className="h-3 w-3 text-purple-11" aria-label="Loom video" />;
      case 'mux':
        return <VideoIcon className="h-3 w-3 text-blue-11" aria-label="Mux video" />;
      case 'upload':
        return <Upload className="h-3 w-3 text-green-11" aria-label="Uploaded video" />;
    }
  };

  // Get source badge background color
  const getSourceBadgeColor = () => {
    switch (lesson.source_type) {
      case 'youtube':
        return 'bg-red-3 border-red-6';
      case 'loom':
        return 'bg-purple-3 border-purple-6';
      case 'mux':
        return 'bg-blue-3 border-blue-6';
      case 'upload':
        return 'bg-green-3 border-green-6';
    }
  };

  return (
    <button
      type="button"
      onClick={() => onSelect(lesson.id)}
      className={cn(
        'w-full text-left transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-blue-9 focus:ring-offset-2',
        'group'
      )}
      aria-pressed={isSelected}
      aria-label={`Select lesson: ${lesson.title}`}
    >
      <Card
        padding="none"
        className={cn(
          'overflow-hidden transition-all duration-200',
          'group-hover:shadow-lg group-hover:scale-[1.02]',
          isSelected && 'ring-2 ring-blue-9 shadow-lg'
        )}
      >
        {/* Thumbnail Container */}
        <div className="relative w-20 h-[45px] bg-gray-3 flex-shrink-0">
          {/* Source Type Badge - Top Left */}
          <div className="absolute top-1 left-1 z-10">
            <div
              className={cn(
                'flex items-center justify-center p-1 rounded border backdrop-blur-sm',
                getSourceBadgeColor()
              )}
            >
              {getSourceIcon()}
            </div>
          </div>

          {/* Thumbnail Image or Placeholder */}
          {lesson.thumbnail ? (
            <img
              src={lesson.thumbnail}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <VideoIcon className="h-5 w-5 text-gray-8" aria-hidden="true" />
            </div>
          )}

          {/* Duration Badge - Bottom Right */}
          <div className="absolute bottom-1 right-1 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded font-medium">
            {formatDurationShort(lesson.duration_seconds)}
          </div>
        </div>

        {/* Title */}
        <div className="p-2">
          <h3
            className={cn(
              'text-sm font-medium line-clamp-2 transition-colors',
              isSelected ? 'text-blue-11' : 'text-gray-12 group-hover:text-gray-11'
            )}
            title={lesson.title}
          >
            {lesson.title}
          </h3>
        </div>
      </Card>
    </button>
  );
}

// Memoize component to prevent unnecessary re-renders
export const LessonCard = memo(LessonCardComponent);
