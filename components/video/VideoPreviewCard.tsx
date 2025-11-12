'use client';

import { Clock, User, Youtube, Link as LinkIcon, Zap } from 'lucide-react';

export interface VideoPreviewCardProps {
  thumbnail: string;
  title: string;
  duration: number; // in seconds
  channel?: string; // For YouTube
  description?: string;
  source: 'youtube' | 'loom' | 'whop' | 'upload';
}

export default function VideoPreviewCard({
  thumbnail,
  title,
  duration,
  channel,
  description,
  source,
}: VideoPreviewCardProps) {
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getSourceIcon = () => {
    switch (source) {
      case 'youtube':
        return <Youtube className="w-4 h-4" />;
      case 'loom':
        return <LinkIcon className="w-4 h-4" />;
      case 'whop':
        return <Zap className="w-4 h-4" />;
      case 'upload':
        return <User className="w-4 h-4" />;
    }
  };

  const getSourceLabel = () => {
    switch (source) {
      case 'youtube':
        return 'YouTube';
      case 'loom':
        return 'Loom';
      case 'whop':
        return 'Whop';
      case 'upload':
        return 'Upload';
    }
  };

  const getSourceColor = () => {
    switch (source) {
      case 'youtube':
        return 'text-red-11 bg-red-3';
      case 'loom':
        return 'text-purple-11 bg-purple-3';
      case 'whop':
        return 'text-blue-11 bg-blue-3';
      case 'upload':
        return 'text-green-11 bg-green-3';
    }
  };

  return (
    <div className="border border-gray-6 rounded-lg overflow-hidden bg-gray-2">
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-3">
        {thumbnail ? (
          <>
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
            />
            {/* Duration Badge */}
            {duration > 0 && (
              <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 rounded text-white text-xs font-medium">
                {formatDuration(duration)}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-5 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-gray-9" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" />
                </svg>
              </div>
              <p className="text-sm text-gray-11">No thumbnail available</p>
            </div>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="text-sm font-semibold text-gray-12 line-clamp-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-xs text-gray-11 line-clamp-2">
            {description}
          </p>
        )}

        {/* Info Row */}
        <div className="flex items-center justify-between gap-4 text-xs text-gray-11">
          {/* Source Badge */}
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${getSourceColor()}`}>
            {getSourceIcon()}
            <span className="font-medium">{getSourceLabel()}</span>
          </div>

          {/* Channel/Duration */}
          <div className="flex items-center gap-3">
            {channel && (
              <div className="flex items-center gap-1">
                <User className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{channel}</span>
              </div>
            )}
            {duration > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{formatDuration(duration)}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
