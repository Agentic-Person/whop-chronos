'use client';

import { useState } from 'react';
import { Loader, Youtube, CheckCircle } from 'lucide-react';
import VideoPreviewCard from '../VideoPreviewCard';
import { extractYouTubeVideoId } from '@/lib/video/youtube-processor';

interface YouTubeTabProps {
  creatorId: string;
  onImport: (data: { url: string; title?: string }) => void;
  showPreview?: boolean;
}

interface VideoPreview {
  videoId: string;
  title: string;
  duration: number;
  thumbnail: string;
  channelName: string;
  description: string;
}

export default function YouTubeTab({
  creatorId: _creatorId,
  onImport,
  showPreview = true,
}: YouTubeTabProps) {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateYouTubeUrl = (urlString: string): boolean => {
    try {
      extractYouTubeVideoId(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setUrl(value);
    setError(null);
    setPreview(null);
  };

  const handleFetchPreview = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      setError('Invalid YouTube URL format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use YouTube-specific preview endpoint (uses youtubei.js, not yt-dlp)
      const response = await fetch('/api/video/youtube/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url.trim() }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to fetch video metadata');
      }

      setPreview({
        videoId: data.videoId,
        title: data.title || 'Untitled Video',
        duration: data.duration || 0,
        thumbnail: data.thumbnail || '',
        channelName: data.channelName || 'Unknown Channel',
        description: data.description || '',
      });
    } catch (err) {
      console.error('Preview fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preview');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    if (!validateYouTubeUrl(url)) {
      setError('Invalid YouTube URL format');
      return;
    }

    onImport({
      url: url.trim(),
      title: preview?.title,
    });
  };

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-12">
          YouTube URL <span className="text-red-11">*</span>
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => handleUrlChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !preview) {
                handleFetchPreview();
              }
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="flex-1 px-3 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:ring-2 focus:ring-purple-7 focus:border-transparent"
          />
          {showPreview && (
            <button
              onClick={handleFetchPreview}
              disabled={!url.trim() || loading}
              className="px-4 py-2 bg-gray-4 text-gray-12 rounded-lg hover:bg-gray-5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading
                </>
              ) : (
                'Fetch Preview'
              )}
            </button>
          )}
        </div>
        <p className="text-xs text-gray-11">
          Supports youtube.com/watch, youtu.be, and youtube.com/embed URLs
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-3 border border-red-6 rounded-lg">
          <p className="text-sm text-red-11">{error}</p>
        </div>
      )}

      {/* Video Preview */}
      {preview && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-green-11">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Preview loaded</span>
          </div>

          <VideoPreviewCard
            thumbnail={preview.thumbnail}
            title={preview.title}
            duration={preview.duration}
            channel={preview.channelName}
            description={preview.description}
            source="youtube"
          />

          <button
            onClick={handleImport}
            className="w-full px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Youtube className="w-5 h-5" />
            Import YouTube Video
          </button>
        </div>
      )}

      {/* Import without Preview */}
      {!showPreview && !preview && (
        <button
          onClick={handleImport}
          disabled={!url.trim()}
          className="w-full px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
        >
          <Youtube className="w-5 h-5" />
          Import YouTube Video
        </button>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-3 border border-blue-6 rounded-lg">
        <p className="text-xs text-blue-11">
          <strong>How it works:</strong> We'll extract the video transcript using YouTube's API,
          chunk it into searchable segments, and generate embeddings for AI-powered chat.
          This process takes 2-5 minutes depending on video length.
        </p>
      </div>
    </div>
  );
}
