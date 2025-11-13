'use client';

import { useState, useMemo } from 'react';
import { Grid, List, Search, Filter, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';
import { VideoPreview } from './VideoPreview';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];
type VideoStatus = Video['status'];

interface VideoListProps {
  videos: Video[];
  onVideoUpdate?: (id: string, updates: Partial<Video>) => void;
  onVideoDelete?: (id: string) => void;
  className?: string;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc' | 'size-desc' | 'size-asc';
type FilterStatus = 'all' | VideoStatus;

export function VideoList({
  videos,
  onVideoUpdate,
  onVideoDelete,
  className,
}: VideoListProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('date-desc');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter and sort videos
  const filteredAndSortedVideos = useMemo(() => {
    let result = [...videos];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (video) =>
          video.title.toLowerCase().includes(query) ||
          video.description?.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      result = result.filter((video) => video.status === filterStatus);
    }

    // Apply sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'date-asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name-asc':
          return a.title.localeCompare(b.title);
        case 'name-desc':
          return b.title.localeCompare(a.title);
        case 'size-desc':
          return (b.file_size_bytes || 0) - (a.file_size_bytes || 0);
        case 'size-asc':
          return (a.file_size_bytes || 0) - (b.file_size_bytes || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [videos, searchQuery, sortBy, filterStatus]);

  // Get status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts: Record<VideoStatus | 'all', number> = {
      all: videos.length,
      pending: 0,
      uploading: 0,
      transcribing: 0,
      processing: 0,
      embedding: 0,
      completed: 0,
      failed: 0,
    };

    videos.forEach((video) => {
      counts[video.status]++;
    });

    return counts;
  }, [videos]);

  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All Videos' },
    { value: 'completed', label: 'Completed' },
    { value: 'transcribing', label: 'Transcribing' },
    { value: 'processing', label: 'Processing' },
    { value: 'embedding', label: 'Embedding' },
    { value: 'pending', label: 'Pending' },
    { value: 'uploading', label: 'Uploading' },
    { value: 'failed', label: 'Failed' },
  ];

  const sortOptions: { value: SortBy; label: string }[] = [
    { value: 'date-desc', label: 'Newest First' },
    { value: 'date-asc', label: 'Oldest First' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'size-desc', label: 'Largest First' },
    { value: 'size-asc', label: 'Smallest First' },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header with controls */}
      <div className="space-y-4">
        {/* Search and view toggle */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-11" />
            <input
              type="text"
              placeholder="Search videos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-6 rounded-lg bg-gray-1 text-gray-12 focus:ring-2 focus:ring-purple-9 focus:border-transparent"
              aria-label="Search videos"
            />
          </div>

          {/* View mode toggle */}
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

          {/* Filters toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            icon={<Filter className="h-4 w-4" />}
          >
            Filters
          </Button>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="rounded-lg border border-gray-6 bg-gray-2 p-4 space-y-4">
            {/* Status filter */}
            <div>
              <label className="block text-sm font-medium text-gray-12 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statusOptions.map((option) => {
                  const count = statusCounts[option.value];
                  if (count === 0 && option.value !== 'all') return null;

                  return (
                    <button
                      key={option.value}
                      onClick={() => setFilterStatus(option.value)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                        filterStatus === option.value
                          ? 'bg-purple-9 text-white'
                          : 'bg-gray-1 text-gray-12 border border-gray-6 hover:border-purple-9'
                      )}
                    >
                      {option.label}
                      <span className="ml-1.5 text-xs opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sort options */}
            <div>
              <label className="block text-sm font-medium text-gray-12 mb-2">
                Sort By
              </label>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-4 w-4 text-gray-11" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortBy)}
                  className="flex-1 px-3 py-2 border border-gray-6 rounded-lg bg-gray-1 text-gray-12 focus:ring-2 focus:ring-purple-9 focus:border-transparent"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between text-sm text-gray-11">
          <span>
            {filteredAndSortedVideos.length} video{filteredAndSortedVideos.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
          {(searchQuery || filterStatus !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
              }}
              className="text-purple-11 hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Videos grid/list */}
      {filteredAndSortedVideos.length === 0 ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-3 mb-4">
            <Search className="h-8 w-8 text-gray-11" />
          </div>
          <h3 className="text-lg font-semibold text-gray-12 mb-2">
            No videos found
          </h3>
          <p className="text-gray-11">
            {searchQuery || filterStatus !== 'all'
              ? 'Try adjusting your filters or search query'
              : 'Upload your first video to get started'}
          </p>
        </div>
      ) : (
        <div
          className={cn(
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
              : 'space-y-4'
          )}
        >
          {filteredAndSortedVideos.map((video) => (
            <VideoPreview
              key={video.id}
              video={{
                id: video.id,
                title: video.title,
                description: video.description || undefined,
                thumbnail: video.thumbnail_url || undefined,
                duration: video.duration_seconds || undefined,
                fileSize: video.file_size_bytes || 0,
                format: video.storage_path?.split('.').pop()?.toUpperCase() || 'MP4',
                status: video.status,
                createdAt: new Date(video.created_at),
              }}
              onUpdate={onVideoUpdate}
              onDelete={onVideoDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
