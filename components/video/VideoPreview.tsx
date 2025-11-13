'use client';

import { useState, type ChangeEvent } from 'react';
import { FileVideo, Clock, HardDrive, Edit2, Trash2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button, Badge } from '@/components/ui';

interface VideoMetadata {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number; // in seconds
  fileSize: number; // in bytes
  format: string;
  status: 'pending' | 'uploading' | 'transcribing' | 'processing' | 'embedding' | 'completed' | 'failed';
  createdAt?: Date;
}

interface VideoPreviewProps {
  video: VideoMetadata;
  onUpdate?: (id: string, updates: Partial<VideoMetadata>) => void;
  onDelete?: (id: string) => void;
  isEditable?: boolean;
  className?: string;
}

export function VideoPreview({
  video,
  onUpdate,
  onDelete,
  isEditable = true,
  className,
}: VideoPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(video.title);
  const [editedDescription, setEditedDescription] = useState(video.description || '');

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  // Format duration (seconds to MM:SS)
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle save
  const handleSave = () => {
    if (onUpdate) {
      onUpdate(video.id, {
        title: editedTitle,
        description: editedDescription,
      });
    }
    setIsEditing(false);
  };

  // Handle cancel
  const handleCancel = () => {
    setEditedTitle(video.title);
    setEditedDescription(video.description || '');
    setIsEditing(false);
  };

  // Handle delete
  const handleDelete = () => {
    if (onDelete && confirm(`Are you sure you want to delete "${video.title}"?`)) {
      onDelete(video.id);
    }
  };

  // Status badge variant
  const getStatusVariant = (status: VideoMetadata['status']) => {
    switch (status) {
      case 'completed':
        return 'success' as const;
      case 'failed':
        return 'danger' as const;
      case 'pending':
      case 'uploading':
        return 'info' as const;
      case 'transcribing':
      case 'processing':
      case 'embedding':
        return 'warning' as const;
      default:
        return 'default' as const;
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border border-gray-6 bg-gray-1 overflow-hidden',
        'transition-all duration-200 hover:shadow-md',
        className
      )}
    >
      <div className="flex flex-col md:flex-row">
        {/* Thumbnail */}
        <div className="w-full md:w-48 h-32 bg-gray-3 flex-shrink-0 relative">
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <FileVideo className="h-12 w-12 text-gray-11" />
            </div>
          )}

          {/* Duration overlay */}
          {video.duration && (
            <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-1.5 py-0.5 rounded">
              {formatDuration(video.duration)}
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <Badge variant={getStatusVariant(video.status)} size="sm">
              {video.status}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4">
          {isEditing ? (
            // Edit mode
            <div className="space-y-3">
              <div>
                <label htmlFor={`title-${video.id}`} className="block text-sm font-medium text-gray-12 mb-1">
                  Title
                </label>
                <input
                  id={`title-${video.id}`}
                  type="text"
                  value={editedTitle}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setEditedTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-6 rounded-lg bg-gray-1 text-gray-12 focus:ring-2 focus:ring-purple-9 focus:border-transparent"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <label htmlFor={`description-${video.id}`} className="block text-sm font-medium text-gray-12 mb-1">
                  Description
                </label>
                <textarea
                  id={`description-${video.id}`}
                  value={editedDescription}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setEditedDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-6 rounded-lg bg-gray-1 text-gray-12 focus:ring-2 focus:ring-purple-9 focus:border-transparent resize-none"
                  placeholder="Enter video description (optional)"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSave}
                  icon={<Save className="h-4 w-4" />}
                >
                  Save
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  icon={<X className="h-4 w-4" />}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            // View mode
            <>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-12 truncate">
                    {video.title}
                  </h3>
                  {video.description && (
                    <p className="mt-1 text-sm text-gray-11 line-clamp-2">
                      {video.description}
                    </p>
                  )}
                </div>

                {isEditable && (
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="text-gray-11 hover:text-purple-11 transition-colors"
                      aria-label="Edit video"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={handleDelete}
                      className="text-gray-11 hover:text-red-11 transition-colors"
                      aria-label="Delete video"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Metadata */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-11">
                {video.duration && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                )}

                <div className="flex items-center gap-1">
                  <HardDrive className="h-3.5 w-3.5" />
                  <span>{formatFileSize(video.fileSize)}</span>
                </div>

                <div className="flex items-center gap-1">
                  <FileVideo className="h-3.5 w-3.5" />
                  <span className="uppercase">{video.format}</span>
                </div>

                {video.createdAt && (
                  <span className="text-gray-11">
                    {new Date(video.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
