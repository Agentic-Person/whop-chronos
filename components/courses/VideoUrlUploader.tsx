'use client';

import { useState, useEffect } from 'react';
import { X, Link, Loader, CheckCircle, AlertCircle } from 'lucide-react';

interface VideoUrlUploaderProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: (video: { id: string; title: string; thumbnail?: string; duration?: number } | string) => void;
  creatorId: string;
  chapterId?: string;
}

type UploadStatus = 'idle' | 'fetching' | 'uploading' | 'pending' | 'transcribing' | 'processing' | 'embedding' | 'completed' | 'failed';
type ImportTab = 'youtube' | 'whop';

export default function VideoUrlUploader({
  isOpen,
  onClose,
  onComplete,
  creatorId,
}: VideoUrlUploaderProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDuration, setVideoDuration] = useState('');
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [error, setError] = useState<{ message: string; canRetry: boolean } | null>(null);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);

  // Whop-specific state
  const [whopLessonId, setWhopLessonId] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('youtube');
      setVideoUrl('');
      setWhopLessonId('');
      setVideoTitle('');
      setVideoDuration('');
      setStatus('idle');
      setError(null);
      setCurrentVideoId(null);
    }
  }, [isOpen]);

  // Status polling for video processing
  useEffect(() => {
    if (!currentVideoId || status === 'completed' || status === 'failed') {
      return;
    }

    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/video/${currentVideoId}/status`);
        if (response.ok) {
          const data = await response.json();
          setStatus(data.status);

          if (data.status === 'completed') {
            if (onComplete) {
              // Fetch full video data before calling onComplete
              try {
                const videoResponse = await fetch(`/api/video/${currentVideoId}`);
                if (videoResponse.ok) {
                  const videoData = await videoResponse.json();
                  if (videoData.success && videoData.data) {
                    // Pass full video object with CourseBuilder-expected structure
                    // Note: API returns thumbnailUrl, but CourseBuilder expects thumbnail
                    onComplete({
                      id: videoData.data.id,
                      title: videoData.data.title,
                      thumbnail: videoData.data.thumbnailUrl || null,
                      duration: videoData.data.duration || 0,
                    });
                  } else {
                    // Fallback: pass just the ID if data structure is unexpected
                    console.warn('Unexpected video data structure:', videoData);
                    onComplete(currentVideoId);
                  }
                } else {
                  // Fallback: pass just the ID if endpoint fails
                  console.error('Failed to fetch video data:', await videoResponse.text());
                  onComplete(currentVideoId);
                }
              } catch (fetchError) {
                console.error('Error fetching video data:', fetchError);
                // Fallback: pass just the ID if fetch fails
                onComplete(currentVideoId);
              }
            }
          } else if (data.status === 'failed') {
            setError({
              message: data.error_message || 'Processing failed',
              canRetry: true,
            });
          }
        }
      } catch (err) {
        console.error('Status polling error:', err);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [currentVideoId, status, onComplete]);

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    setError(null);
  };

  const handleFetchMetadata = async () => {
    if (!videoUrl.trim()) {
      setError({ message: 'Please enter a video URL', canRetry: false });
      return;
    }

    setStatus('fetching');
    setError(null);

    try {
      // Extract metadata without downloading
      const response = await fetch('/api/video/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: videoUrl.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video metadata');
      }

      const metadata = await response.json();
      setVideoTitle(metadata.title || '');
      setVideoDuration(formatDuration(metadata.duration || 0));
      setStatus('idle');
    } catch (err) {
      console.error('Metadata fetch error:', err);
      setStatus('idle');
      setError({
        message: err instanceof Error ? err.message : 'Failed to fetch metadata',
        canRetry: true,
      });
    }
  };

  const handleYouTubeImport = async () => {
    if (!videoUrl.trim()) {
      setError({ message: 'Please enter a video URL', canRetry: false });
      return;
    }

    setError(null);
    setStatus('processing');

    try {
      // Import YouTube video (transcript extraction, no download)
      const importResponse = await fetch('/api/video/youtube/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          title: videoTitle || undefined,
          creatorId,
        }),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.error || 'Failed to import video');
      }

      const importData = await importResponse.json();

      if (!importData.success) {
        throw new Error(importData.error || 'Failed to import video');
      }

      const { video } = importData;

      setCurrentVideoId(video.id);

      // Video transcript extracted, start polling for chunking/embedding
      setStatus('pending');
    } catch (err) {
      console.error('YouTube import error:', err);
      setStatus('failed');
      setError({
        message: err instanceof Error ? err.message : 'Import failed',
        canRetry: true,
      });
    }
  };

  const handleWhopImport = async () => {
    if (!whopLessonId.trim()) {
      setError({ message: 'Please enter a Whop lesson ID', canRetry: false });
      return;
    }

    setError(null);
    setStatus('processing');

    try {
      // Import Whop lesson video
      const importResponse = await fetch('/api/video/whop/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId: whopLessonId.trim(),
          creatorId,
        }),
      });

      if (!importResponse.ok) {
        const errorData = await importResponse.json();
        throw new Error(errorData.error || 'Failed to import video from Whop');
      }

      const importData = await importResponse.json();

      if (!importData.success) {
        throw new Error(importData.error || 'Failed to import video from Whop');
      }

      const { video } = importData;

      setCurrentVideoId(video.id);
      setVideoTitle(video.title);

      // Check if video needs processing (YouTube embeds) or is ready (Mux)
      if (video.source_type === 'youtube') {
        setStatus('pending');
      } else {
        // Mux video is immediately ready - fetch full data and call onComplete
        setStatus('completed');
        if (onComplete) {
          try {
            const videoResponse = await fetch(`/api/video/${video.id}`);
            if (videoResponse.ok) {
              const videoData = await videoResponse.json();
              if (videoData.success && videoData.data) {
                // Note: API returns thumbnailUrl, but CourseBuilder expects thumbnail
                onComplete({
                  id: videoData.data.id,
                  title: videoData.data.title,
                  thumbnail: videoData.data.thumbnailUrl || null,
                  duration: videoData.data.duration || 0,
                });
              } else {
                onComplete(video.id);
              }
            } else {
              onComplete(video.id);
            }
          } catch (fetchError) {
            console.error('Error fetching Whop video data:', fetchError);
            onComplete(video.id);
          }
        }
      }
    } catch (err) {
      console.error('Whop import error:', err);
      setStatus('failed');
      setError({
        message: err instanceof Error ? err.message : 'Whop import failed',
        canRetry: true,
      });
    }
  };

  const handleImport = () => {
    if (activeTab === 'youtube') {
      return handleYouTubeImport();
    } else {
      return handleWhopImport();
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'fetching':
        return 'Fetching video information...';
      case 'uploading':
        return 'Importing video from YouTube...';
      case 'pending':
        return 'Import complete, preparing for processing...';
      case 'transcribing':
        return 'Extracting transcript...';
      case 'processing':
        return 'Processing transcript...';
      case 'embedding':
        return 'Generating embeddings...';
      case 'completed':
        return 'Processing complete!';
      case 'failed':
        return 'Import failed';
      default:
        return '';
    }
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const isProcessing = ['fetching', 'processing', 'pending', 'transcribing', 'embedding'].includes(status);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={isProcessing ? undefined : onClose} />

      {/* Modal */}
      <div className="relative bg-gray-2 border border-gray-6 rounded-lg shadow-xl w-full max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-4 rounded-lg flex items-center justify-center">
              <Link className="w-5 h-5 text-purple-11" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-12">Upload from URL</h2>
              <p className="text-sm text-gray-11 mt-0.5">Import video from YouTube or other platforms</p>
            </div>
          </div>
          {!isProcessing && (
            <button
              onClick={onClose}
              className="text-gray-11 hover:text-gray-12 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Tabs */}
          <div className="flex gap-2 p-1 bg-gray-3 rounded-lg">
            <button
              onClick={() => setActiveTab('youtube')}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'youtube'
                  ? 'bg-gray-12 text-gray-1'
                  : 'text-gray-11 hover:text-gray-12'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              YouTube URL
            </button>
            <button
              onClick={() => setActiveTab('whop')}
              disabled={isProcessing}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'whop'
                  ? 'bg-gray-12 text-gray-1'
                  : 'text-gray-11 hover:text-gray-12'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              Whop Lesson
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-3 border border-red-6 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-11 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-11">Import Error</p>
                <p className="text-sm text-red-11 mt-1">{error.message}</p>
                {error.canRetry && (
                  <button
                    onClick={() => setError(null)}
                    className="text-sm text-red-11 underline mt-2 hover:text-red-12"
                  >
                    Try again
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Success Display */}
          {status === 'completed' && (
            <div className="flex items-start gap-3 p-4 bg-green-3 border border-green-6 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-11 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-11">Video Imported Successfully!</p>
                <p className="text-sm text-green-11 mt-1">Your video has been processed and is ready to use.</p>
              </div>
            </div>
          )}

          {/* YouTube URL Input */}
          {activeTab === 'youtube' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-12">
                Video URL <span className="text-red-11">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={videoUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={isProcessing}
                  className="flex-1 px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-7 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button
                  onClick={handleFetchMetadata}
                  disabled={!videoUrl.trim() || isProcessing}
                  className="px-4 py-2 bg-gray-4 text-gray-12 rounded-lg hover:bg-gray-5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {status === 'fetching' ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    'Fetch Info'
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-11">
                Paste a YouTube video URL to automatically fetch title and duration
              </p>
            </div>
          )}

          {/* Whop Lesson Input */}
          {activeTab === 'whop' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-12">
                Whop Lesson ID <span className="text-red-11">*</span>
              </label>
              <input
                type="text"
                value={whopLessonId}
                onChange={(e) => {
                  setWhopLessonId(e.target.value);
                  setError(null);
                }}
                placeholder="les_xxxxxxxxxx"
                disabled={isProcessing}
                className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-7 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-gray-11">
                Import videos from your Whop course lessons (Mux videos or YouTube/Loom embeds)
              </p>
              <div className="mt-2 p-3 bg-blue-3 border border-blue-6 rounded-lg">
                <p className="text-xs text-blue-11">
                  <strong>Note:</strong> Whop SDK integration required. This feature currently shows an implementation guide.
                </p>
              </div>
            </div>
          )}

          {/* Video Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-12">
              Video Title
            </label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Will be auto-filled from URL"
              disabled={isProcessing}
              className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-7 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          {/* Video Duration (Read-only) */}
          {videoDuration && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-12">
                Duration
              </label>
              <input
                type="text"
                value={videoDuration}
                readOnly
                disabled
                className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 opacity-50 cursor-not-allowed"
              />
            </div>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <div className="flex items-center gap-3 p-4 bg-blue-3 border border-blue-6 rounded-lg">
              <Loader className="w-5 h-5 text-blue-11 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-11">{getStatusMessage()}</p>
                <p className="text-xs text-blue-11 mt-1">This may take a few minutes...</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-6">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-11 hover:text-gray-12 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'completed' ? 'Close' : 'Cancel'}
          </button>
          <button
            onClick={handleImport}
            disabled={
              (activeTab === 'youtube' && !videoUrl.trim()) ||
              (activeTab === 'whop' && !whopLessonId.trim()) ||
              isProcessing ||
              status === 'completed'
            }
            className="px-6 py-2 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                {status === 'processing' ? 'Importing...' : 'Processing...'}
              </>
            ) : (
              `Import ${activeTab === 'youtube' ? 'YouTube' : 'Whop'} Video`
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
