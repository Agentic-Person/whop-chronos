/**
 * UsageMetersGrid Component
 *
 * Grid layout displaying all usage meters for a creator
 */

'use client';

import { useEffect, useState } from 'react';
import { UsageMeter } from './UsageMeter';
import type { UsageStats } from './usage-types';

interface UsageMetersGridProps {
  creatorId: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  onUpgrade?: (tier: string) => void;
}

export function UsageMetersGrid({
  creatorId,
  tier: _tier,
  onUpgrade,
}: UsageMetersGridProps) {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch usage data
  const fetchUsage = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/analytics/usage?creatorId=${creatorId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch usage data');
      }

      const data = await response.json();
      setUsage(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchUsage, 60000);
    return () => clearInterval(interval);
  }, [creatorId]);

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-lg border border-gray-200 bg-gray-50"
          />
        ))}
      </div>
    );
  }

  if (error || !usage) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
        Error loading usage data: {error}
      </div>
    );
  }

  const handleUpgrade = () => {
    if (onUpgrade && usage.suggestedTier) {
      onUpgrade(usage.suggestedTier);
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UsageMeter
        label="Videos"
        current={usage.usage.videos.current}
        limit={usage.usage.videos.limit}
        unit="videos"
        onUpgradeClick={handleUpgrade}
      />

      <UsageMeter
        label="Storage"
        current={usage.usage.storage_gb.current}
        limit={usage.usage.storage_gb.limit}
        unit="GB"
        onUpgradeClick={handleUpgrade}
      />

      <UsageMeter
        label="AI Messages"
        current={usage.usage.ai_messages.current}
        limit={usage.usage.ai_messages.limit}
        unit="messages/month"
        onUpgradeClick={handleUpgrade}
      />

      <UsageMeter
        label="Students"
        current={usage.usage.students.current}
        limit={usage.usage.students.limit}
        unit="students"
        onUpgradeClick={handleUpgrade}
      />

      <UsageMeter
        label="Courses"
        current={usage.usage.courses.current}
        limit={usage.usage.courses.limit}
        unit="courses"
        onUpgradeClick={handleUpgrade}
      />
    </div>
  );
}
