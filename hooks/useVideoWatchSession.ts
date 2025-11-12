/**
 * useVideoWatchSession Hook
 *
 * Manages video watch sessions for analytics tracking
 *
 * Features:
 * - Creates watch session on mount
 * - Updates progress during playback
 * - Ends session on unmount
 * - Handles network errors gracefully
 * - Tracks device type and referrer
 *
 * Usage:
 * ```tsx
 * const { sessionId, trackProgress, endSession } = useVideoWatchSession(
 *   videoId,
 *   studentId,
 *   creatorId,
 *   { deviceType: 'desktop', referrerType: 'course_page' }
 * );
 * ```
 */

import { useState, useEffect, useRef } from 'react';

interface WatchSessionOptions {
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  referrerType?: 'course_page' | 'direct_link' | 'search' | 'chat_reference';
}

interface UseVideoWatchSessionReturn {
  sessionId: string | null;
  isLoading: boolean;
  error: string | null;
  trackProgress: (percentComplete: number, watchTimeSeconds: number) => Promise<void>;
  endSession: () => Promise<void>;
}

/**
 * Detect device type from user agent
 */
function detectDeviceType(): 'desktop' | 'mobile' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';

  const userAgent = navigator.userAgent.toLowerCase();

  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(userAgent)) {
    return 'tablet';
  }

  if (/mobile|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent)) {
    return 'mobile';
  }

  return 'desktop';
}

/**
 * Hook to manage video watch session
 */
export function useVideoWatchSession(
  videoId: string,
  studentId: string,
  creatorId: string,
  options: WatchSessionOptions = {},
): UseVideoWatchSessionReturn {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasEndedRef = useRef(false);
  const sessionStartTimeRef = useRef<number>(0);

  const deviceType = options.deviceType || detectDeviceType();
  const referrerType = options.referrerType || 'direct_link';

  /**
   * Create watch session on mount
   */
  useEffect(() => {
    let mounted = true;

    async function createSession() {
      try {
        const response = await fetch('/api/analytics/watch-sessions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_id: videoId,
            student_id: studentId,
            creator_id: creatorId,
            device_type: deviceType,
            referrer_type: referrerType,
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to create watch session: ${response.statusText}`);
        }

        const data = await response.json();

        if (mounted) {
          setSessionId(data.session_id);
          sessionStartTimeRef.current = Date.now();
          setIsLoading(false);
        }
      } catch (err) {
        console.error('[useVideoWatchSession] Failed to create session:', err);

        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to create watch session');
          setIsLoading(false);
        }
      }
    }

    createSession();

    return () => {
      mounted = false;
    };
  }, [videoId, studentId, creatorId, deviceType, referrerType]);

  /**
   * Track progress update
   */
  const trackProgress = async (percentComplete: number, watchTimeSeconds: number): Promise<void> => {
    if (!sessionId) {
      console.warn('[useVideoWatchSession] Cannot track progress: session not created');
      return;
    }

    try {
      const response = await fetch(`/api/analytics/watch-sessions/${sessionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          percent_complete: percentComplete,
          watch_time_seconds: watchTimeSeconds,
          completed: percentComplete >= 90,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update watch session: ${response.statusText}`);
      }
    } catch (err) {
      console.error('[useVideoWatchSession] Failed to track progress:', err);
      // Don't throw - we don't want to interrupt playback
    }
  };

  /**
   * End watch session
   */
  const endSession = async (): Promise<void> => {
    if (!sessionId || hasEndedRef.current) {
      return;
    }

    hasEndedRef.current = true;

    try {
      const response = await fetch(`/api/analytics/watch-sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_end: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to end watch session: ${response.statusText}`);
      }
    } catch (err) {
      console.error('[useVideoWatchSession] Failed to end session:', err);
      // Don't throw - session end is best-effort
    }
  };

  /**
   * Auto-end session on unmount
   */
  useEffect(() => {
    return () => {
      if (sessionId && !hasEndedRef.current) {
        // Call endSession without awaiting to avoid memory leaks
        endSession();
      }
    };
  }, [sessionId]);

  return {
    sessionId,
    isLoading,
    error,
    trackProgress,
    endSession,
  };
}
