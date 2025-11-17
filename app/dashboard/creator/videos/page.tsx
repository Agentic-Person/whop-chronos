'use client';

/**
 * Video Management Dashboard
 *
 * Comprehensive video library management interface for creators
 * Features:
 * - Grid/List view toggle
 * - Filtering by status, source type, date range
 * - Search functionality
 * - Bulk operations (delete, reprocess)
 * - Processing monitor
 * - Responsive design (mobile, tablet, desktop)
 */

import { useState, useEffect } from 'react';
import { Plus, Video } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { VideoLibraryGrid } from '@/components/video/VideoLibraryGrid';
import { VideoFilters } from '@/components/video/VideoFilters';
import { BulkActions } from '@/components/video/BulkActions';
import { ProcessingMonitor } from '@/components/video/ProcessingMonitor';
import VideoSourceSelector from '@/components/video/VideoSourceSelector';
import { useAuth } from '@/lib/contexts/AuthContext';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

interface FilterState {
  status: string[];
  sourceType: string[];
  dateRange: { from: string | null; to: string | null };
  search: string;
}

export default function VideosPage() {
  const { creatorId } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    status: [],
    sourceType: [],
    dateRange: { from: null, to: null },
    search: '',
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalVideos, setTotalVideos] = useState(0);

  // Fetch videos
  const fetchVideos = async () => {
    if (!creatorId) {
      setError('Not authenticated');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        creatorId,
        page: page.toString(),
        limit: '12',
        sortBy: 'created_at',
        sortOrder: 'desc',
      });

      // Add status filters
      filters.status.forEach((status) => {
        params.append('status', status);
      });

      // Add source type filters
      filters.sourceType.forEach((sourceType) => {
        params.append('sourceType', sourceType);
      });

      // Add date range
      if (filters.dateRange.from) {
        params.set('dateFrom', filters.dateRange.from);
      }
      if (filters.dateRange.to) {
        params.set('dateTo', filters.dateRange.to);
      }

      // Add search
      if (filters.search) {
        params.set('search', filters.search);
      }

      const response = await fetch(`/api/video/list?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch videos');
      }

      setVideos(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalVideos(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch videos on mount and when filters/page change
  useEffect(() => {
    fetchVideos();
  }, [creatorId, filters, page]);

  // Handle video update
  const handleVideoUpdate = async (id: string, updates: Partial<Video>) => {
    try {
      const response = await fetch(`/api/video/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update video');
      }

      // Refresh videos
      await fetchVideos();
    } catch (err) {
      console.error('Error updating video:', err);
      alert('Failed to update video');
    }
  };

  // Handle video delete
  const handleVideoDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) {
      return;
    }

    try {
      const response = await fetch(`/api/video/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete video');
      }

      // Remove from selected if present
      setSelectedVideos((prev) => {
        const updated = new Set(prev);
        updated.delete(id);
        return updated;
      });

      // Refresh videos
      await fetchVideos();
    } catch (err) {
      console.error('Error deleting video:', err);
      alert('Failed to delete video');
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedVideos.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedVideos.size} video(s)?`)) {
      return;
    }

    try {
      const deletePromises = Array.from(selectedVideos).map((id) =>
        fetch(`/api/video/${id}`, { method: 'DELETE' })
      );

      await Promise.all(deletePromises);

      setSelectedVideos(new Set());
      await fetchVideos();
    } catch (err) {
      console.error('Error deleting videos:', err);
      alert('Failed to delete some videos');
    }
  };

  // Handle bulk reprocess
  const handleBulkReprocess = async () => {
    if (selectedVideos.size === 0) return;

    try {
      const reprocessPromises = Array.from(selectedVideos).map((id) =>
        fetch(`/api/video/${id}/confirm`, { method: 'POST' })
      );

      await Promise.all(reprocessPromises);

      setSelectedVideos(new Set());
      await fetchVideos();
    } catch (err) {
      console.error('Error reprocessing videos:', err);
      alert('Failed to reprocess some videos');
    }
  };

  // Handle selection toggle
  const handleSelectionToggle = (id: string) => {
    setSelectedVideos((prev) => {
      const updated = new Set(prev);
      if (updated.has(id)) {
        updated.delete(id);
      } else {
        updated.add(id);
      }
      return updated;
    });
  };

  // Handle select all toggle
  const handleSelectAllToggle = () => {
    if (selectedVideos.size === videos.length) {
      setSelectedVideos(new Set());
    } else {
      setSelectedVideos(new Set(videos.map((v) => v.id)));
    }
  };

  // Get processing videos count
  const processingCount = videos.filter((v) =>
    ['pending', 'uploading', 'transcribing', 'processing', 'embedding'].includes(v.status)
  ).length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-12">Video Library</h1>
            <p className="mt-1 text-gray-11">
              Manage your video content and processing status
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setShowUploadModal(true)}
          >
            Add Video
          </Button>
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-12">{totalVideos}</div>
              <div className="text-sm text-gray-11">Total Videos</div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-11">
                {videos.filter((v) => v.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-11">Completed</div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-11">{processingCount}</div>
              <div className="text-sm text-gray-11">Processing</div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-11">
                {videos.filter((v) => v.status === 'failed').length}
              </div>
              <div className="text-sm text-gray-11">Failed</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Processing Monitor (if any videos processing) */}
      {processingCount > 0 && creatorId && (
        <div className="mb-8">
          <ProcessingMonitor
            creatorId={creatorId}
            supabaseUrl={process.env['NEXT_PUBLIC_SUPABASE_URL'] || ''}
            supabaseAnonKey={process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || ''}
            initialVideos={videos
              .filter((v) =>
                ['pending', 'uploading', 'transcribing', 'processing', 'embedding'].includes(
                  v.status
                )
              )
              .map((v) => ({
                id: v.id,
                title: v.title,
                status: v.status,
                progress: calculateProgress(v.status),
                errorMessage: v.error_message,
                estimatedTimeRemaining: null,
                createdAt: v.created_at,
                updatedAt: v.updated_at,
              }))}
            autoRefresh={true}
            refreshInterval={5000}
          />
        </div>
      )}

      {/* Filters */}
      <div className="mb-6">
        <VideoFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Bulk Actions */}
      {selectedVideos.size > 0 && (
        <div className="mb-6">
          <BulkActions
            selectedCount={selectedVideos.size}
            onDelete={handleBulkDelete}
            onReprocess={handleBulkReprocess}
            onClearSelection={() => setSelectedVideos(new Set())}
          />
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="mb-6 bg-red-2 border-red-a4">
          <div className="flex items-center gap-3">
            <div className="text-red-11">
              <svg
                className="h-5 w-5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-12">Error loading videos</p>
              <p className="text-sm text-red-11">{error}</p>
            </div>
            <Button variant="outline" size="sm" onClick={fetchVideos}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && videos.length === 0 && !error && (
        <Card className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-3 mb-4">
            <Video className="h-8 w-8 text-purple-11" />
          </div>
          <h3 className="text-lg font-semibold text-gray-12 mb-2">No videos yet</h3>
          <p className="text-gray-11 mb-6">
            {filters.search || filters.status.length > 0
              ? 'No videos match your current filters'
              : 'Upload your first video to get started with your learning platform'}
          </p>
          <Button
            variant="primary"
            icon={<Plus className="h-5 w-5" />}
            onClick={() => setShowUploadModal(true)}
          >
            Add Your First Video
          </Button>
        </Card>
      )}

      {/* Video Grid */}
      {!isLoading && videos.length > 0 && (
        <>
          <VideoLibraryGrid
            videos={videos}
            selectedVideos={selectedVideos}
            onSelectionToggle={handleSelectionToggle}
            onSelectAllToggle={handleSelectAllToggle}
            onVideoUpdate={handleVideoUpdate}
            onVideoDelete={handleVideoDelete}
          />

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <p className="text-sm text-gray-11">
                Showing page {page} of {totalPages} ({totalVideos} total videos)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-9 border-r-transparent"></div>
            <p className="mt-4 text-gray-11">Loading videos...</p>
          </div>
        </div>
      )}

      {/* Video Upload Modal */}
      {showUploadModal && creatorId && (
        <VideoSourceSelector
          creatorId={creatorId}
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          onVideoImported={() => {
            setShowUploadModal(false);
            fetchVideos(); // Refresh video list
          }}
        />
      )}
    </div>
  );
}

// Helper function to calculate progress percentage
function calculateProgress(status: Video['status']): number {
  const progressMap: Record<Video['status'], number> = {
    pending: 0,
    uploading: 10,
    transcribing: 30,
    processing: 50,
    embedding: 70,
    completed: 100,
    failed: 0,
  };
  return progressMap[status] || 0;
}
