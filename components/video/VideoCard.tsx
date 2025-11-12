'use client';

/**
 * Video Card Component
 *
 * Display individual video with thumbnail, metadata, and actions
 * Features:
 * - Thumbnail with fallback
 * - Status badge
 * - Source type icon
 * - Duration display
 * - Edit/Delete actions
 * - View details button
 * - Checkbox for bulk selection
 */

import { useState } from 'react';
import {
  FileVideo,
  Clock,
  Edit2,
  Trash2,
  Eye,
  Youtube,
  Video as VideoIcon,
  Radio,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VideoDetailModal } from './VideoDetailModal';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

interface VideoCardProps {
  video: Video;
  isSelected: boolean;
  onSelectionToggle: () => void;
  onUpdate?: (id: string, updates: Partial<Video>) => void;
  onDelete?: (id: string) => void;
  viewMode?: 'grid' | 'list';
}

export function VideoCard({
  video,
  isSelected,
  onSelectionToggle,
  onUpdate,
  onDelete,
  viewMode = 'grid',
}: VideoCardProps) {
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get status badge variant
  const getStatusVariant = (
    status: Video['status']
  ): 'default' | 'success' | 'warning' | 'danger' | 'info' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'pending':
      case 'uploading':
        return 'info';
      case 'transcribing':
      case 'processing':
      case 'embedding':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get source type icon
  const getSourceIcon = (sourceType: Video['source_type']) => {
    switch (sourceType) {
      case 'youtube':
        return <Youtube className="h-4 w-4 text-red-600" />;
      case 'loom':
        return <Radio className="h-4 w-4 text-purple-600" />;
      case 'mux':
        return <VideoIcon className="h-4 w-4 text-blue-600" />;
      case 'upload':
        return <FileVideo className="h-4 w-4 text-gray-600" />;
      default:
        return <FileVideo className="h-4 w-4 text-gray-600" />;
    }
  };

  // Handle delete with confirmation
  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
      onDelete?.(video.id);
    }
  };

  // Grid view card
  if (viewMode === 'grid') {
    return (
      <>
        <Card
          padding="none"
          hover
          className={cn(
            'overflow-hidden transition-all',
            isSelected && 'ring-2 ring-purple-500'
          )}
        >
          {/* Thumbnail */}
          <div className="relative aspect-video bg-gray-100">
            {/* Selection Checkbox */}
            <div className="absolute top-2 left-2 z-10">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onSelectionToggle}
                className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {/* Status Badge */}
            <div className="absolute top-2 right-2 z-10">
              <Badge variant={getStatusVariant(video.status)} size="sm">
                {video.status}
              </Badge>
            </div>

            {/* Thumbnail Image or Placeholder */}
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileVideo className="h-12 w-12 text-gray-400" />
              </div>
            )}

            {/* Duration Overlay */}
            {video.duration_seconds && (
              <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                {formatDuration(video.duration_seconds)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title */}
            <h3 className="font-semibold text-gray-900 line-clamp-2 min-h-[3rem]">
              {video.title}
            </h3>

            {/* Metadata */}
            <div className="flex items-center gap-3 text-xs text-gray-600">
              {/* Source Icon */}
              <div className="flex items-center gap-1" title={video.source_type}>
                {getSourceIcon(video.source_type)}
                <span className="capitalize">{video.source_type}</span>
              </div>

              {/* Duration */}
              {video.duration_seconds && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{formatDuration(video.duration_seconds)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
              <Button
                variant="outline"
                size="sm"
                icon={<Eye className="h-4 w-4" />}
                onClick={() => setShowDetailModal(true)}
                className="flex-1"
              >
                View
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<Edit2 className="h-4 w-4" />}
                onClick={() => setIsEditing(true)}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>

        {/* Detail Modal */}
        {showDetailModal && (
          <VideoDetailModal
            video={video}
            onClose={() => setShowDetailModal(false)}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        )}
      </>
    );
  }

  // List view card
  return (
    <>
      <Card
        padding="none"
        hover
        className={cn(
          'overflow-hidden transition-all',
          isSelected && 'ring-2 ring-purple-500'
        )}
      >
        <div className="flex items-center gap-4 p-4">
          {/* Checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelectionToggle}
            className="h-5 w-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer flex-shrink-0"
          />

          {/* Thumbnail */}
          <div className="relative w-32 h-20 bg-gray-100 rounded flex-shrink-0">
            {video.thumbnail_url ? (
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileVideo className="h-8 w-8 text-gray-400" />
              </div>
            )}
            {video.duration_seconds && (
              <div className="absolute bottom-1 right-1 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration_seconds)}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">{video.title}</h3>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {getSourceIcon(video.source_type)}
                <span className="capitalize">{video.source_type}</span>
              </div>
              <Badge variant={getStatusVariant(video.status)} size="sm">
                {video.status}
              </Badge>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              icon={<Eye className="h-4 w-4" />}
              onClick={() => setShowDetailModal(true)}
            >
              View
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<Edit2 className="h-4 w-4" />}
              onClick={() => setIsEditing(true)}
            >
              Edit
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </Card>

      {/* Detail Modal */}
      {showDetailModal && (
        <VideoDetailModal
          video={video}
          onClose={() => setShowDetailModal(false)}
          onUpdate={onUpdate}
          onDelete={onDelete}
        />
      )}
    </>
  );
}
