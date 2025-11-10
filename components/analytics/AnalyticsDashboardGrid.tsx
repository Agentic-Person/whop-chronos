'use client';

import { cn } from '@/lib/utils';

interface AnalyticsDashboardGridProps {
  children: React.ReactNode;
  columns?: 1 | 2 | 3 | 4;
  className?: string;
}

export function AnalyticsDashboardGrid({
  children,
  columns = 4,
  className,
}: AnalyticsDashboardGridProps) {
  const gridClasses = cn(
    'grid gap-6',
    {
      'grid-cols-1': columns === 1,
      'grid-cols-1 md:grid-cols-2': columns === 2,
      'grid-cols-1 md:grid-cols-2 lg:grid-cols-3': columns === 3,
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4': columns === 4,
    },
    className
  );

  return <div className={gridClasses}>{children}</div>;
}

interface DashboardSectionProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function DashboardSection({
  title,
  description,
  children,
  className,
  action,
}: DashboardSectionProps) {
  return (
    <section className={cn('flex flex-col gap-4', className)}>
      {(title || description || action) && (
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            {title && <h2 className="text-6 font-semibold text-gray-12">{title}</h2>}
            {description && <p className="text-3 text-gray-11">{description}</p>}
          </div>
          {action && <div className="flex-shrink-0">{action}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  span?: 1 | 2 | 3 | 4 | 'full';
}

export function DashboardCard({ children, className, span = 1 }: DashboardCardProps) {
  const spanClasses = cn({
    'col-span-1': span === 1,
    'col-span-1 md:col-span-2': span === 2,
    'col-span-1 md:col-span-2 lg:col-span-3': span === 3,
    'col-span-1 md:col-span-2 lg:col-span-4': span === 4,
    'col-span-full': span === 'full',
  });

  return <div className={cn(spanClasses, className)}>{children}</div>;
}
