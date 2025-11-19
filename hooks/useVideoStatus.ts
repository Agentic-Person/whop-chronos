/**
 * useVideoStatus Hook
 *
 * Real-time video processing status polling with timeout detection
 *
 * Features:
 * - Automatic polling every 5 seconds during processing
 * - Stops when status becomes 'completed' or 'failed'
 * - Timeout detection (15 minutes)
 * - Retry processing functionality
 * - Error handling with user-friendly messages
 *
 * Usage:
 * ```tsx
 * const { status, progress, error, isTimeout, retryProcessing } = useVideoStatus(
 *   videoId,
 *   initialStatus
 * );
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Database } from '@/lib/db/types';

type VideoStatus = Database['public']['Tables']['videos']['Row']['status'];

interface VideoStatusData {
  videoId: string;
  status: VideoStatus;
  progress: number;
  currentStage: {
    name: string;
    description: string;
    retryable: boolean;
    timeoutMinutes: number;
  };
  timestamps: {
    createdAt: string;
    updatedAt: string;
    processingStartedAt: string | null;
    processingCompletedAt: string | null;
  };
  duration: {
    totalSeconds: number | null;
    estimatedRemainingMinutes: number | null;
  };
  error: {
    message: string | null;
    stage: string | null;
    timestamp: string | null;
    retryCount: number;
  } | null;
  metadata: {
    fileSize: number | null;
    durationSeconds: number | null;
    transcriptLanguage: string | null;
    chunkCount: number | null;
  };
  isTerminal: boolean;
  nextSteps: string[];
}

interface UseVideoStatusReturn {
  status: VideoStatus;
  progress: number;
  statusData: VideoStatusData | null;
  error: string | null;
  isTimeout: boolean;
  isPolling: boolean;
  retryProcessing: () => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const POLL_INTERVAL = 5000; // 5 seconds
const TIMEOUT_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
const PROCESSING_STATUSES: VideoStatus[] = [
  'pending',
  'uploading',
  'transcribing',
  'processing',
  'embedding',
];

/**
 * Check if status indicates active processing
 */
function isProcessingStatus(status: VideoStatus): boolean {
  return PROCESSING_STATUSES.includes(status);
}

/**
 * Check if processing has timed out
 */
function hasTimedOut(startTime: string | null): boolean {
  if (!startTime) return false;

  const start = new Date(startTime).getTime();
  const now = Date.now();
  const elapsed = now - start;

  return elapsed > TIMEOUT_THRESHOLD;
}

/**
 * Hook to manage video processing status
 */
export function useVideoStatus(
  videoId: string,
  initialStatus: VideoStatus = 'pending'
): UseVideoStatusReturn {
  const [status, setStatus] = useState<VideoStatus>(initialStatus);
  const [statusData, setStatusData] = useState<VideoStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const [isPolling, setIsPolling] = useState(isProcessingStatus(initialStatus));

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Fetch current video status
   */
  const fetchStatus = useCallback(async (): Promise<VideoStatusData | null> => {
    try {
      const response = await fetch(`/api/video/${videoId}/status`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch video status');
      }

      const data: VideoStatusData = await response.json();
      return data;
    } catch (err) {
      console.error('[useVideoStatus] Error fetching status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
      return null;
    }
  }, [videoId]);

  /**
   * Update status from API response
   */
  const updateStatus = useCallback((data: VideoStatusData) => {
    if (!isMountedRef.current) return;

    setStatusData(data);
    setStatus(data.status);
    setError(data.error?.message || null);

    // Check for timeout
    if (
      isProcessingStatus(data.status) &&
      hasTimedOut(data.timestamps.processingStartedAt)
    ) {
      setIsTimeout(true);
    }

    // Stop polling if terminal state
    if (data.isTerminal) {
      setIsPolling(false);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, []);

  /**
   * Refresh status (manual refresh)
   */
  const refreshStatus = useCallback(async () => {
    const data = await fetchStatus();
    if (data) {
      updateStatus(data);
    }
  }, [fetchStatus, updateStatus]);

  /**
   * Retry processing for failed videos
   */
  const retryProcessing = useCallback(async () => {
    try {
      setError(null);
      setIsTimeout(false);

      const response = await fetch(`/api/video/${videoId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to retry processing');
      }

      // Start polling again
      setIsPolling(true);

      // Immediately fetch status
      await refreshStatus();
    } catch (err) {
      console.error('[useVideoStatus] Error retrying processing:', err);
      setError(err instanceof Error ? err.message : 'Failed to retry processing');
    }
  }, [videoId, refreshStatus]);

  /**
   * Set up polling interval
   */
  useEffect(() => {
    // Initial fetch
    refreshStatus();

    // Start polling if processing
    if (isPolling && isProcessingStatus(status)) {
      pollIntervalRef.current = setInterval(async () => {
        const data = await fetchStatus();
        if (data) {
          updateStatus(data);
        }
      }, POLL_INTERVAL);
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [isPolling, status, fetchStatus, updateStatus, refreshStatus]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return {
    status,
    progress: statusData?.progress || 0,
    statusData,
    error,
    isTimeout,
    isPolling,
    retryProcessing,
    refreshStatus,
  };
}

/**
 * Get user-friendly error message
 */
export function getErrorMessage(error: string | null, isTimeout: boolean): string {
  if (isTimeout) {
    return 'Processing is taking longer than expected. The video may be stuck. Please check that the Inngest Dev Server is running.';
  }

  if (!error) return '';

  // Map common errors to user-friendly messages
  const errorMap: Record<string, string> = {
    'transcription failed': 'Failed to extract transcript from video. Please try again.',
    'embedding failed': 'Failed to generate AI embeddings. Please retry processing.',
    'timeout': 'Processing timed out. Please check the video and try again.',
    'inngest': 'Background processing service unavailable. Please ensure Inngest Dev Server is running.',
  };

  const lowerError = error.toLowerCase();

  for (const [key, message] of Object.entries(errorMap)) {
    if (lowerError.includes(key)) {
      return message;
    }
  }

  return error;
}

/**
 * Format time remaining
 */
export function formatTimeRemaining(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return 'Calculating...';

  if (minutes < 1) return 'Less than 1 minute';
  if (minutes < 60) return `~${Math.round(minutes)} minutes`;

  const hours = Math.floor(minutes / 60);
  const remainingMins = Math.round(minutes % 60);

  if (remainingMins === 0) return `~${hours} hours`;
  return `~${hours}h ${remainingMins}m`;
}
