'use client';

/**
 * Video Library Grid Component
 *
 * Responsive grid layout for displaying videos
 * Features:
 * - Grid/List view toggle
 * - Checkbox selection
 * - Responsive breakpoints
 */

import { useState } from 'react';
import { Grid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { VideoCard } from './VideoCard';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

interface VideoLibraryGridProps {
  videos: Video[];
  selectedVideos: Set<string>;
  onSelectionToggle: (id: string) => void;
  onSelectAllToggle: () => void;
  onVideoUpdate?: (id: string, updates: Partial<Video>) => void;
  onVideoDelete?: (id: string) => void;
}

type ViewMode = 'grid' | 'list';

export function VideoLibraryGrid({
  videos,
  selectedVideos,
  onSelectionToggle,
  onSelectAllToggle,
  onVideoUpdate,
  onVideoDelete,
}: VideoLibraryGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');

  const allSelected = videos.length > 0 && selectedVideos.size === videos.length;
  const someSelected = selectedVideos.size > 0 && selectedVideos.size < videos.length;

  return (
    <div className="space-y-4">
      {/* Header with view mode toggle and select all */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Select All Checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(input) => {
                if (input) {
                  input.indeterminate = someSelected;
                }
              }}
              onChange={onSelectAllToggle}
              className="h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">
              {allSelected
                ? 'Deselect All'
                : someSelected
                ? `${selectedVideos.size} Selected`
                : 'Select All'}
            </span>
          </label>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
            icon={<Grid className="h-4 w-4" />}
            aria-label="Grid view"
          >
            Grid
          </Button>
          <Button
            variant={viewMode === 'list' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            icon={<List className="h-4 w-4" />}
            aria-label="List view"
          >
            List
          </Button>
        </div>
      </div>

      {/* Video Grid/List */}
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
            : 'space-y-4'
        }
      >
        {videos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            isSelected={selectedVideos.has(video.id)}
            onSelectionToggle={() => onSelectionToggle(video.id)}
            onUpdate={onVideoUpdate}
            onDelete={onVideoDelete}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );
}
