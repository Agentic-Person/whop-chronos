'use client';

import { useEffect, useState } from 'react';

export default function VideosPage() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchVideos() {
      try {
        // TODO: Replace with actual API endpoint
        const response = await fetch('/api/videos?creatorId=00000000-0000-0000-0000-000000000001');
        if (response.ok) {
          const data = await response.json();
          setVideos(data.videos || []);
        }
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-9 mx-auto mb-4"></div>
          <p className="text-gray-11">Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-7 font-bold text-gray-12">Videos</h1>
          <p className="text-3 text-gray-11 mt-1">Manage your video library</p>
        </div>
        <button className="px-4 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors">
          Upload Video
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="border border-dashed border-gray-a6 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-11"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3 className="mt-4 text-4 font-semibold text-gray-12">No videos yet</h3>
          <p className="mt-2 text-3 text-gray-11">Get started by uploading your first video</p>
          <button className="mt-6 px-4 py-2 bg-blue-9 text-white rounded-lg hover:bg-blue-10 transition-colors">
            Upload Video
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <div key={video.id} className="border border-gray-a4 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-gray-a3 flex items-center justify-center">
                <svg
                  className="h-12 w-12 text-gray-11"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-12 mb-1">{video.title}</h3>
                <p className="text-sm text-gray-11 mb-2">{video.description}</p>
                <div className="flex justify-between items-center text-xs text-gray-11">
                  <span>{video.status}</span>
                  <span>{Math.floor(video.duration_seconds / 60)} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
