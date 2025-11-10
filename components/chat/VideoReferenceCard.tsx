"use client";

import { type VideoReference } from "./ChatInterface";
import { Card } from "@/components/ui/Card";
import { Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface VideoReferenceCardProps {
  reference: VideoReference;
  onPlay?: (videoId: string, timestamp: number) => void;
  className?: string;
}

export function VideoReferenceCard({
  reference,
  onPlay,
  className,
}: VideoReferenceCardProps) {
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleClick = () => {
    onPlay?.(reference.videoId, reference.timestamp);
  };

  return (
    <Card
      className={cn(
        "group cursor-pointer overflow-hidden transition-all hover:shadow-lg",
        className
      )}
      padding="none"
      hover
    >
      <button
        onClick={handleClick}
        className="flex w-full gap-3 p-3 text-left"
        type="button"
      >
        {/* Thumbnail */}
        <div className="relative h-20 w-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
          {reference.thumbnailUrl ? (
            <img
              src={reference.thumbnailUrl}
              alt={reference.videoTitle}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
              <Play className="h-8 w-8 text-purple-600" />
            </div>
          )}

          {/* Play overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <div className="rounded-full bg-white p-2 shadow-lg">
              <Play className="h-5 w-5 text-gray-900" />
            </div>
          </div>

          {/* Timestamp badge */}
          <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded bg-black/80 px-1.5 py-0.5 text-xs text-white">
            <Clock className="h-3 w-3" />
            <span className="font-medium">
              {formatTimestamp(reference.timestamp)}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex min-w-0 flex-1 flex-col justify-between">
          {/* Title */}
          <h4 className="line-clamp-1 text-sm font-semibold text-gray-900 group-hover:text-purple-600">
            {reference.videoTitle}
          </h4>

          {/* Excerpt */}
          <p className="line-clamp-2 text-xs text-gray-600">
            {reference.excerpt}
          </p>

          {/* Footer */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Click to play</span>

            {/* Relevance score (optional) */}
            {reference.relevanceScore !== undefined && (
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-blue-600"
                    style={{
                      width: `${reference.relevanceScore * 100}%`,
                    }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600">
                  {Math.round(reference.relevanceScore * 100)}%
                </span>
              </div>
            )}
          </div>
        </div>
      </button>
    </Card>
  );
}
