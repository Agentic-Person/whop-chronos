'use client';

import { useState, useCallback, useRef, type DragEvent, type ChangeEvent } from 'react';
import { Upload, X, AlertCircle, FileVideo } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui';

// Tier-based file size limits (in bytes)
const TIER_LIMITS = {
  free: { maxFileSize: 500 * 1024 * 1024, maxVideos: 5 }, // 500 MB
  basic: { maxFileSize: 1024 * 1024 * 1024, maxVideos: 50 }, // 1 GB
  pro: { maxFileSize: 2 * 1024 * 1024 * 1024, maxVideos: 500 }, // 2 GB
  enterprise: { maxFileSize: 5 * 1024 * 1024 * 1024, maxVideos: -1 }, // 5 GB
} as const;

// Supported video formats
const SUPPORTED_FORMATS = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
const SUPPORTED_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm'];

interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  error?: string;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

interface VideoUploaderProps {
  tier?: 'free' | 'basic' | 'pro' | 'enterprise';
  currentVideoCount?: number;
  onUploadComplete?: (fileId: string, videoData: any) => void;
  onUploadError?: (fileId: string, error: string) => void;
  className?: string;
}

export function VideoUploader({
  tier = 'free',
  currentVideoCount = 0,
  onUploadComplete,
  onUploadError,
  className,
}: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tierLimit = TIER_LIMITS[tier];
  const remainingSlots = tierLimit.maxVideos === -1 ? Infinity : tierLimit.maxVideos - currentVideoCount;

  // Format file size for display
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${Math.round((bytes / Math.pow(k, i)) * 100) / 100} ${sizes[i]}`;
  };

  // Validate file type and size
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!SUPPORTED_FORMATS.includes(file.type)) {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      if (!SUPPORTED_EXTENSIONS.includes(extension)) {
        return {
          valid: false,
          error: `Invalid file type. Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
        };
      }
    }

    // Check file size
    if (file.size > tierLimit.maxFileSize) {
      return {
        valid: false,
        error: `File size (${formatFileSize(file.size)}) exceeds ${tier} tier limit (${formatFileSize(tierLimit.maxFileSize)})`,
      };
    }

    // Check video count limit
    if (remainingSlots <= 0) {
      return {
        valid: false,
        error: `You've reached the video limit for the ${tier} tier (${tierLimit.maxVideos} videos). Upgrade to upload more.`,
      };
    }

    return { valid: true };
  };

  // Handle file selection
  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const newFiles: UploadingFile[] = [];

      Array.from(files).forEach((file) => {
        const validation = validateFile(file);

        const uploadingFile: UploadingFile = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file,
          progress: 0,
          status: validation.valid ? 'pending' : 'failed',
          error: validation.error,
        };

        newFiles.push(uploadingFile);

        // Start upload if valid
        if (validation.valid) {
          uploadFile(uploadingFile);
        }
      });

      setUploadingFiles((prev) => [...prev, ...newFiles]);
    },
    [tier, remainingSlots]
  );

  // Simulate file upload (replace with actual upload logic)
  const uploadFile = async (uploadingFile: UploadingFile) => {
    const { id, file } = uploadingFile;

    try {
      // Update status to uploading
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'uploading' as const } : f))
      );

      // Simulate upload with progress
      // Replace this with actual FormData upload to /api/video/upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name.replace(/\.[^/.]+$/, '')); // Remove extension

      // Simulate progress
      for (let progress = 0; progress <= 100; progress += 10) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        setUploadingFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress } : f))
        );
      }

      // Mark as completed
      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'completed' as const, progress: 100 } : f))
      );

      // Call completion callback
      if (onUploadComplete) {
        onUploadComplete(id, { filename: file.name });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';

      setUploadingFiles((prev) =>
        prev.map((f) => (f.id === id ? { ...f, status: 'failed' as const, error: errorMessage } : f))
      );

      if (onUploadError) {
        onUploadError(id, errorMessage);
      }
    }
  };

  // Remove file from list
  const removeFile = (id: string) => {
    setUploadingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  // Drag and drop handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    handleFiles(files);
  };

  // File input change handler
  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  // Open file picker
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Calculate overall progress
  const overallProgress =
    uploadingFiles.length > 0
      ? Math.round(uploadingFiles.reduce((sum, f) => sum + f.progress, 0) / uploadingFiles.length)
      : 0;

  const activeUploads = uploadingFiles.filter((f) => f.status === 'uploading').length;

  return (
    <div className={cn('w-full space-y-4', className)}>
      {/* Upload Zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg border-2 border-dashed transition-all duration-200',
          isDragging
            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/10'
            : 'border-gray-300 bg-white dark:bg-gray-900 hover:border-gray-400',
          'p-8 md:p-12 text-center cursor-pointer'
        )}
        onClick={openFilePicker}
        role="button"
        tabIndex={0}
        aria-label="Upload video files"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            openFilePicker();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={SUPPORTED_EXTENSIONS.join(',')}
          onChange={handleFileInputChange}
          className="hidden"
          aria-label="File input"
        />

        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-4">
            <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {isDragging ? 'Drop your videos here' : 'Upload videos'}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Drag and drop or click to browse
            </p>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-500 space-y-1">
            <p>Supported formats: MP4, MOV, AVI, WebM</p>
            <p>
              Max file size: {formatFileSize(tierLimit.maxFileSize)} ({tier} tier)
            </p>
            <p>
              {remainingSlots === Infinity
                ? 'Unlimited videos'
                : `${remainingSlots} video${remainingSlots !== 1 ? 's' : ''} remaining`}
            </p>
          </div>
        </div>
      </div>

      {/* Overall Progress */}
      {activeUploads > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Uploading {activeUploads} file{activeUploads !== 1 ? 's' : ''}...
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">{overallProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile) => (
            <div
              key={uploadingFile.id}
              className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4"
            >
              <div className="flex-shrink-0">
                {uploadingFile.status === 'failed' ? (
                  <AlertCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <FileVideo className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {uploadingFile.file.name}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(uploadingFile.id);
                    }}
                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    aria-label={`Remove ${uploadingFile.file.name}`}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <span>{formatFileSize(uploadingFile.file.size)}</span>
                  {uploadingFile.status === 'uploading' && (
                    <>
                      <span>•</span>
                      <span>{uploadingFile.progress}%</span>
                    </>
                  )}
                  {uploadingFile.status === 'completed' && (
                    <>
                      <span>•</span>
                      <span className="text-green-600 dark:text-green-400">Completed</span>
                    </>
                  )}
                  {uploadingFile.status === 'failed' && uploadingFile.error && (
                    <>
                      <span>•</span>
                      <span className="text-red-600 dark:text-red-400">{uploadingFile.error}</span>
                    </>
                  )}
                </div>

                {uploadingFile.status === 'uploading' && (
                  <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                    <div
                      className="bg-gradient-to-r from-purple-600 to-blue-600 h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
