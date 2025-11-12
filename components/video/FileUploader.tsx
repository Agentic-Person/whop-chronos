'use client';

/**
 * FileUploader Component
 *
 * Drag-and-drop video file uploader with:
 * - Multi-file upload queue
 * - Chunked upload for large files
 * - Progress tracking per file
 * - Pause/resume capability
 * - Thumbnail preview
 * - Storage quota validation
 * - Cost estimation
 */

import { useState, useCallback, useRef } from 'react';
import { Upload, X, Play, Pause, Check, AlertCircle, Film } from 'lucide-react';
import { Button } from 'frosted-ui';
import { extractVideoMetadata } from '@/lib/upload/metadata-extractor';
import { extractThumbnail } from '@/lib/upload/thumbnail-extractor';
import { ChunkedUploader } from '@/lib/upload/chunked-uploader';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

const ALLOWED_VIDEO_FORMATS = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
const ALLOWED_MIME_TYPES = [
  'video/mp4',
  'video/quicktime',
  'video/x-msvideo',
  'video/x-matroska',
  'video/webm',
];
const MAX_FILE_SIZE_GB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_GB * 1024 * 1024 * 1024;

export interface FileUploaderProps {
  creatorId: string;
  onUploadComplete?: (video: Video) => void;
  onUploadError?: (error: Error) => void;
  maxFiles?: number;
  maxSizeGB?: number;
  className?: string;
}

interface UploadFile {
  id: string;
  file: File;
  title: string;
  status: 'queued' | 'uploading' | 'paused' | 'completed' | 'error';
  progress: number;
  thumbnail: string | null;
  metadata: {
    duration: number;
    width: number;
    height: number;
    size: number;
  } | null;
  error: string | null;
  videoId: string | null;
  uploader: ChunkedUploader | null;
}

export function FileUploader({
  creatorId,
  onUploadComplete,
  onUploadError,
  maxFiles = 10,
  maxSizeGB = MAX_FILE_SIZE_GB,
  className = '',
}: FileUploaderProps) {
  const [uploads, setUploads] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxSizeBytes = maxSizeGB * 1024 * 1024 * 1024;

  // Handle file selection
  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // Validate file count
      if (uploads.length + fileArray.length > maxFiles) {
        const error = new Error(
          `Maximum ${maxFiles} files allowed. You can upload ${maxFiles - uploads.length} more file(s).`
        );
        onUploadError?.(error);
        return;
      }

      setIsExtracting(true);

      // Process each file
      for (const file of fileArray) {
        // Validate file type
        const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!ALLOWED_VIDEO_FORMATS.includes(extension)) {
          onUploadError?.(
            new Error(
              `Invalid file type: ${extension}. Allowed formats: ${ALLOWED_VIDEO_FORMATS.join(', ')}`
            )
          );
          continue;
        }

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
          onUploadError?.(
            new Error(`Invalid MIME type: ${file.type}. Expected video format.`)
          );
          continue;
        }

        // Validate file size
        if (file.size > maxSizeBytes) {
          onUploadError?.(
            new Error(
              `File ${file.name} is too large (${formatBytes(file.size)}). Maximum size is ${maxSizeGB}GB.`
            )
          );
          continue;
        }

        if (file.size === 0) {
          onUploadError?.(
            new Error(`File ${file.name} is empty or corrupted.`)
          );
          continue;
        }

        try {
          // Extract metadata and thumbnail
          const metadata = await extractVideoMetadata(file);
          const thumbnail = await extractThumbnail(file);

          // Create upload entry
          const uploadFile: UploadFile = {
            id: crypto.randomUUID(),
            file,
            title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
            status: 'queued',
            progress: 0,
            thumbnail,
            metadata,
            error: null,
            videoId: null,
            uploader: null,
          };

          setUploads((prev) => [...prev, uploadFile]);
        } catch (error) {
          console.error('Error extracting metadata:', error);
          onUploadError?.(
            new Error(`Failed to process ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          );
        }
      }

      setIsExtracting(false);

      // Auto-start uploads
      startNextUpload();
    },
    [uploads, maxFiles, maxSizeBytes, maxSizeGB, onUploadError]
  );

  // Start next queued upload
  const startNextUpload = useCallback(() => {
    setUploads((prev) => {
      // Find next queued file
      const queuedIndex = prev.findIndex((u) => u.status === 'queued');
      if (queuedIndex === -1) return prev;

      // Check if we can start another upload (max 3 concurrent)
      const uploadingCount = prev.filter((u) => u.status === 'uploading').length;
      if (uploadingCount >= 3) return prev;

      const updated = [...prev];
      const uploadFile = updated[queuedIndex];

      // Start upload
      startUpload(uploadFile);

      return updated;
    });
  }, []);

  // Start individual upload
  const startUpload = async (uploadFile: UploadFile) => {
    try {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadFile.id ? { ...u, status: 'uploading' as const } : u
        )
      );

      // Create video record and get upload URL
      const response = await fetch('/api/video/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: uploadFile.file.name,
          fileSize: uploadFile.file.size,
          mimeType: uploadFile.file.type,
          title: uploadFile.title,
          creatorId,
          duration: uploadFile.metadata?.duration,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const { video, upload } = await response.json();

      // Start chunked upload
      const uploader = new ChunkedUploader(
        uploadFile.file,
        upload.url,
        {
          onProgress: (progress) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadFile.id ? { ...u, progress } : u
              )
            );
          },
          onComplete: async () => {
            // Confirm upload completion
            await fetch(`/api/video/${video.id}/confirm`, {
              method: 'POST',
            });

            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadFile.id
                  ? { ...u, status: 'completed' as const, progress: 100 }
                  : u
              )
            );

            onUploadComplete?.(video);
            startNextUpload();
          },
          onError: (error) => {
            setUploads((prev) =>
              prev.map((u) =>
                u.id === uploadFile.id
                  ? {
                      ...u,
                      status: 'error' as const,
                      error: error.message,
                    }
                  : u
              )
            );
            onUploadError?.(error);
            startNextUpload();
          },
        }
      );

      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadFile.id ? { ...u, uploader, videoId: video.id } : u
        )
      );

      await uploader.start();
    } catch (error) {
      console.error('Upload error:', error);
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadFile.id
            ? {
                ...u,
                status: 'error' as const,
                error: error instanceof Error ? error.message : 'Upload failed',
              }
            : u
        )
      );
      onUploadError?.(error instanceof Error ? error : new Error('Upload failed'));
      startNextUpload();
    }
  };

  // Pause upload
  const pauseUpload = (uploadId: string) => {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.id === uploadId && u.uploader) {
          u.uploader.pause();
          return { ...u, status: 'paused' as const };
        }
        return u;
      })
    );
  };

  // Resume upload
  const resumeUpload = (uploadId: string) => {
    setUploads((prev) =>
      prev.map((u) => {
        if (u.id === uploadId && u.uploader) {
          u.uploader.resume();
          return { ...u, status: 'uploading' as const };
        }
        return u;
      })
    );
  };

  // Cancel upload
  const cancelUpload = (uploadId: string) => {
    setUploads((prev) => {
      const upload = prev.find((u) => u.id === uploadId);
      if (upload?.uploader) {
        upload.uploader.cancel();
      }
      return prev.filter((u) => u.id !== uploadId);
    });
    startNextUpload();
  };

  // Drag and drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFiles(files);
      }
    },
    [handleFiles]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFiles(files);
      }
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [handleFiles]
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-all duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${isExtracting ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_MIME_TYPES.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={isExtracting}
        />

        <div className="flex flex-col items-center gap-4">
          <div className="p-4 bg-gray-100 rounded-full">
            <Upload className="w-8 h-8 text-gray-600" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isExtracting
                ? 'Processing files...'
                : 'Drop video files here or click to browse'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: {ALLOWED_VIDEO_FORMATS.join(', ')} • Max size:{' '}
              {maxSizeGB}GB
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Up to {maxFiles} files • Maximum 3 concurrent uploads
            </p>
          </div>
        </div>
      </div>

      {/* Upload queue */}
      {uploads.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Upload Queue ({uploads.length})
          </h3>

          {uploads.map((upload) => (
            <UploadItem
              key={upload.id}
              upload={upload}
              onPause={() => pauseUpload(upload.id)}
              onResume={() => resumeUpload(upload.id)}
              onCancel={() => cancelUpload(upload.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface UploadItemProps {
  upload: UploadFile;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
}

function UploadItem({ upload, onPause, onResume, onCancel }: UploadItemProps) {
  const { file, title, status, progress, thumbnail, metadata, error } = upload;

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <Check className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'uploading':
        return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-gray-500" />;
      default:
        return <Film className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-300';
      case 'error':
        return 'bg-red-100 border-red-300';
      case 'uploading':
        return 'bg-blue-100 border-blue-300';
      case 'paused':
        return 'bg-gray-100 border-gray-300';
      default:
        return 'bg-white border-gray-200';
    }
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-start gap-4">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-24 h-16 bg-gray-200 rounded overflow-hidden">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Film className="w-8 h-8 text-gray-400" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {title}
              </p>
              <p className="text-xs text-gray-500">
                {formatBytes(file.size)}
                {metadata && (
                  <>
                    {' • '}
                    {formatDuration(metadata.duration)}
                    {' • '}
                    {metadata.width}x{metadata.height}
                  </>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {getStatusIcon()}
              <button
                onClick={onCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Progress bar */}
          {status !== 'completed' && status !== 'error' && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                <span>{status === 'paused' ? 'Paused' : 'Uploading...'}</span>
                <span>{progress.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    status === 'paused' ? 'bg-gray-400' : 'bg-blue-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <p className="mt-2 text-xs text-red-600">{error}</p>
          )}

          {/* Actions */}
          {status === 'uploading' && (
            <div className="mt-3">
              <Button size="sm" variant="ghost" onClick={onPause}>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </Button>
            </div>
          )}

          {status === 'paused' && (
            <div className="mt-3">
              <Button size="sm" variant="ghost" onClick={onResume}>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Utility functions
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}
