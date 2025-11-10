'use client';

import { Card } from '@whop/react/components';
import { cn } from '@/lib/utils';

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex flex-col gap-2">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="w-32 h-10" />
          <Skeleton className="w-24 h-10" />
        </div>
      </div>

      {/* Quick Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="w-12 h-5" />
              </div>
              <Skeleton className="w-24 h-8" />
              <Skeleton className="w-20 h-4" />
              <Skeleton className="w-full h-8" />
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-full h-64" />
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <Skeleton className="w-48 h-6" />
            <Skeleton className="w-full h-64" />
          </div>
        </Card>
      </div>

      {/* Full Width Chart Skeleton */}
      <Card className="p-6">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <Skeleton className="w-56 h-6" />
            <Skeleton className="w-32 h-8" />
          </div>
          <Skeleton className="w-full h-96" />
        </div>
      </Card>
    </div>
  );
}

interface SkeletonProps {
  className?: string;
}

function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-a3 rounded-md',
        className
      )}
    />
  );
}

export function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <Skeleton className="w-48 h-6" />
        <div className="flex flex-col gap-3">
          {[...Array(rows)].map((_, i) => (
            <Skeleton key={i} className="w-full h-12" />
          ))}
        </div>
      </div>
    </Card>
  );
}

export function ChartSkeleton({ height = 'h-64' }: { height?: string }) {
  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-24 h-8" />
        </div>
        <Skeleton className={cn('w-full', height)} />
      </div>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3">
        <div className="flex justify-between">
          <Skeleton className="w-10 h-10 rounded-lg" />
          <Skeleton className="w-12 h-5" />
        </div>
        <Skeleton className="w-24 h-8" />
        <Skeleton className="w-20 h-4" />
      </div>
    </Card>
  );
}
