'use client';

/**
 * Processing Monitor Component
 *
 * Real-time dashboard showing all processing videos with live updates
 */

import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useVideoProcessingSubscription } from '@/lib/video/realtime';
import type { VideoUpdateEvent, ProcessingStatsEvent } from '@/lib/video/realtime';
import type { Database } from '@/lib/db/types';

type VideoRow = Database['public']['Tables']['videos']['Row'];
type VideoStatus = VideoRow['status'];

// =====================================================
// TYPES
// =====================================================

interface ProcessingVideo {
  id: string;
  title: string;
  status: VideoStatus;
  progress: number;
  errorMessage: string | null;
  estimatedTimeRemaining: number | null;
  createdAt: string;
  updatedAt: string;
}

interface ProcessingMonitorProps {
  creatorId?: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  initialVideos?: ProcessingVideo[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// =====================================================
// STATUS BADGES
// =====================================================

const StatusBadge = ({ status }: { status: VideoStatus }) => {
  const variants: Record<VideoStatus, 'default' | 'success' | 'warning' | 'error'> = {
    pending: 'default',
    uploading: 'warning',
    transcribing: 'warning',
    processing: 'warning',
    embedding: 'warning',
    completed: 'success',
    failed: 'error',
  };

  const labels: Record<VideoStatus, string> = {
    pending: 'Pending',
    uploading: 'Uploading',
    transcribing: 'Transcribing',
    processing: 'Processing',
    embedding: 'Embedding',
    completed: 'Completed',
    failed: 'Failed',
  };

  return (
    <Badge variant={variants[status]}>
      {labels[status]}
    </Badge>
  );
};

// =====================================================
// PROGRESS BAR
// =====================================================

const ProgressBar = ({ progress, status }: { progress: number; status: VideoStatus }) => {
  const colors: Record<VideoStatus, string> = {
    pending: 'bg-gray-500',
    uploading: 'bg-blue-500',
    transcribing: 'bg-purple-500',
    processing: 'bg-indigo-500',
    embedding: 'bg-violet-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500',
  };

  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
      <div
        className={`h-2.5 ${colors[status]} transition-all duration-500 ease-out`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
};

// =====================================================
// PIPELINE VISUALIZATION
// =====================================================

const PipelineStage = ({
  name,
  isActive,
  isCompleted,
  isFailed
}: {
  name: string;
  isActive: boolean;
  isCompleted: boolean;
  isFailed: boolean;
}) => {
  let className = 'flex items-center justify-center w-24 h-10 rounded-lg border-2 text-sm font-medium ';

  if (isFailed) {
    className += 'border-red-500 bg-red-100 text-red-700';
  } else if (isCompleted) {
    className += 'border-green-500 bg-green-100 text-green-700';
  } else if (isActive) {
    className += 'border-blue-500 bg-blue-100 text-blue-700 animate-pulse';
  } else {
    className += 'border-gray-300 bg-gray-100 text-gray-500';
  }

  return (
    <div className={className}>
      {name}
    </div>
  );
};

const ProcessingPipeline = ({ status }: { status: VideoStatus }) => {
  const stages: VideoStatus[] = ['pending', 'uploading', 'transcribing', 'processing', 'embedding', 'completed'];
  const currentIndex = stages.indexOf(status);
  const isFailed = status === 'failed';

  return (
    <div className="flex items-center gap-2">
      {stages.map((stage, index) => (
        <div key={stage} className="flex items-center">
          <PipelineStage
            name={stage.charAt(0).toUpperCase() + stage.slice(1)}
            isActive={index === currentIndex && !isFailed}
            isCompleted={index < currentIndex && !isFailed}
            isFailed={isFailed && index === currentIndex}
          />
          {index < stages.length - 1 && (
            <div className="w-4 h-0.5 bg-gray-300" />
          )}
        </div>
      ))}
    </div>
  );
};

// =====================================================
// VIDEO PROCESSING CARD
// =====================================================

const VideoProcessingCard = ({ video }: { video: ProcessingVideo }) => {
  const formatTimeRemaining = (minutes: number | null) => {
    if (!minutes) return 'Calculating...';
    if (minutes < 1) return 'Less than 1 min';
    if (minutes < 60) return `~${Math.round(minutes)} min`;
    const hours = Math.floor(minutes / 60);
    return `~${hours}h ${Math.round(minutes % 60)}m`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {video.title}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Updated {formatTimestamp(video.updatedAt)}
            </p>
          </div>
          <StatusBadge status={video.status} />
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">{video.progress}%</span>
          </div>
          <ProgressBar progress={video.progress} status={video.status} />
        </div>

        {/* Pipeline Visualization */}
        <div className="overflow-x-auto">
          <ProcessingPipeline status={video.status} />
        </div>

        {/* Time Remaining */}
        {video.estimatedTimeRemaining !== null && video.status !== 'completed' && video.status !== 'failed' && (
          <div className="text-sm text-gray-600">
            Est. time remaining: {formatTimeRemaining(video.estimatedTimeRemaining)}
          </div>
        )}

        {/* Error Message */}
        {video.errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">Error</p>
            <p className="text-sm text-red-600 mt-1">{video.errorMessage}</p>
          </div>
        )}
      </div>
    </Card>
  );
};

// =====================================================
// STATS DASHBOARD
// =====================================================

const StatCard = ({ label, value, color }: { label: string; value: number; color: string }) => (
  <div className="p-4 bg-white rounded-lg border border-gray-200">
    <p className="text-sm text-gray-600">{label}</p>
    <p className={`text-2xl font-bold ${color} mt-1`}>{value}</p>
  </div>
);

// =====================================================
// MAIN COMPONENT
// =====================================================

export function ProcessingMonitor({
  creatorId,
  supabaseUrl,
  supabaseAnonKey,
  initialVideos = [],
  autoRefresh = true,
  refreshInterval = 5000,
}: ProcessingMonitorProps) {
  const [videos, setVideos] = useState<Map<string, ProcessingVideo>>(
    new Map(initialVideos.map(v => [v.id, v]))
  );
  const [stats, setStats] = useState<ProcessingStatsEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize real-time subscription
  const subscription = useVideoProcessingSubscription(
    supabaseUrl,
    supabaseAnonKey,
    creatorId
  );

  // Handle video updates
  const handleVideoUpdate = useCallback((event: VideoUpdateEvent) => {
    setVideos(prev => {
      const updated = new Map(prev);
      const existing = updated.get(event.videoId);

      updated.set(event.videoId, {
        id: event.videoId,
        title: existing?.title || 'Unknown Video',
        status: event.status,
        progress: event.progress,
        errorMessage: event.errorMessage,
        estimatedTimeRemaining: event.metadata.estimated_time_remaining || null,
        createdAt: existing?.createdAt || event.timestamp,
        updatedAt: event.timestamp,
      });

      return updated;
    });
  }, []);

  // Handle stats updates
  const handleStatsUpdate = useCallback((newStats: ProcessingStatsEvent) => {
    setStats(newStats);
  }, []);

  // Handle errors
  const handleError = useCallback((err: Error) => {
    console.error('[ProcessingMonitor] Error:', err);
    setError(err.message);
    setIsConnected(false);
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const sub = subscription
      .onStatsUpdate(handleStatsUpdate)
      .onError(handleError)
      .subscribe();

    setIsConnected(true);

    // Subscribe to all videos
    videos.forEach((_, videoId) => {
      subscription.onVideoUpdate(videoId, handleVideoUpdate);
    });

    return () => {
      sub.unsubscribe();
      setIsConnected(false);
    };
  }, [autoRefresh, subscription, videos, handleStatsUpdate, handleError, handleVideoUpdate]);

  // Polling fallback for non-real-time updates
  useEffect(() => {
    if (!autoRefresh || isConnected) return;

    const interval = setInterval(async () => {
      // Fetch latest video statuses
      try {
        const response = await fetch(`/api/video/processing?creatorId=${creatorId || ''}`);
        const data = await response.json();

        if (data.videos) {
          setVideos(new Map(data.videos.map((v: ProcessingVideo) => [v.id, v])));
        }
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error('[ProcessingMonitor] Polling error:', err);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, isConnected, refreshInterval, creatorId]);

  const videoList = Array.from(videos.values()).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Processing Monitor</h2>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
          <span className="text-sm text-gray-600">
            {isConnected ? 'Live Updates' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700 font-medium">Connection Error</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="mt-2"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Statistics Dashboard */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <StatCard label="Total" value={stats.total} color="text-gray-900" />
          <StatCard label="Pending" value={stats.pending} color="text-gray-600" />
          <StatCard label="Uploading" value={stats.uploading} color="text-blue-600" />
          <StatCard label="Transcribing" value={stats.transcribing} color="text-purple-600" />
          <StatCard label="Processing" value={stats.processing} color="text-indigo-600" />
          <StatCard label="Completed" value={stats.completed} color="text-green-600" />
          <StatCard label="Failed" value={stats.failed} color="text-red-600" />
        </div>
      )}

      {/* Video List */}
      <div className="space-y-4">
        {videoList.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No videos in processing queue</p>
          </Card>
        ) : (
          videoList.map(video => (
            <VideoProcessingCard key={video.id} video={video} />
          ))
        )}
      </div>
    </div>
  );
}

export default ProcessingMonitor;
