'use client';

import { useState, useEffect } from 'react';
import type { VideoReferenceData } from './chat-types';

interface VideoReferenceHeatmapProps {
  creatorId: string;
}

type Frequency = 'daily' | 'weekly' | 'monthly';

export function VideoReferenceHeatmap({ creatorId }: VideoReferenceHeatmapProps) {
  const [data, setData] = useState<VideoReferenceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/analytics/chat?creatorId=${creatorId}&metric=video-references`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch video reference data');
        }

        const result = await response.json();
        setData(result.data || []);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setData([]);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [creatorId]);

  const getColorIntensity = (value: number, max: number): string => {
    if (value === 0) return 'bg-gray-100 dark:bg-gray-800';

    const intensity = value / max;
    if (intensity >= 0.8) return 'bg-blue-600 dark:bg-blue-500';
    if (intensity >= 0.6) return 'bg-blue-500 dark:bg-blue-600';
    if (intensity >= 0.4) return 'bg-blue-400 dark:bg-blue-700';
    if (intensity >= 0.2) return 'bg-blue-300 dark:bg-blue-800';
    return 'bg-blue-200 dark:bg-blue-900';
  };

  const getMaxValue = (frequency: Frequency): number => {
    return Math.max(...data.map((d) => d[frequency]), 1);
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading video references...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">No video reference data available</div>
      </div>
    );
  }

  const frequencies: Frequency[] = ['daily', 'weekly', 'monthly'];

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Video Reference Heatmap
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Which videos are referenced most frequently in AI responses
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-gray-700 dark:text-gray-300 uppercase bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-4 py-3 text-left sticky left-0 bg-gray-50 dark:bg-gray-800">
                Video Title
              </th>
              <th className="px-4 py-3 text-center">Daily</th>
              <th className="px-4 py-3 text-center">Weekly</th>
              <th className="px-4 py-3 text-center">Monthly</th>
            </tr>
          </thead>
          <tbody>
            {data.map((video, index) => (
              <tr
                key={video.videoId}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  selectedVideo === video.videoId
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'bg-white dark:bg-gray-900'
                } hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer`}
                onClick={() =>
                  setSelectedVideo(selectedVideo === video.videoId ? null : video.videoId)
                }
              >
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white sticky left-0 bg-inherit">
                  <div className="max-w-xs truncate" title={video.videoTitle}>
                    {video.videoTitle}
                  </div>
                </td>
                {frequencies.map((freq) => {
                  const value = video[freq];
                  const max = getMaxValue(freq);
                  return (
                    <td key={freq} className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <div
                          className={`w-16 h-8 rounded flex items-center justify-center text-xs font-medium ${getColorIntensity(
                            value,
                            max
                          )} ${value > 0 ? 'text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                          {value}
                        </div>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedVideo && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
            Selected: {data.find((v) => v.videoId === selectedVideo)?.videoTitle}
          </div>
          <div className="text-sm text-blue-700 dark:text-blue-300">
            Click to view example chat contexts where this video was referenced (feature coming soon)
          </div>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Total videos referenced: {data.length}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Low</span>
          <div className="flex gap-1">
            <div className="w-6 h-6 bg-blue-200 dark:bg-blue-900 rounded"></div>
            <div className="w-6 h-6 bg-blue-300 dark:bg-blue-800 rounded"></div>
            <div className="w-6 h-6 bg-blue-400 dark:bg-blue-700 rounded"></div>
            <div className="w-6 h-6 bg-blue-500 dark:bg-blue-600 rounded"></div>
            <div className="w-6 h-6 bg-blue-600 dark:bg-blue-500 rounded"></div>
          </div>
          <span className="text-xs text-gray-600 dark:text-gray-400">High</span>
        </div>
      </div>
    </div>
  );
}
