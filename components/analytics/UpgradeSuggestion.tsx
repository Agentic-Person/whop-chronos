/**
 * UpgradeSuggestion Component
 *
 * Smart suggestion card recommending tier upgrade based on usage patterns
 */

'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, ArrowRight } from 'lucide-react';
import { TIER_LIMITS, type SubscriptionTier } from './usage-types';
import type { UsageStats } from './usage-types';

interface UpgradeSuggestionProps {
  creatorId: string;
  tier: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
  onViewPlans?: () => void;
}

const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const TIER_PRICES: Record<SubscriptionTier, number> = {
  free: 0,
  basic: 29,
  pro: 99,
  enterprise: 0, // Custom
};

export function UpgradeSuggestion({
  creatorId,
  tier,
  onUpgrade,
  onViewPlans,
}: UpgradeSuggestionProps) {
  const [suggestion, setSuggestion] = useState<{
    suggestedTier: SubscriptionTier;
    reason: string;
    benefits: string[];
    roi?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAndAnalyze = async () => {
      try {
        const response = await fetch(`/api/analytics/usage?creatorId=${creatorId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }

        const data: UsageStats = await response.json();
        analyzeSuggestion(data);
      } catch (err) {
        console.error('Error analyzing upgrade suggestion:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAndAnalyze();
  }, [creatorId]);

  const analyzeSuggestion = (usage: UsageStats) => {
    // No suggestion if already on enterprise or no suggested tier
    if (tier === 'enterprise' || !usage.suggestedTier) {
      setSuggestion(null);
      return;
    }

    // Find which limit is hit most frequently
    const usagePercentages = [
      { key: 'videos', percentage: usage.usage.videos.percentage },
      { key: 'storage', percentage: usage.usage.storage_gb.percentage },
      { key: 'ai_messages', percentage: usage.usage.ai_messages.percentage },
      { key: 'students', percentage: usage.usage.students.percentage },
      { key: 'courses', percentage: usage.usage.courses.percentage },
    ];

    const topUsage = usagePercentages.sort((a, b) => b.percentage - a.percentage)[0];

    // Generate reason
    let reason = `You're using ${topUsage?.percentage.toFixed(0)}% of your ${topUsage?.key} limit`;

    // Generate benefits
    const suggestedLimits = TIER_LIMITS[usage.suggestedTier];
    const currentLimits = TIER_LIMITS[tier];

    const benefits: string[] = [];

    if (
      suggestedLimits.videos > currentLimits.videos ||
      suggestedLimits.videos === -1
    ) {
      benefits.push(
        suggestedLimits.videos === -1
          ? 'Unlimited videos'
          : `${suggestedLimits.videos} videos (vs ${currentLimits.videos})`,
      );
    }

    if (
      suggestedLimits.storage_gb > currentLimits.storage_gb ||
      suggestedLimits.storage_gb === -1
    ) {
      benefits.push(`${suggestedLimits.storage_gb} GB storage`);
    }

    if (
      suggestedLimits.ai_messages_per_month >
        currentLimits.ai_messages_per_month ||
      suggestedLimits.ai_messages_per_month === -1
    ) {
      benefits.push(
        suggestedLimits.ai_messages_per_month === -1
          ? 'Unlimited AI messages'
          : `${suggestedLimits.ai_messages_per_month.toLocaleString()} AI messages/month`,
      );
    }

    // Calculate ROI (simplified)
    const currentPrice = TIER_PRICES[tier];
    const suggestedPrice = TIER_PRICES[usage.suggestedTier];
    const priceDiff = suggestedPrice - currentPrice;

    let roi: string | undefined;
    if (priceDiff > 0) {
      roi = `For just $${priceDiff}/month more, unlock ${benefits.length} additional features`;
    }

    setSuggestion({
      suggestedTier: usage.suggestedTier,
      reason,
      benefits,
      roi,
    });
  };

  if (loading) return null;
  if (!suggestion) return null;

  return (
    <div className="overflow-hidden rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="p-6">
        <div className="mb-4 flex items-start gap-3">
          <div className="rounded-full bg-blue-100 p-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Recommended: Upgrade to {TIER_NAMES[suggestion.suggestedTier]}
            </h3>
            <p className="mt-1 text-sm text-gray-600">{suggestion.reason}</p>
          </div>
        </div>

        {/* Benefits */}
        <div className="mb-4 space-y-2">
          {suggestion.benefits.map((benefit, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm text-gray-700">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
              <span>{benefit}</span>
            </div>
          ))}
        </div>

        {/* ROI */}
        {suggestion.roi && (
          <div className="mb-4 rounded-md bg-white/50 p-3">
            <p className="text-sm font-medium text-gray-900">{suggestion.roi}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row">
          {onUpgrade && (
            <button
              onClick={() => onUpgrade(suggestion.suggestedTier)}
              className="flex items-center justify-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
              type="button"
            >
              Upgrade to {TIER_NAMES[suggestion.suggestedTier]}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}

          {onViewPlans && (
            <button
              onClick={onViewPlans}
              className="flex items-center justify-center gap-2 rounded-md border border-blue-600 bg-white px-4 py-2 text-sm font-medium text-blue-600 transition hover:bg-blue-50"
              type="button"
            >
              See All Plans
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
