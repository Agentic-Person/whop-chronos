'use client';

import { useState } from 'react';
import { VideoUploader, VideoPreview, ProcessingStatus, VideoList } from '@/components/video';
import type { Database } from '@/lib/db/types';

type Video = Database['public']['Tables']['videos']['Row'];

// Mock data for testing
const mockVideos: Video[] = [
  {
    id: '1',
    creator_id: 'creator-1',
    title: 'Introduction to React Hooks',
    description: 'Learn the basics of React Hooks including useState and useEffect',
    url: 'https://example.com/video1.mp4',
    storage_path: 'videos/video1.mp4',
    thumbnail_url: null,
    duration_seconds: 1245,
    transcript: null,
    transcript_language: null,
    status: 'completed',
    error_message: null,
    processing_started_at: '2024-01-15T10:00:00Z',
    processing_completed_at: '2024-01-15T10:15:00Z',
    file_size_bytes: 52428800,
    metadata: {},
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:15:00Z',
    is_deleted: false,
  },
  {
    id: '2',
    creator_id: 'creator-1',
    title: 'Advanced TypeScript Patterns',
    description: 'Deep dive into advanced TypeScript patterns and best practices',
    url: null,
    storage_path: 'videos/video2.mp4',
    thumbnail_url: null,
    duration_seconds: 2340,
    transcript: null,
    transcript_language: null,
    status: 'transcribing',
    error_message: null,
    processing_started_at: '2024-01-16T14:30:00Z',
    processing_completed_at: null,
    file_size_bytes: 104857600,
    metadata: {},
    created_at: '2024-01-16T14:00:00Z',
    updated_at: '2024-01-16T14:30:00Z',
    is_deleted: false,
  },
  {
    id: '3',
    creator_id: 'creator-1',
    title: 'Building REST APIs with Node.js',
    description: 'Complete guide to building production-ready REST APIs',
    url: null,
    storage_path: 'videos/video3.mp4',
    thumbnail_url: null,
    duration_seconds: 3600,
    transcript: null,
    transcript_language: null,
    status: 'failed',
    error_message: 'Transcription service timeout',
    processing_started_at: '2024-01-17T09:00:00Z',
    processing_completed_at: null,
    file_size_bytes: 157286400,
    metadata: {},
    created_at: '2024-01-17T09:00:00Z',
    updated_at: '2024-01-17T09:30:00Z',
    is_deleted: false,
  },
  {
    id: '4',
    creator_id: 'creator-1',
    title: 'Database Design Fundamentals',
    description: null,
    url: null,
    storage_path: 'videos/video4.mp4',
    thumbnail_url: null,
    duration_seconds: 1800,
    transcript: null,
    transcript_language: null,
    status: 'embedding',
    error_message: null,
    processing_started_at: '2024-01-18T11:00:00Z',
    processing_completed_at: null,
    file_size_bytes: 78643200,
    metadata: {},
    created_at: '2024-01-18T11:00:00Z',
    updated_at: '2024-01-18T11:20:00Z',
    is_deleted: false,
  },
];

export default function TestVideoComponentsPage() {
  const [videos, setVideos] = useState<Video[]>(mockVideos);
  const [selectedTier, setSelectedTier] = useState<'free' | 'basic' | 'pro' | 'enterprise'>('free');

  const handleVideoUpdate = (id: string, updates: Partial<Video>) => {
    setVideos((prev) =>
      prev.map((video) => (video.id === id ? { ...video, ...updates } : video))
    );
  };

  const handleVideoDelete = (id: string) => {
    setVideos((prev) => prev.filter((video) => video.id !== id));
  };

  const handleUploadComplete = (fileId: string, videoData: any) => {
    console.log('Upload complete:', fileId, videoData);
  };

  const handleUploadError = (fileId: string, error: string) => {
    console.error('Upload error:', fileId, error);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Video Components Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing all video upload components for Chronos
          </p>
        </div>

        {/* Tier Selector */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Subscription Tier
          </h2>
          <div className="flex gap-4">
            {(['free', 'basic', 'pro', 'enterprise'] as const).map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTier === tier
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {tier.charAt(0).toUpperCase() + tier.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* VideoUploader Component */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            1. Video Uploader
          </h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <VideoUploader
              tier={selectedTier}
              currentVideoCount={videos.length}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          </div>
        </section>

        {/* ProcessingStatus Component */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            2. Processing Status
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {videos.slice(0, 4).map((video) => (
              <div
                key={video.id}
                className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6"
              >
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">
                  {video.title}
                </h3>
                <ProcessingStatus
                  videoId={video.id}
                  currentStatus={video.status}
                  errorMessage={video.error_message}
                />
              </div>
            ))}
          </div>
        </section>

        {/* VideoPreview Component */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            3. Video Preview
          </h2>
          <div className="space-y-4">
            {videos.slice(0, 2).map((video) => (
              <VideoPreview
                key={video.id}
                video={{
                  id: video.id,
                  title: video.title,
                  description: video.description || undefined,
                  thumbnail: video.thumbnail_url || undefined,
                  duration: video.duration_seconds || undefined,
                  fileSize: video.file_size_bytes || 0,
                  format: video.storage_path?.split('.').pop()?.toUpperCase() || 'MP4',
                  status: video.status,
                  createdAt: new Date(video.created_at),
                }}
                onUpdate={handleVideoUpdate}
                onDelete={handleVideoDelete}
              />
            ))}
          </div>
        </section>

        {/* VideoList Component */}
        <section>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">
            4. Video List
          </h2>
          <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6">
            <VideoList
              videos={videos}
              onVideoUpdate={handleVideoUpdate}
              onVideoDelete={handleVideoDelete}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
