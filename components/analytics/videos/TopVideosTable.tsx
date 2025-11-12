'use client';

import { useState } from 'react';
import { Badge } from '@whop/react/components';
import { Video, ArrowUpDown, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VideoData {
  id: string;
  title: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  source_type: string;
  views: number;
  avg_watch_time_seconds: number;
  completion_rate: number;
}

interface TopVideosTableProps {
  videos: VideoData[];
}

type SortColumn = 'title' | 'views' | 'avg_watch_time_seconds' | 'completion_rate';
type SortDirection = 'asc' | 'desc';

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function getSourceBadgeColor(sourceType: string): 'blue' | 'purple' | 'green' | 'orange' {
  switch (sourceType) {
    case 'youtube':
      return 'blue';
    case 'loom':
      return 'purple';
    case 'mux':
      return 'green';
    case 'upload':
      return 'orange';
    default:
      return 'blue';
  }
}

export function TopVideosTable({ videos }: TopVideosTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('views');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!videos || videos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Video className="w-12 h-12 text-gray-a8 mx-auto mb-3" />
          <p className="text-gray-11">No video data available</p>
          <p className="text-2 text-gray-10 mt-1">Videos will appear here once students start watching</p>
        </div>
      </div>
    );
  }

  // Filter videos by search query
  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];

    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    return 0;
  });

  // Paginate
  const paginatedVideos = sortedVideos.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(sortedVideos.length / itemsPerPage);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const handleRowClick = (videoId: string) => {
    router.push(`/dashboard/creator/videos/${videoId}`);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-11" />
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1); // Reset to first page on search
          }}
          className="w-full pl-10 pr-4 py-2 bg-gray-a2 border border-gray-a6 rounded-lg text-gray-12 placeholder-gray-11 focus:outline-none focus:ring-2 focus:ring-accent-9"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-a6">
        <table className="w-full">
          <thead className="bg-gray-a2 border-b border-gray-a6">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('title')}
                  className="flex items-center gap-2 text-3 font-medium text-gray-11 hover:text-gray-12"
                >
                  Video
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-center hidden md:table-cell">
                <span className="text-3 font-medium text-gray-11">Source</span>
              </th>
              <th className="px-4 py-3 text-right">
                <button
                  onClick={() => handleSort('views')}
                  className="flex items-center gap-2 ml-auto text-3 font-medium text-gray-11 hover:text-gray-12"
                >
                  Views
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right hidden sm:table-cell">
                <button
                  onClick={() => handleSort('avg_watch_time_seconds')}
                  className="flex items-center gap-2 ml-auto text-3 font-medium text-gray-11 hover:text-gray-12"
                >
                  Avg Watch Time
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
              <th className="px-4 py-3 text-right hidden lg:table-cell">
                <button
                  onClick={() => handleSort('completion_rate')}
                  className="flex items-center gap-2 ml-auto text-3 font-medium text-gray-11 hover:text-gray-12"
                >
                  Completion
                  <ArrowUpDown className="w-3 h-3" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-a4">
            {paginatedVideos.map((video) => (
              <tr
                key={video.id}
                onClick={() => handleRowClick(video.id)}
                className="hover:bg-gray-a2 transition-colors cursor-pointer"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {video.thumbnail_url ? (
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-16 h-10 rounded object-cover"
                      />
                    ) : (
                      <div className="w-16 h-10 bg-gray-a3 rounded flex items-center justify-center">
                        <Video className="w-5 h-5 text-gray-11" />
                      </div>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-3 text-gray-12 font-medium truncate">
                        {video.title}
                      </span>
                      <span className="text-2 text-gray-11">
                        {formatDuration(video.duration_seconds)}
                      </span>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden md:table-cell">
                  <Badge color={getSourceBadgeColor(video.source_type)} variant="soft">
                    {video.source_type}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-3 text-gray-12 text-right">
                  {video.views.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-3 text-gray-12 text-right hidden sm:table-cell">
                  {formatDuration(Math.round(video.avg_watch_time_seconds))}
                </td>
                <td className="px-4 py-3 text-right hidden lg:table-cell">
                  <Badge
                    color={
                      video.completion_rate >= 70
                        ? 'green'
                        : video.completion_rate >= 50
                          ? 'yellow'
                          : 'red'
                    }
                  >
                    {Math.round(video.completion_rate)}%
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <span className="text-3 text-gray-11">
          Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
          {Math.min(currentPage * itemsPerPage, sortedVideos.length)} of {sortedVideos.length}{' '}
          videos
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg hover:bg-gray-a3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 text-gray-11" />
          </button>
          <span className="text-3 text-gray-12 px-2">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg hover:bg-gray-a3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4 text-gray-11" />
          </button>
        </div>
      </div>
    </div>
  );
}
