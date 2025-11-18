'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circle' | 'text';
  animation?: 'pulse' | 'wave' | 'none';
}

/**
 * Skeleton Component
 *
 * Loading placeholder component that shows a shimmer effect.
 * Used to indicate content is loading without blocking the UI.
 *
 * Usage:
 * ```tsx
 * <Skeleton className="w-full h-96" />
 * <Skeleton variant="circle" className="w-12 h-12" />
 * <Skeleton variant="text" className="w-3/4 h-4" />
 * ```
 */
export function Skeleton({
  className,
  variant = 'default',
  animation = 'pulse',
}: SkeletonProps) {
  const baseClasses = 'bg-gray-200';

  const variantClasses = {
    default: 'rounded',
    circle: 'rounded-full',
    text: 'rounded h-4',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]',
    none: '',
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        animationClasses[animation],
        className
      )}
      aria-hidden="true"
    />
  );
}

/**
 * Video Player Skeleton
 * Pre-configured skeleton for video player loading state
 */
export function VideoPlayerSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('aspect-video w-full bg-gray-900 rounded-lg overflow-hidden', className)}>
      <div className="w-full h-full flex flex-col items-center justify-center p-8 space-y-4">
        <Skeleton variant="circle" className="w-16 h-16 bg-gray-700" />
        <Skeleton className="w-48 h-4 bg-gray-700" />
        <Skeleton className="w-32 h-3 bg-gray-700" />
      </div>
    </div>
  );
}

/**
 * Chat Message Skeleton
 * Pre-configured skeleton for chat messages
 */
export function ChatMessageSkeleton({ align = 'left' }: { align?: 'left' | 'right' }) {
  return (
    <div className={cn('flex gap-3', align === 'right' && 'flex-row-reverse')}>
      <Skeleton variant="circle" className="w-8 h-8 flex-shrink-0" />
      <div className="flex-1 space-y-2 max-w-md">
        <Skeleton className="w-3/4 h-16" />
        <Skeleton className="w-1/4 h-3" />
      </div>
    </div>
  );
}

/**
 * Chat Interface Skeleton
 * Complete skeleton for chat interface loading
 */
export function ChatInterfaceSkeleton() {
  return (
    <div className="h-full flex flex-col p-4 space-y-4">
      <ChatMessageSkeleton align="left" />
      <ChatMessageSkeleton align="right" />
      <ChatMessageSkeleton align="left" />
      <div className="flex-1" />
      <Skeleton className="w-full h-12" />
    </div>
  );
}

/**
 * Metadata Panel Skeleton
 * Skeleton for video metadata sidebar
 */
export function MetadataPanelSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="w-full h-6" />
      <Skeleton className="w-3/4 h-4" />
      <Skeleton className="w-1/2 h-4" />
      <div className="pt-4 space-y-2">
        <Skeleton className="w-full h-3" />
        <Skeleton className="w-5/6 h-3" />
        <Skeleton className="w-4/6 h-3" />
      </div>
    </div>
  );
}

/**
 * Text Line Skeleton
 * Useful for simulating paragraphs of text
 */
export function TextLineSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          className={cn(
            'w-full',
            i === lines - 1 && 'w-3/4' // Last line shorter
          )}
        />
      ))}
    </div>
  );
}

/**
 * Card Skeleton
 * Skeleton for card-based layouts
 */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('border border-gray-200 rounded-lg p-4 space-y-3', className)}>
      <Skeleton className="w-1/3 h-5" />
      <TextLineSkeleton lines={2} />
      <div className="flex gap-2 pt-2">
        <Skeleton className="w-20 h-8" />
        <Skeleton className="w-20 h-8" />
      </div>
    </div>
  );
}
