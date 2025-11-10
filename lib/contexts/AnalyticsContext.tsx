'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export type SubscriptionTier = 'free' | 'starter' | 'pro' | 'enterprise';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface AnalyticsContextType {
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  refreshData: () => void;
  isLoading: boolean;
  creatorId: string;
  tier: SubscriptionTier;
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  lastUpdated: Date | null;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

interface AnalyticsProviderProps {
  children: React.ReactNode;
  creatorId: string;
  tier: SubscriptionTier;
}

// Date range presets
export const DATE_RANGE_PRESETS = {
  '7d': { label: 'Last 7 days', days: 7 },
  '30d': { label: 'Last 30 days', days: 30 },
  '90d': { label: 'Last 90 days', days: 90 },
  'thisMonth': { label: 'This Month', days: null },
  'lastMonth': { label: 'Last Month', days: null },
  'custom': { label: 'Custom Range', days: null },
} as const;

export type DateRangePreset = keyof typeof DATE_RANGE_PRESETS;

function getDateRangeFromPreset(preset: string): DateRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  switch (preset) {
    case '7d':
      return {
        start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
        end: today,
      };
    case '30d':
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: today,
      };
    case '90d':
      return {
        start: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000),
        end: today,
      };
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: today,
      };
    case 'lastMonth': {
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: lastMonthStart, end: lastMonthEnd };
    }
    default:
      // Default to last 30 days
      return {
        start: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000),
        end: today,
      };
  }
}

export function AnalyticsProvider({ children, creatorId, tier }: AnalyticsProviderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Initialize date range from URL params or default to 30 days
  const [dateRange, setDateRangeState] = useState<DateRange>(() => {
    const rangeParam = searchParams.get('dateRange') || '30d';
    return getDateRangeFromPreset(rangeParam);
  });

  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Update URL when date range changes
  const setDateRange = useCallback((range: DateRange) => {
    setDateRangeState(range);
    setLastUpdated(new Date());

    // Update URL params
    const params = new URLSearchParams(searchParams.toString());
    params.set('dateRange', 'custom');
    params.set('start', range.start.toISOString());
    params.set('end', range.end.toISOString());
    router.push(`?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  // Manual refresh trigger
  const refreshData = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
    setLastUpdated(new Date());
  }, []);

  // Auto-refresh every 60 seconds if enabled
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refreshData();
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshData]);

  // Set last updated on mount
  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  const value: AnalyticsContextType = {
    dateRange,
    setDateRange,
    refreshData,
    isLoading,
    creatorId,
    tier,
    autoRefresh,
    setAutoRefresh,
    lastUpdated,
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}

export function useAnalytics() {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  return context;
}

// Helper hook for data fetching with analytics context
export function useAnalyticsData<T>(
  fetcher: (dateRange: DateRange, creatorId: string) => Promise<T>,
  dependencies: any[] = []
) {
  const { dateRange, creatorId } = useAnalytics();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const result = await fetcher(dateRange, creatorId);
        if (!cancelled) {
          setData(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error('Unknown error'));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [dateRange, creatorId, ...dependencies]);

  return { data, loading, error, refetch: () => fetcher(dateRange, creatorId) };
}
