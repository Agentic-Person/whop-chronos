/**
 * TierComparisonTable Component
 *
 * Comparison table showing current tier vs upgrade options
 */

'use client';

import { Check, X } from 'lucide-react';
import { TIER_LIMITS, type SubscriptionTier } from './usage-types';
import { cn } from '@/lib/utils';

interface TierComparisonTableProps {
  currentTier: SubscriptionTier;
  onUpgrade?: (tier: SubscriptionTier) => void;
}

const TIER_NAMES: Record<SubscriptionTier, string> = {
  free: 'Free',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
};

const TIER_PRICES: Record<SubscriptionTier, string> = {
  free: '$0',
  basic: '$29',
  pro: '$99',
  enterprise: 'Custom',
};

const TIER_ORDER: SubscriptionTier[] = ['free', 'basic', 'pro', 'enterprise'];

export function TierComparisonTable({
  currentTier,
  onUpgrade,
}: TierComparisonTableProps) {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const displayTiers = TIER_ORDER.slice(currentIndex);

  const formatLimit = (value: number): string => {
    if (value === -1) return 'Unlimited';
    return value.toLocaleString();
  };

  const features = [
    { key: 'videos', label: 'Videos' },
    { key: 'storage_gb', label: 'Storage' },
    { key: 'ai_messages_per_month', label: 'AI Messages/Month' },
    { key: 'students', label: 'Students' },
    { key: 'courses', label: 'Courses' },
  ] as const;

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Compare Plans
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Choose the plan that best fits your needs
        </p>
      </div>

      <div className="overflow-x-auto">
        <table
          className="w-full border-collapse"
          role="table"
          aria-label="Subscription tier comparison showing features and pricing"
        >
          <thead>
            <tr className="border-t border-gray-200 bg-gray-50" role="row">
              <th
                className="px-4 py-3 text-left text-sm font-semibold text-gray-900"
                role="columnheader"
                scope="col"
              >
                Feature
              </th>
              {displayTiers.map((tier) => (
                <th
                  key={tier}
                  role="columnheader"
                  scope="col"
                  className={cn(
                    'px-4 py-3 text-center text-sm font-semibold',
                    tier === currentTier
                      ? 'bg-blue-50 text-blue-900'
                      : 'text-gray-900',
                  )}
                >
                  <div>{TIER_NAMES[tier]}</div>
                  <div className="mt-1 text-xs font-normal text-gray-500">
                    {TIER_PRICES[tier]}/mo
                  </div>
                  {tier === currentTier && (
                    <div className="mt-1 inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                      Current
                    </div>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {features.map((feature, idx) => (
              <tr
                key={feature.key}
                role="row"
                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td
                  className="px-4 py-3 text-sm font-medium text-gray-900"
                  role="cell"
                >
                  {feature.label}
                </td>
                {displayTiers.map((tier) => {
                  const limit = TIER_LIMITS[tier][feature.key];
                  return (
                    <td
                      key={tier}
                      role="cell"
                      className={cn(
                        'px-4 py-3 text-center text-sm',
                        tier === currentTier ? 'bg-blue-50' : '',
                      )}
                    >
                      {limit === -1 ? (
                        <div className="flex items-center justify-center gap-1 text-green-600">
                          <Check className="h-4 w-4" />
                          <span>Unlimited</span>
                        </div>
                      ) : (
                        <span className="text-gray-700">
                          {formatLimit(limit)}
                          {feature.key === 'storage_gb' && ' GB'}
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* Additional features */}
            <tr className="bg-white" role="row">
              <td className="px-4 py-3 text-sm font-medium text-gray-900" role="cell">
                Priority Support
              </td>
              {displayTiers.map((tier) => (
                <td
                  key={tier}
                  role="cell"
                  className={cn(
                    'px-4 py-3 text-center',
                    tier === currentTier ? 'bg-blue-50' : '',
                  )}
                >
                  {tier === 'pro' || tier === 'enterprise' ? (
                    <Check className="mx-auto h-5 w-5 text-green-600" aria-label="Included" />
                  ) : (
                    <X className="mx-auto h-5 w-5 text-gray-300" aria-label="Not included" />
                  )}
                </td>
              ))}
            </tr>

            <tr className="bg-gray-50" role="row">
              <td className="px-4 py-3 text-sm font-medium text-gray-900" role="cell">
                Advanced Analytics
              </td>
              {displayTiers.map((tier) => (
                <td
                  key={tier}
                  role="cell"
                  className={cn(
                    'px-4 py-3 text-center',
                    tier === currentTier ? 'bg-blue-50' : '',
                  )}
                >
                  {tier === 'pro' || tier === 'enterprise' ? (
                    <Check className="mx-auto h-5 w-5 text-green-600" aria-label="Included" />
                  ) : (
                    <X className="mx-auto h-5 w-5 text-gray-300" aria-label="Not included" />
                  )}
                </td>
              ))}
            </tr>

            <tr className="bg-white" role="row">
              <td className="px-4 py-3 text-sm font-medium text-gray-900" role="cell">
                Custom Branding
              </td>
              {displayTiers.map((tier) => (
                <td
                  key={tier}
                  role="cell"
                  className={cn(
                    'px-4 py-3 text-center',
                    tier === currentTier ? 'bg-blue-50' : '',
                  )}
                >
                  {tier === 'enterprise' ? (
                    <Check className="mx-auto h-5 w-5 text-green-600" aria-label="Included" />
                  ) : (
                    <X className="mx-auto h-5 w-5 text-gray-300" aria-label="Not included" />
                  )}
                </td>
              ))}
            </tr>
          </tbody>

          {/* Upgrade buttons */}
          <tfoot>
            <tr className="border-t border-gray-200 bg-gray-50" role="row">
              <td className="px-4 py-3" role="cell" />
              {displayTiers.map((tier) => (
                <td
                  key={tier}
                  role="cell"
                  className={cn(
                    'px-4 py-3 text-center',
                    tier === currentTier ? 'bg-blue-50' : '',
                  )}
                >
                  {tier !== currentTier && onUpgrade && (
                    <button
                      onClick={() => onUpgrade(tier)}
                      className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      type="button"
                      aria-label={`Upgrade to ${TIER_NAMES[tier]} plan for ${TIER_PRICES[tier]} per month`}
                    >
                      Upgrade to {TIER_NAMES[tier]}
                    </button>
                  )}
                </td>
              ))}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
