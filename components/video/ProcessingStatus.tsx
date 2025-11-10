'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Circle, Loader2, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/db/client-browser';
import type { Database } from '@/lib/db/types';

type VideoStatus = Database['public']['Tables']['videos']['Row']['status'];

interface ProcessingStage {
  name: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  description: string;
}

interface ProcessingStatusProps {
  videoId: string;
  currentStatus: VideoStatus;
  errorMessage?: string | null;
  onStatusChange?: (status: VideoStatus) => void;
  className?: string;
}

export function ProcessingStatus({
  videoId,
  currentStatus,
  errorMessage,
  onStatusChange,
  className,
}: ProcessingStatusProps) {
  const [status, setStatus] = useState<VideoStatus>(currentStatus);
  const [error, setError] = useState<string | null>(errorMessage || null);

  // Define processing pipeline stages
  const getStages = (currentStatus: VideoStatus): ProcessingStage[] => {
    const stages = [
      {
        name: 'Upload',
        status: 'completed' as const,
        description: 'Video file uploaded successfully',
      },
      {
        name: 'Transcription',
        status: currentStatus === 'pending' || currentStatus === 'uploading'
          ? 'pending' as const
          : currentStatus === 'transcribing'
          ? 'active' as const
          : currentStatus === 'failed'
          ? 'failed' as const
          : 'completed' as const,
        description: 'Extracting audio and generating transcript',
      },
      {
        name: 'Processing',
        status: ['pending', 'uploading', 'transcribing'].includes(currentStatus)
          ? 'pending' as const
          : currentStatus === 'processing'
          ? 'active' as const
          : currentStatus === 'failed'
          ? 'failed' as const
          : 'completed' as const,
        description: 'Chunking transcript into segments',
      },
      {
        name: 'Embedding',
        status: ['pending', 'uploading', 'transcribing', 'processing'].includes(currentStatus)
          ? 'pending' as const
          : currentStatus === 'embedding'
          ? 'active' as const
          : currentStatus === 'failed'
          ? 'failed' as const
          : 'completed' as const,
        description: 'Generating vector embeddings',
      },
      {
        name: 'Completed',
        status: currentStatus === 'completed'
          ? 'completed' as const
          : currentStatus === 'failed'
          ? 'failed' as const
          : 'pending' as const,
        description: 'Video ready for AI chat',
      },
    ];

    return stages;
  };

  const [stages, setStages] = useState<ProcessingStage[]>(getStages(currentStatus));

  // Subscribe to video status changes via Supabase Realtime
  useEffect(() => {
    const channel = supabase
      .channel(`video-${videoId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'videos',
          filter: `id=eq.${videoId}`,
        },
        (payload) => {
          const newStatus = payload.new.status as VideoStatus;
          const newError = payload.new.error_message as string | null;

          setStatus(newStatus);
          setError(newError);
          setStages(getStages(newStatus));

          if (onStatusChange) {
            onStatusChange(newStatus);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [videoId, onStatusChange]);

  // Sync stages when props change
  useEffect(() => {
    setStatus(currentStatus);
    setError(errorMessage || null);
    setStages(getStages(currentStatus));
  }, [currentStatus, errorMessage]);

  // Get icon for stage status
  const getStageIcon = (stageStatus: ProcessingStage['status']) => {
    switch (stageStatus) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'active':
        return <Loader2 className="h-5 w-5 text-purple-600 animate-spin" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'pending':
      default:
        return <Circle className="h-5 w-5 text-gray-300 dark:text-gray-700" />;
    }
  };

  const currentStageIndex = stages.findIndex((s) => s.status === 'active');
  const progressPercentage = status === 'completed'
    ? 100
    : status === 'failed'
    ? 0
    : Math.round(((currentStageIndex + 1) / stages.length) * 100);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Overall Status Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Processing Pipeline
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {status === 'completed'
              ? 'All stages completed successfully'
              : status === 'failed'
              ? 'Processing failed'
              : `Stage ${currentStageIndex + 1} of ${stages.length}`}
          </p>
        </div>
        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {progressPercentage}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
        <div
          className={cn(
            'h-3 rounded-full transition-all duration-500',
            status === 'failed'
              ? 'bg-red-500'
              : 'bg-gradient-to-r from-purple-600 to-blue-600'
          )}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Error Message */}
      {error && status === 'failed' && (
        <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-100">
                Processing Failed
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Stages */}
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage.name} className="flex items-start gap-4">
            {/* Stage Icon */}
            <div className="flex-shrink-0 mt-1">{getStageIcon(stage.status)}</div>

            {/* Stage Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <h4
                  className={cn(
                    'text-sm font-medium',
                    stage.status === 'completed'
                      ? 'text-green-700 dark:text-green-400'
                      : stage.status === 'active'
                      ? 'text-purple-700 dark:text-purple-400'
                      : stage.status === 'failed'
                      ? 'text-red-700 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-500'
                  )}
                >
                  {stage.name}
                </h4>
                {stage.status === 'active' && (
                  <span className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                    In Progress...
                  </span>
                )}
                {stage.status === 'completed' && (
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Complete
                  </span>
                )}
              </div>
              <p
                className={cn(
                  'text-xs',
                  stage.status === 'pending'
                    ? 'text-gray-400 dark:text-gray-600'
                    : 'text-gray-600 dark:text-gray-400'
                )}
              >
                {stage.description}
              </p>
            </div>

            {/* Connecting Line */}
            {index < stages.length - 1 && (
              <div
                className={cn(
                  'absolute left-[10px] w-0.5 h-8 -mb-8 mt-7',
                  stage.status === 'completed'
                    ? 'bg-green-500'
                    : 'bg-gray-300 dark:bg-gray-700'
                )}
                style={{ marginLeft: '10px' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Completion Message */}
      {status === 'completed' && (
        <div className="rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-green-900 dark:text-green-100">
                Processing Complete
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Your video is ready! Students can now chat with this content using AI.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
