'use client';

/**
 * Video Detail Modal Component
 *
 * Full-screen modal for viewing video details
 * Features:
 * - Video player preview
 * - Full metadata display
 * - Transcript viewer (scrollable, searchable)
 * - Processing status timeline
 * - Edit metadata inline
 * - Analytics preview
 */

import { useState, useEffect } from 'react';
import {
  X,
  Clock,
  FileVideo,
  Calendar,
  HardDrive,
  Search,
  Edit2,
  Save,
  AlertCircle,
  CheckCircle,
  Youtube,
  Video as VideoIcon,
  Radio,
} from 'lucide-react';
import { Button, Card } from 'frosted-ui';
import { Badge } from '@/components/ui/Badge';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

interface VideoDetailModalProps {
  video: Video;
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<Video>) => void;
  onDelete?: (id: string) => void;
}

export function VideoDetailModal({
  video,
  onClose,
  onUpdate,
  onDelete,
}: VideoDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(video.title);
  const [editedDescription, setEditedDescription] = useState(video.description || '');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [highlightedTranscript, setHighlightedTranscript] = useState(video.transcript || '');

  // Format file size
  const formatFileSize = (bytes: number | null): string => {
    if (!bytes) return 'Unknown';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  // Format duration
  const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
        return <Youtube className="h-5 w-5 text-red-600" />;
      case 'loom':
        return <Radio className="h-5 w-5 text-purple-600" />;
      case 'mux':
        return <VideoIcon className="h-5 w-5 text-blue-600" />;
      case 'upload':
        return <FileVideo className="h-5 w-5 text-gray-11" />;
      default:
        return <FileVideo className="h-5 w-5 text-gray-11" />;
    }
  };

  // Handle save
  const handleSave = () => {
    onUpdate?.(video.id, {
      title: editedTitle,
      description: editedDescription,
    });
    setIsEditing(false);
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditedTitle(video.title);
    setEditedDescription(video.description || '');
    setIsEditing(false);
  };

  // Highlight transcript search
  useEffect(() => {
    if (!video.transcript) return;

    if (!transcriptSearch) {
      setHighlightedTranscript(video.transcript);
      return;
    }

    const regex = new RegExp(`(${transcriptSearch})`, 'gi');
    const highlighted = video.transcript.replace(
      regex,
      '<mark class="bg-yellow-200 text-gray-12">$1</mark>'
    );
    setHighlightedTranscript(highlighted);
  }, [transcriptSearch, video.transcript]);

  // Close on ESC key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEsc);

    // ✅ Cleanup function - removes event listener when component unmounts
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-gray-2 rounded-lg shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-6">
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-2xl font-bold text-gray-12 bg-transparent border-b-2 border-purple-9 focus:outline-none"
                placeholder="Video title"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-12 truncate">{video.title}</h2>
            )}
            <div className="mt-2 flex items-center gap-3">
              <Badge variant={getStatusVariant(video.status)}>{video.status}</Badge>
              <div className="flex items-center gap-1 text-sm text-gray-11">
                {getSourceIcon(video.source_type)}
                <span className="capitalize">{video.source_type}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {isEditing ? (
              <>
                <Button variant="primary" size="sm" icon={<Save className="h-4 w-4" />} onClick={handleSave}>
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" icon={<Edit2 className="h-4 w-4" />} onClick={() => setIsEditing(true)}>
                Edit
              </Button>
            )}
            <button
              onClick={onClose}
              className="text-gray-11 hover:text-gray-12 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Video Player Placeholder */}
          <Card>
            <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
              {video.thumbnail_url ? (
                <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover rounded-lg" />
              ) : (
                <FileVideo className="h-20 w-20 text-gray-11" />
              )}
            </div>
          </Card>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card padding="sm">
              <div className="flex items-center gap-2 text-gray-11">
                <Clock className="h-4 w-4" />
                <div>
                  <p className="text-xs text-gray-500">Duration</p>
                  <p className="font-semibold text-gray-12">{formatDuration(video.duration_seconds)}</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-2 text-gray-11">
                <HardDrive className="h-4 w-4" />
                <div>
                  <p className="text-xs text-gray-500">File Size</p>
                  <p className="font-semibold text-gray-12">{formatFileSize(video.file_size_bytes)}</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-2 text-gray-11">
                <Calendar className="h-4 w-4" />
                <div>
                  <p className="text-xs text-gray-500">Created</p>
                  <p className="font-semibold text-gray-12">{new Date(video.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </Card>
            <Card padding="sm">
              <div className="flex items-center gap-2 text-gray-11">
                <FileVideo className="h-4 w-4" />
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="font-semibold text-gray-12 capitalize">{video.source_type}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Description */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-12 mb-3">Description</h3>
            {isEditing ? (
              <textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                placeholder="Enter video description..."
              />
            ) : (
              <p className="text-gray-11">{video.description || 'No description provided'}</p>
            )}
          </Card>

          {/* Processing Status */}
          {video.status !== 'completed' && (
            <Card className="bg-yellow-50 border-yellow-200">
              <div className="flex items-start gap-3">
                {video.status === 'failed' ? (
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="h-5 w-5 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-12 mb-1">Processing Status</h3>
                  <p className="text-sm text-gray-12 mb-2">
                    {video.status === 'failed'
                      ? 'Processing failed'
                      : `Currently ${video.status}...`}
                  </p>
                  {video.error_message && (
                    <p className="text-sm text-red-700 bg-red-100 px-3 py-2 rounded-lg">{video.error_message}</p>
                  )}
                  {video.processing_started_at && (
                    <p className="text-xs text-gray-11 mt-2">
                      Started: {formatDate(video.processing_started_at)}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Transcript Viewer */}
          {video.transcript && (
            <Card>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-12">Transcript</h3>
                  <div className="flex items-center gap-2">
                    {video.transcript_language && (
                      <Badge variant="info" size="sm">
                        {video.transcript_language.toUpperCase()}
                      </Badge>
                    )}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search transcript..."
                        value={transcriptSearch}
                        onChange={(e) => setTranscriptSearch(e.target.value)}
                        className="pl-9 pr-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div
                  className="max-h-96 overflow-y-auto bg-gray-1 rounded-lg p-4 text-sm text-gray-12 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightedTranscript }}
                />
              </div>
            </Card>
          )}

          {/* Processing Timeline */}
          {video.status === 'completed' && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-12 mb-4">Processing Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-12">Video Uploaded</p>
                    <p className="text-sm text-gray-11">{formatDate(video.created_at)}</p>
                  </div>
                </div>
                {video.processing_started_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-12">Processing Started</p>
                      <p className="text-sm text-gray-11">{formatDate(video.processing_started_at)}</p>
                    </div>
                  </div>
                )}
                {video.processing_completed_at && (
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-12">Processing Completed</p>
                      <p className="text-sm text-gray-11">{formatDate(video.processing_completed_at)}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-6 bg-gray-1">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="danger"
            icon={<X className="h-4 w-4" />}
            onClick={() => {
              if (confirm(`Are you sure you want to delete "${video.title}"?`)) {
                onDelete?.(video.id);
                onClose();
              }
            }}
          >
            Delete Video
          </Button>
        </div>
      </div>
    </div>
  );
}
