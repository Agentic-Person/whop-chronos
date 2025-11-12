import { useState, useEffect, useCallback } from 'react';
import { SourceType, Video } from '@/components/video/VideoSourceSelector';

interface UseVideoImportOptions {
  creatorId: string;
  defaultTab?: SourceType;
  onSuccess?: (video: Video) => void;
  onError?: (error: Error) => void;
}

interface ImportState {
  activeTab: SourceType;
  importing: boolean;
  progress: number; // 0-100
  currentStep: string;
  error: Error | null;
  currentVideoId: string | null;
}

export function useVideoImport({
  creatorId,
  defaultTab = 'youtube',
  onSuccess,
  onError,
}: UseVideoImportOptions) {
  const [state, setState] = useState<ImportState>({
    activeTab: defaultTab,
    importing: false,
    progress: 0,
    currentStep: '',
    error: null,
    currentVideoId: null,
  });

  // Status polling effect
  useEffect(() => {
    if (!state.currentVideoId || !state.importing) {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/${state.currentVideoId}/status`);
        if (response.ok) {
          const data = await response.json();

          // Map status to progress
          const progressMap: Record<string, number> = {
            'pending': 10,
            'transcribing': 30,
            'processing': 50,
            'embedding': 75,
            'completed': 100,
            'failed': 0,
          };

          const newProgress = progressMap[data.status] || state.progress;

          setState(prev => ({
            ...prev,
            progress: newProgress,
            currentStep: getStepMessage(data.status),
          }));

          if (data.status === 'completed') {
            // Fetch full video data
            const videoResponse = await fetch(`/api/video/${state.currentVideoId}`);
            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              if (videoData.success && videoData.data) {
                setState(prev => ({
                  ...prev,
                  importing: false,
                  progress: 100,
                  currentStep: 'Import complete!',
                }));

                if (onSuccess) {
                  onSuccess({
                    id: videoData.data.id,
                    title: videoData.data.title,
                    thumbnail: videoData.data.thumbnailUrl || undefined,
                    duration: videoData.data.duration || undefined,
                    source_type: videoData.data.source_type,
                  });
                }
              }
            }
          } else if (data.status === 'failed') {
            const error = new Error(data.error_message || 'Import failed');
            setState(prev => ({
              ...prev,
              importing: false,
              error,
            }));

            if (onError) {
              onError(error);
            }
          }
        }
      } catch (err) {
        console.error('Status polling error:', err);
      }
    }, 3000); // Poll every 3 seconds

    return () => clearInterval(pollInterval);
  }, [state.currentVideoId, state.importing, onSuccess, onError]);

  const getStepMessage = (status: string): string => {
    const messages: Record<string, string> = {
      'pending': 'Preparing to process...',
      'transcribing': 'Extracting transcript...',
      'processing': 'Chunking transcript...',
      'embedding': 'Generating embeddings...',
      'completed': 'Import complete!',
      'failed': 'Import failed',
    };

    return messages[status] || 'Processing...';
  };

  const setActiveTab = useCallback((tab: SourceType) => {
    setState(prev => ({ ...prev, activeTab: tab }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const importVideo = useCallback(async (sourceType: SourceType, data: any) => {
    setState(prev => ({
      ...prev,
      importing: true,
      progress: 5,
      currentStep: 'Starting import...',
      error: null,
    }));

    try {
      let response;
      let videoId: string;

      switch (sourceType) {
        case 'youtube':
          response = await fetch('/api/video/youtube/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: data.url,
              title: data.title,
              creatorId,
            }),
          });
          break;

        case 'loom':
          response = await fetch('/api/video/loom/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              videoUrl: data.url,
              title: data.title,
              creatorId,
            }),
          });
          break;

        case 'whop':
          if (data.lessonIds) {
            // Bulk import
            const imports = await Promise.all(
              data.lessonIds.map((lessonId: string) =>
                fetch('/api/video/whop/import', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ lessonId, creatorId }),
                })
              )
            );

            // For bulk imports, we'll just use the first one for tracking
            response = imports[0];
          } else {
            response = await fetch('/api/video/whop/import', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                lessonId: data.lessonId,
                creatorId,
              }),
            });
          }
          break;

        case 'upload':
          const formData = new FormData();
          formData.append('file', data.file);
          formData.append('creatorId', creatorId);

          response = await fetch('/api/video/upload', {
            method: 'POST',
            body: formData,
          });
          break;

        default:
          throw new Error(`Unsupported source type: ${sourceType}`);
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Import failed');
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Import failed');
      }

      videoId = result.video.id;

      // Track analytics
      await fetch('/api/analytics/video-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'source_tab_selected',
          creator_id: creatorId,
          metadata: {
            source_type: sourceType,
          },
        }),
      }).catch(err => console.error('Analytics tracking error:', err));

      // Start polling for status
      setState(prev => ({
        ...prev,
        currentVideoId: videoId,
        progress: 10,
        currentStep: 'Video import started',
      }));

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      setState(prev => ({
        ...prev,
        importing: false,
        error,
      }));

      if (onError) {
        onError(error);
      }
    }
  }, [creatorId, onSuccess, onError]);

  const cancelImport = useCallback(() => {
    setState(prev => ({
      ...prev,
      importing: false,
      progress: 0,
      currentStep: '',
      currentVideoId: null,
    }));
  }, []);

  return {
    activeTab: state.activeTab,
    setActiveTab,
    importing: state.importing,
    progress: state.progress,
    currentStep: state.currentStep,
    error: state.error,
    importVideo,
    cancelImport,
    clearError,
  };
}
