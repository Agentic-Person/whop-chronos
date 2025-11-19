'use client';

/**
 * Video Debug Panel Component
 *
 * Comprehensive debug panel for viewing and managing stuck videos
 * Features:
 * - Real-time Inngest health monitoring
 * - Stuck videos table with diagnostic info
 * - Manual retry capabilities (single and bulk)
 * - System action buttons
 * - Responsive design
 */

import { useState, useEffect } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  Clock,
  FileText,
  Database,
  Play,
  Trash2,
} from 'lucide-react';
import { Button, Card } from 'frosted-ui';

interface StuckVideo {
  id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  processing_started_at: string | null;
  processing_completed_at: string | null;
  error_message: string | null;
  thumbnail_url: string | null;
  source_type: string;
  duration_seconds: number | null;
  stuck_duration_minutes: number;
  has_transcript: boolean;
  chunk_count: number;
  transcript_preview: string | null;
  creator_id: string;
}

interface InngestHealth {
  healthy: boolean;
  timestamp: string;
  message?: string;
}

interface VideoDebugPanelProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function VideoDebugPanel({
  autoRefresh = true,
  refreshInterval = 30000, // 30 seconds
}: VideoDebugPanelProps) {
  const [stuckVideos, setStuckVideos] = useState<StuckVideo[]>([]);
  const [inngestHealth, setInngestHealth] = useState<InngestHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'stuck_duration' | 'created_at'>('stuck_duration');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch stuck videos
  const fetchStuckVideos = async () => {
    try {
      const response = await fetch('/api/admin/stuck-videos');
      const data = await response.json();

      if (data.success) {
        setStuckVideos(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching stuck videos:', error);
    }
  };

  // Fetch Inngest health
  const fetchInngestHealth = async () => {
    try {
      const response = await fetch('/api/health/inngest');
      const data = await response.json();

      setInngestHealth({
        healthy: data.healthy,
        timestamp: data.timestamp,
        message: data.message,
      });
    } catch (error) {
      console.error('Error fetching Inngest health:', error);
      setInngestHealth({
        healthy: false,
        timestamp: new Date().toISOString(),
        message: 'Failed to connect to health endpoint',
      });
    }
  };

  // Refresh all data
  const refreshAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchStuckVideos(), fetchInngestHealth()]);
    setIsLoading(false);
  };

  // Retry single video
  const retryVideo = async (videoId: string) => {
    setIsRetrying(true);
    try {
      const response = await fetch(`/api/video/${videoId}/retry`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setLastAction(`Successfully retried: ${data.video.title}`);
        await fetchStuckVideos();
      } else {
        setLastAction(`Failed to retry: ${data.error}`);
      }
    } catch (error) {
      console.error('Error retrying video:', error);
      setLastAction('Error retrying video');
    } finally {
      setIsRetrying(false);
    }
  };

  // Retry all stuck videos
  const retryAllStuck = async () => {
    if (!confirm(`Are you sure you want to retry all ${stuckVideos.length} stuck videos?`)) {
      return;
    }

    setIsRetrying(true);
    try {
      const response = await fetch('/api/admin/retry-all-stuck', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setLastAction(
          `Processed ${data.totalProcessed} videos: ${data.successCount} successful, ${data.failureCount} failed`
        );
        await fetchStuckVideos();
      } else {
        setLastAction(`Failed to retry all: ${data.error}`);
      }
    } catch (error) {
      console.error('Error retrying all videos:', error);
      setLastAction('Error retrying all videos');
    } finally {
      setIsRetrying(false);
    }
  };

  // Initial load
  useEffect(() => {
    refreshAll();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshAll, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Filter videos
  const filteredVideos =
    filterStatus === 'all'
      ? stuckVideos
      : stuckVideos.filter((v) => v.status === filterStatus);

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    if (sortBy === 'stuck_duration') {
      return b.stuck_duration_minutes - a.stuck_duration_minutes;
    }
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Inngest Health Status */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-12">Inngest Health Status</h3>
        </div>
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {inngestHealth?.healthy ? (
                <CheckCircle2 className="h-6 w-6 text-green-11" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-11" />
              )}
              <div>
                <p className="font-medium text-gray-12">
                  {inngestHealth?.healthy ? 'Connected' : 'Disconnected'}
                </p>
                <p className="text-sm text-gray-11">
                  Last checked:{' '}
                  {inngestHealth?.timestamp
                    ? new Date(inngestHealth.timestamp).toLocaleTimeString()
                    : 'Never'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => window.open('http://localhost:8288', '_blank')}
              >
                Inngest Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={fetchInngestHealth}
              >
                Refresh
              </Button>
            </div>
          </div>

          {!inngestHealth?.healthy && (
            <div className="mt-4 rounded-lg bg-amber-3 border border-amber-a4 p-3">
              <p className="text-sm text-amber-12 font-medium">
                Inngest server is not running
              </p>
              <p className="text-sm text-amber-11 mt-1">
                Start Inngest: <code className="bg-amber-4 px-2 py-1 rounded">npx inngest-cli dev -u http://localhost:3007/api/inngest</code>
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Stuck Videos Table */}
      <Card>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-12">Stuck Videos ({filteredVideos.length})</h3>
              <p className="text-sm text-gray-11 mt-1">
                Videos stuck in processing for more than 10 minutes
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                className="px-3 py-2 text-sm rounded-lg border border-gray-a4 bg-gray-2 text-gray-12"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="transcribing">Transcribing</option>
                <option value="processing">Processing</option>
                <option value="embedding">Embedding</option>
              </select>

              <select
                className="px-3 py-2 text-sm rounded-lg border border-gray-a4 bg-gray-2 text-gray-12"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="stuck_duration">Stuck Duration</option>
                <option value="created_at">Created Date</option>
              </select>
            </div>
          </div>
        </div>
        <div>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-6 w-6 animate-spin text-purple-9" />
              <span className="ml-2 text-gray-11">Loading stuck videos...</span>
            </div>
          ) : sortedVideos.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-11 mx-auto mb-3" />
              <p className="text-gray-12 font-medium">No stuck videos found</p>
              <p className="text-sm text-gray-11 mt-1">All videos are processing normally</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-gray-a4">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-11">
                      Video
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-11">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-11">
                      Stuck Duration
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-11">
                      Transcript
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-11">
                      Chunks
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-11">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVideos.map((video) => (
                    <tr
                      key={video.id}
                      className="border-b border-gray-a3 hover:bg-gray-3 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-16 h-9 rounded object-cover"
                            />
                          ) : (
                            <div className="w-16 h-9 rounded bg-gray-4 flex items-center justify-center">
                              <Play className="h-4 w-4 text-gray-11" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-12 text-sm">
                              {video.title}
                            </p>
                            <p className="text-xs text-gray-11">
                              {video.source_type} •{' '}
                              {video.duration_seconds
                                ? `${Math.floor(video.duration_seconds / 60)}m`
                                : 'Unknown'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            video.status === 'pending'
                              ? 'bg-gray-3 text-gray-11'
                              : video.status === 'transcribing'
                                ? 'bg-blue-3 text-blue-11'
                                : video.status === 'processing'
                                  ? 'bg-purple-3 text-purple-11'
                                  : 'bg-amber-3 text-amber-11'
                          }`}
                        >
                          {video.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-red-11" />
                          <span className="text-gray-12 font-medium">
                            {formatDuration(video.stuck_duration_minutes)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          {video.has_transcript ? (
                            <CheckCircle2 className="h-4 w-4 text-green-11" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-red-11" />
                          )}
                          <FileText className="h-4 w-4 text-gray-11" />
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Database className="h-4 w-4 text-gray-11" />
                          <span className="text-sm text-gray-12">
                            {video.chunk_count}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<RefreshCw className="h-3 w-3" />}
                          onClick={() => retryVideo(video.id)}
                          disabled={isRetrying}
                        >
                          Retry
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* System Actions */}
      <Card>
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-12">System Actions</h3>
        </div>
        <div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={retryAllStuck}
                disabled={isRetrying || stuckVideos.length === 0}
              >
                Retry All Stuck Videos ({stuckVideos.length})
              </Button>

              <Button
                variant="outline"
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={refreshAll}
                disabled={isLoading}
              >
                Refresh Status
              </Button>

              <Button
                variant="outline"
                icon={<ExternalLink className="h-4 w-4" />}
                onClick={() => window.open('http://localhost:8288', '_blank')}
              >
                View Inngest Dashboard
              </Button>
            </div>

            {lastAction && (
              <div className="rounded-lg bg-blue-3 border border-blue-a4 p-3">
                <p className="text-sm text-blue-12">
                  <strong>Last Action:</strong> {lastAction}
                </p>
                <p className="text-xs text-blue-11 mt-1">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
