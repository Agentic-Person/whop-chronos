"use client";

import { Play, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatTimestamp, getTimestampTooltip } from "@/lib/utils/time-format";
import { useState } from "react";

interface TimestampBadgeProps {
  seconds: number;
  onClick: () => void;
  isActive?: boolean;
  className?: string;
}

/**
 * Clickable timestamp badge with hover effects and animations
 *
 * Features:
 * - Play icon on hover
 * - Ripple effect on click
 * - Tooltip with "Jump to {timestamp}"
 * - Active state for current timestamp
 * - Accessible keyboard navigation
 */
export function TimestampBadge({
  seconds,
  onClick,
  isActive = false,
  className,
}: TimestampBadgeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  const handleClick = () => {
    setIsPressed(true);
    onClick();
    setTimeout(() => setIsPressed(false), 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        // Base styles
        "group relative inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-all",
        // Focus styles
        "focus:outline-none focus:ring-2 focus:ring-purple-9 focus:ring-offset-2",
        // Hover styles
        "hover:shadow-md hover:scale-105",
        // Active state
        isActive
          ? "bg-gradient-to-br from-purple-9 to-blue-9 text-white shadow-md"
          : "bg-black/80 text-white hover:bg-black/90",
        // Pressed animation
        isPressed && "scale-95",
        className
      )}
      type="button"
      title={getTimestampTooltip(seconds)}
      aria-label={getTimestampTooltip(seconds)}
    >
      {/* Icon with smooth transition */}
      <div
        className={cn(
          "transition-transform duration-200",
          isHovered ? "scale-110" : "scale-100"
        )}
      >
        {isHovered || isActive ? (
          <Play className="h-3 w-3 fill-current" />
        ) : (
          <Clock className="h-3 w-3" />
        )}
      </div>

      {/* Timestamp text */}
      <span className="font-semibold tabular-nums">
        {formatTimestamp(seconds)}
      </span>

      {/* Ripple effect on click */}
      {isPressed && (
        <span className="absolute inset-0 animate-ping rounded-full bg-white/30" />
      )}

      {/* Hover glow effect */}
      <span
        className={cn(
          "absolute inset-0 -z-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 opacity-0 blur-md transition-opacity duration-200",
          isHovered && "opacity-50"
        )}
      />
    </button>
  );
}
