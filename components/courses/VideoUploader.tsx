'use client';

import { useState, useCallback } from 'react';
import { X, Video, ArrowLeft, FileText, ToggleLeft, ToggleRight, AlertCircle, CheckCircle } from 'lucide-react';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import { VIDEO_LIMITS } from '@/lib/video/config';

interface VideoUploaderProps {
  onVideoUploaded: (video: any) => void;
  onClose: () => void;
  onBackToLibrary?: () => void;
}

type UploadStatus = 'idle' | 'uploading' | 'pending' | 'transcribing' | 'processing' | 'embedding' | 'completed' | 'failed';

interface UploadError {
  message: string;
  canRetry: boolean;
}

export default function VideoUploader({
  onVideoUploaded,
  onClose,
  onBackToLibrary,
}: VideoUploaderProps) {
  const { creatorId, tier } = useAnalytics();

  // Early return if no creatorId
  if (!creatorId) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <div className="relative bg-gray-2 border border-gray-6 rounded-lg shadow-xl p-6">
          <p className="text-gray-11">Not authenticated</p>
        </div>
      </div>
    );
  }

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [unlockImmediately, setUnlockImmediately] = useState(true);
  const [unlockDate, setUnlockDate] = useState('');
  const [_currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [error, setError] = useState<UploadError | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Tier limits based on subscription
  const tierLimits = tier === 'enterprise' ? VIDEO_LIMITS.enterprise : tier === 'pro' ? VIDEO_LIMITS.pro : VIDEO_LIMITS.basic;
  const maxFileSizeMB = tierLimits.maxFileSizeMB;
  const allowedFormats = tierLimits.allowedFormats;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find((file) =>
      file.type.startsWith('video/')
    );

    if (videoFile) {
      handleFileSelect(videoFile);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file: File) => {
    // Reset error state
    setError(null);

    // Validate file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowedFormats.includes(fileExtension as any)) {
      setError({
        message: `File format .${fileExtension} not supported for ${tier} tier. Allowed formats: ${allowedFormats.join(', ')}`,
        canRetry: false,
      });
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxFileSizeMB) {
      setError({
        message: `File size ${fileSizeMB.toFixed(2)}MB exceeds ${tier} tier limit of ${maxFileSizeMB}MB. Please upgrade your plan or compress your video.`,
        canRetry: false,
      });
      return;
    }

    // Set file and prepare for upload
    setSelectedFile(file);
    setVideoTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError({ message: 'No file selected', canRetry: false });
      return;
    }

    setError(null);
    setStatus('uploading');
    setUploadProgress(0);

    try {
      // Step 1: Request signed upload URL from backend
      const uploadResponse = await fetch('/api/video/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: selectedFile.name,
          fileSize: selectedFile.size,
          mimeType: selectedFile.type,
          title: videoTitle || selectedFile.name.replace(/\.[^/.]+$/, ''),
          creatorId,
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to initialize upload');
      }

      const uploadData = await uploadResponse.json();
      const { video, upload } = uploadData;
      setCurrentVideoId(video.id);

      // Step 2: Upload file directly to Supabase Storage using signed URL
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          setUploadProgress(100);

          // Step 3: Confirm upload and trigger processing
          try {
            const confirmResponse = await fetch(`/api/video/${video.id}/confirm`, {
              method: 'POST',
            });

            if (!confirmResponse.ok) {
              throw new Error('Failed to confirm upload');
            }

            await confirmResponse.json();
            setStatus('pending');

            // Step 4: Poll for processing status
            startStatusPolling(video.id);
          } catch (confirmError) {
            throw new Error(confirmError instanceof Error ? confirmError.message : 'Upload confirmation failed');
          }
        } else {
          throw new Error(`Upload failed with status ${xhr.status}`);
        }
      });

      xhr.addEventListener('error', () => {
        throw new Error('Network error during upload');
      });

      xhr.addEventListener('abort', () => {
        throw new Error('Upload was cancelled');
      });

      xhr.open(upload.method, upload.url);
      xhr.setRequestHeader('Content-Type', upload.headers['Content-Type']);
      xhr.send(selectedFile);

    } catch (err) {
      console.error('Upload error:', err);
      setStatus('failed');
      setError({
        message: err instanceof Error ? err.message : 'Upload failed',
        canRetry: true,
      });
    }
  };

  const startStatusPolling = useCallback((videoId: string) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await fetch(`/api/video/${videoId}/status`);

        if (!statusResponse.ok) {
          clearInterval(pollInterval);
          setStatus('failed');
          setError({ message: 'Failed to fetch processing status', canRetry: true });
          return;
        }

        const statusData = await statusResponse.json();
        const videoStatus = statusData.status as UploadStatus;

        setStatus(videoStatus);
        setUploadProgress(statusData.progress);

        // Terminal states
        if (videoStatus === 'completed') {
          clearInterval(pollInterval);

          // Fetch full video details
          const videoResponse = await fetch(`/api/video/${videoId}`);
          if (videoResponse.ok) {
            const videoData = await videoResponse.json();
            onVideoUploaded({
              id: videoData.data.id,
              title: videoData.data.title,
              description: videoData.data.description,
              thumbnail: videoData.data.thumbnailUrl || 'https://placehold.co/320x180/1a1a1a/666666?text=Video',
              duration: videoData.data.duration || 0,
              views: 0,
              watchTime: 0,
              uploadDate: videoData.data.createdAt,
            });
          }

          setStatus('completed');
        } else if (videoStatus === 'failed') {
          clearInterval(pollInterval);
          setError({
            message: statusData.error?.message || 'Processing failed',
            canRetry: true,
          });
        }
      } catch (err) {
        console.error('Status polling error:', err);
        clearInterval(pollInterval);
        setStatus('failed');
        setError({ message: 'Failed to check processing status', canRetry: true });
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 10 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (status !== 'completed' && status !== 'failed') {
        setError({ message: 'Processing timeout - please check video library', canRetry: false });
      }
    }, 600000);
  }, [status, onVideoUploaded]);

  const handleRetry = () => {
    setError(null);
    setStatus('idle');
    setUploadProgress(0);
    setCurrentVideoId(null);
    if (selectedFile) {
      handleFileUpload();
    }
  };

  const handlePasteVideo = async () => {
    if (!videoUrl.trim()) {
      setError({ message: 'Please enter a video URL', canRetry: false });
      return;
    }

    setError(null);
    setStatus('uploading');
    setUploadProgress(0);

    try {
      // Call upload API with URL
      const uploadResponse = await fetch('/api/video/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: videoUrl.trim(),
          title: videoTitle || undefined,
          creatorId: 'e5f9d8c7-4b3a-4e2d-9f1a-8c7b6a5d4e3f', // TODO: Get from auth context
        }),
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json();
        throw new Error(errorData.error || 'Failed to import video');
      }

      const uploadData = await uploadResponse.json();
      const { video } = uploadData;

      setCurrentVideoId(video.id);
      setUploadProgress(100); // Show complete

      // URL uploads are processed immediately, so start polling
      setStatus('pending');
      startStatusPolling(video.id);
    } catch (err) {
      console.error('URL import error:', err);
      setStatus('failed');
      setError({
        message: err instanceof Error ? err.message : 'Import failed',
        canRetry: true,
      });
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'uploading':
        return 'Uploading...';
      case 'pending':
        return 'Upload complete, preparing for processing...';
      case 'transcribing':
        return 'Transcribing audio...';
      case 'processing':
        return 'Processing transcript...';
      case 'embedding':
        return 'Generating embeddings...';
      case 'completed':
        return 'Processing complete!';
      case 'failed':
        return 'Upload failed';
      default:
        return '';
    }
  };

  const isUploading = ['uploading', 'pending', 'transcribing', 'processing', 'embedding'].includes(status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-2 border border-gray-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-6">
          <div className="flex items-center gap-3">
            {onBackToLibrary && (
              <button
                onClick={onBackToLibrary}
                className="text-gray-11 hover:text-gray-12 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-12">Upload Video</h2>
              <p className="text-sm text-gray-11 mt-1">Add a new video to your library</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-11 hover:text-gray-12 transition-colors"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 bg-red-3 border border-red-6 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-9 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-red-11 font-medium mb-1">Upload Error</p>
                <p className="text-sm text-red-10">{error.message}</p>
                {error.canRetry && (
                  <button
                    onClick={handleRetry}
                    className="mt-2 text-sm text-red-11 hover:text-red-12 underline"
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
              <CheckCircle className="w-5 h-5 text-green-9 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-green-11 font-medium mb-1">Upload Complete!</p>
                <p className="text-sm text-green-10">Your video has been processed and is ready to use.</p>
              </div>
            </div>
          )}

          {/* Upload Area */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-3">
              Video File
              <span className="text-gray-10 font-normal ml-2">
                (Max {maxFileSizeMB}MB for {tier} tier)
              </span>
            </label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                isDragging
                  ? 'border-blue-7 bg-blue-3'
                  : 'border-gray-6 hover:border-blue-7 hover:bg-gray-3'
              } ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Video className="w-12 h-12 text-gray-9 mx-auto mb-4" />
              <p className="text-gray-12 font-medium mb-2">
                {selectedFile ? selectedFile.name : 'Upload a video...'}
              </p>
              <p className="text-sm text-gray-11 mb-4">
                Drag and drop or click to browse
              </p>
              <p className="text-xs text-gray-10 mb-4">
                Supported formats: {allowedFormats.join(', ')}
              </p>

              <label className="inline-block">
                <span className="px-4 py-2 bg-blue-9 hover:bg-blue-10 text-white rounded-lg cursor-pointer transition-colors">
                  {selectedFile ? 'Change file' : 'Select file'}
                </span>
                <input
                  type="file"
                  accept={allowedFormats.map(f => `video/${f}`).join(',')}
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="mt-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-11">{getStatusMessage()}</span>
                  <span className="text-gray-12 font-medium">{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-gray-5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-9 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-10 mt-2">
                  {status === 'uploading' && 'Uploading to storage...'}
                  {status === 'pending' && 'Confirming upload...'}
                  {['transcribing', 'processing', 'embedding'].includes(status) && 'This may take a few minutes depending on video length.'}
                </p>
              </div>
            )}
          </div>

          {/* OR Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-6"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-gray-2 text-sm text-gray-11">OR</span>
            </div>
          </div>

          {/* Paste Video URL */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-3">Paste Video URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="flex-1 px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:border-blue-8 focus:ring-1 focus:ring-blue-8"
                disabled={isUploading}
              />
              <button
                onClick={handlePasteVideo}
                disabled={isUploading || !videoUrl.trim()}
                className="px-4 py-2 bg-blue-9 hover:bg-blue-10 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Paste Video
              </button>
            </div>
          </div>

          {/* Video Title */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">Video Title</label>
            <input
              type="text"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
              placeholder="Enter video title"
              className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:border-blue-8 focus:ring-1 focus:ring-blue-8"
            />
          </div>

          {/* File Attachments */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-3">File attachments</label>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-6 rounded-lg hover:bg-gray-3 transition-colors text-gray-11">
              <FileText className="w-4 h-4" />
              Upload attachment
            </button>
            <p className="text-xs text-gray-10 mt-2">
              Add PDFs, documents, or slides to accompany this video
            </p>
          </div>

          {/* Drip Feeding Settings */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-3">
              Drip feeding settings
            </label>
            <div className="space-y-3">
              <button
                onClick={() => setUnlockImmediately(!unlockImmediately)}
                className="flex items-center gap-3 w-full p-3 border border-gray-6 rounded-lg hover:bg-gray-3 transition-colors"
              >
                {unlockImmediately ? (
                  <ToggleRight className="w-6 h-6 text-blue-9" />
                ) : (
                  <ToggleLeft className="w-6 h-6 text-gray-9" />
                )}
                <span className="text-sm text-gray-12">Unlocks immediately</span>
              </button>

              {!unlockImmediately && (
                <div>
                  <label className="block text-sm text-gray-11 mb-2">Unlock date and time</label>
                  <input
                    type="datetime-local"
                    value={unlockDate}
                    onChange={(e) => setUnlockDate(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 focus:outline-none focus:border-blue-8 focus:ring-1 focus:ring-blue-8"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Content Editor */}
          <div>
            <label className="block text-sm font-medium text-gray-12 mb-2">Content</label>
            <textarea
              placeholder="Press '/' for commands"
              rows={6}
              className="w-full px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:border-blue-8 focus:ring-1 focus:ring-blue-8 resize-none font-mono text-sm"
            />
            <p className="text-xs text-gray-10 mt-2">
              Add additional text, images, or embeds to accompany the video
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 p-6 border-t border-gray-6">
          <div className="text-xs text-gray-10">
            {(tier === 'free' || tier === 'starter') && `Basic plan: ${maxFileSizeMB}MB max, 50 videos total`}
            {tier === 'pro' && `Pro plan: ${maxFileSizeMB}MB max, 500 videos total`}
            {tier === 'enterprise' && `Enterprise plan: ${maxFileSizeMB}MB max, unlimited videos`}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-11 hover:text-gray-12 transition-colors"
              disabled={isUploading}
            >
              {status === 'completed' ? 'Close' : 'Cancel'}
            </button>
            {selectedFile && status === 'idle' && (
              <button
                onClick={handleFileUpload}
                className="px-4 py-2 bg-blue-9 hover:bg-blue-10 text-white rounded-lg transition-colors"
              >
                Start Upload
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
