'use client';

import { useState } from 'react';
import { Loader, Link as LinkIcon, CheckCircle } from 'lucide-react';
import VideoPreviewCard from '../VideoPreviewCard';
import { extractLoomVideoId } from '@/lib/video/loom-processor';

interface LoomTabProps {
  creatorId: string;
  onImport: (data: { url: string; title?: string }) => void;
  showPreview?: boolean;
}

interface VideoPreview {
  videoId: string;
  title: string;
  duration: number;
  thumbnail: string;
  creatorName: string;
  description: string;
}

export default function LoomTab({
  creatorId: _creatorId,
  onImport,
  showPreview = true,
}: LoomTabProps) {
  const [url, setUrl] = useState('');
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateLoomUrl = (urlString: string): boolean => {
    try {
      extractLoomVideoId(urlString);
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
      setError('Please enter a Loom URL');
      return;
    }

    if (!validateLoomUrl(url)) {
      setError('Invalid Loom URL format');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call Loom metadata API
      const response = await fetch('/api/video/loom/metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoUrl: url.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch video metadata');
      }

      const metadata = await response.json();

      setPreview({
        videoId: extractLoomVideoId(url),
        title: metadata.title || 'Untitled Video',
        duration: metadata.duration || 0,
        thumbnail: metadata.thumbnail || '',
        creatorName: metadata.creatorName || 'Unknown Creator',
        description: metadata.description || '',
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
      setError('Please enter a Loom URL');
      return;
    }

    if (!validateLoomUrl(url)) {
      setError('Invalid Loom URL format');
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
          Loom URL <span className="text-red-11">*</span>
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
            placeholder="https://www.loom.com/share/..."
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
          Supports loom.com/share and loom.com/embed URLs
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
            channel={preview.creatorName}
            description={preview.description}
            source="loom"
          />

          <button
            onClick={handleImport}
            className="w-full px-6 py-3 bg-purple-9 text-white rounded-lg hover:bg-purple-10 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <LinkIcon className="w-5 h-5" />
            Import Loom Video
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
          <LinkIcon className="w-5 h-5" />
          Import Loom Video
        </button>
      )}

      {/* Instructions */}
      <div className="p-4 bg-blue-3 border border-blue-6 rounded-lg">
        <p className="text-xs text-blue-11">
          <strong>How it works:</strong> We'll extract the video transcript using Loom's free API,
          chunk it into searchable segments, and generate embeddings for AI-powered chat.
          This process takes 2-5 minutes depending on video length.
        </p>
      </div>
    </div>
  );
}
