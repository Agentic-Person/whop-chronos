'use client';

import { useState, useEffect } from 'react';
import { X, Search, Play, Clock, Eye, Upload } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  duration: number;
  views: number;
  watchTime: number;
  uploadDate: string;
}

interface VideoLibraryPickerProps {
  onVideoSelected: (video: Video) => void;
  onClose: () => void;
  onUploadNewVideo: () => void;
}

// Heat meter color based on view percentage
function getHeatColor(views: number, maxViews: number): string {
  if (maxViews === 0) return '#10b981'; // green
  const percentage = (views / maxViews) * 100;
  if (percentage < 25) return '#10b981'; // green
  if (percentage < 50) return '#fbbf24'; // yellow
  if (percentage < 75) return '#f97316'; // orange
  return '#ef4444'; // red
}

function getHeatLabel(views: number, maxViews: number): string {
  if (maxViews === 0) return 'Cold';
  const percentage = (views / maxViews) * 100;
  if (percentage < 25) return 'Cold';
  if (percentage < 50) return 'Warm';
  if (percentage < 75) return 'Hot';
  return 'RED HOT';
}

export default function VideoLibraryPicker({
  onVideoSelected,
  onClose,
  onUploadNewVideo,
}: VideoLibraryPickerProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxViews, setMaxViews] = useState(0);

  useEffect(() => {
    // Fetch videos from API
    async function fetchVideos() {
      try {
        const response = await fetch('/api/video');
        if (!response.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await response.json();

        // Transform API response to Video format
        const apiVideos: Video[] = (data.data || []).map((video: any) => ({
          id: video.id,
          title: video.title || 'Untitled Video',
          description: video.description || '',
          thumbnail: video.thumbnail_url || 'https://placehold.co/320x180/1a1a1a/666666?text=Video',
          duration: video.duration_seconds || 0,
          views: 0, // TODO: Fetch from analytics
          watchTime: 0, // TODO: Fetch from analytics
          uploadDate: video.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
        }));

        setVideos(apiVideos);
        const max = Math.max(...apiVideos.map((v: Video) => v.views), 0);
        setMaxViews(max);
      } catch (error) {
        console.error('Error fetching videos:', error);
        // Fallback to empty array on error
        setVideos([]);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-2 border border-gray-6 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-12">Video Library</h2>
            <p className="text-sm text-gray-11 mt-1">Select a video to add to your lesson</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-11 hover:text-gray-12 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search videos..."
              className="w-full pl-10 pr-4 py-2 bg-gray-3 border border-gray-6 rounded-lg text-gray-12 placeholder:text-gray-9 focus:outline-none focus:border-blue-8 focus:ring-1 focus:ring-blue-8"
            />
          </div>
        </div>

        {/* Video Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-9 mx-auto mb-4"></div>
                <p className="text-gray-11">Loading videos...</p>
              </div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-11">No videos found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredVideos.map((video) => {
                const heatColor = getHeatColor(video.views, maxViews);
                const heatLabel = getHeatLabel(video.views, maxViews);

                return (
                  <button
                    key={video.id}
                    onClick={() => onVideoSelected(video)}
                    className="flex gap-4 p-4 border border-gray-6 rounded-lg hover:border-blue-7 hover:bg-gray-3 transition-all text-left group"
                  >
                    {/* Thumbnail */}
                    <div className="relative flex-shrink-0 w-40 h-24 bg-gray-4 rounded overflow-hidden">
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/80 rounded text-xs text-white">
                        {Math.floor(video.duration / 60)}:{(video.duration % 60).toString().padStart(2, '0')}
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-12 mb-1 truncate group-hover:text-blue-11 transition-colors">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-11 line-clamp-2 mb-3">
                        {video.description}
                      </p>

                      {/* Stats */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-xs text-gray-11">
                          <div className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            <span>{video.views.toLocaleString()} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{Math.floor(video.watchTime / 60)} min watched</span>
                          </div>
                        </div>

                        {/* Heat Meter */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-11">Performance</span>
                            <span
                              className="font-medium"
                              style={{ color: heatColor }}
                            >
                              {heatLabel}
                            </span>
                          </div>
                          <div className="h-1.5 bg-gray-5 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${maxViews > 0 ? (video.views / maxViews) * 100 : 0}%`,
                                backgroundColor: heatColor,
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-10">
                        Uploaded {new Date(video.uploadDate).toLocaleDateString()}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-6">
          <button
            onClick={onUploadNewVideo}
            className="flex items-center gap-2 px-4 py-2 bg-green-9 hover:bg-green-10 text-white rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Upload New Video
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-11 hover:text-gray-12 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
