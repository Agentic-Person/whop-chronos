/**
 * UsageMeter Component
 *
 * Reusable usage meter with visual states based on usage percentage
 */

'use client';

import { AlertTriangle, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UsageWarningLevel } from './usage-types';
import { getUsageWarningLevel } from './usage-types';

interface UsageMeterProps {
  label: string;
  current: number;
  limit: number;
  unit?: string;
  warningThreshold?: number;
  onUpgradeClick?: () => void;
}

export function UsageMeter({
  label,
  current,
  limit,
  unit = '',
  warningThreshold = 80,
  onUpgradeClick,
}: UsageMeterProps) {
  // Handle unlimited (-1)
  const isUnlimited = limit === -1;
  const percentage = isUnlimited ? 0 : (current / limit) * 100;
  const warningLevel: UsageWarningLevel = getUsageWarningLevel(percentage);

  // Color classes based on usage level
  const colorClasses = {
    normal: 'bg-green-500',
    warning: 'bg-yellow-500',
    critical: 'bg-orange-500',
    exceeded: 'bg-red-500',
  };

  const textColorClasses = {
    normal: 'text-green-600',
    warning: 'text-yellow-600',
    critical: 'text-orange-600',
    exceeded: 'text-red-600',
  };

  // Format display values
  const displayCurrent = unit === 'GB' ? current.toFixed(2) : Math.round(current);
  const displayLimit = limit === -1 ? 'Unlimited' : limit;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      {/* Header */}
      <div className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-900">{label}</h3>
          <p className="mt-1 text-xs text-gray-500">
            {isUnlimited ? (
              <span>
                {displayCurrent} {unit}
              </span>
            ) : (
              <span>
                {displayCurrent} of {displayLimit} {unit}
              </span>
            )}
          </p>
        </div>

        {/* Warning icon */}
        {percentage >= warningThreshold && !isUnlimited && (
          <AlertTriangle
            className={cn('h-5 w-5', textColorClasses[warningLevel])}
            aria-label="Warning"
          />
        )}
      </div>

      {/* Progress bar */}
      {!isUnlimited && (
        <div className="mb-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div
              className={cn(
                'h-full transition-all duration-300',
                colorClasses[warningLevel],
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Percentage and upgrade CTA */}
      <div className="flex items-center justify-between">
        {!isUnlimited && (
          <span
            className={cn('text-sm font-semibold', textColorClasses[warningLevel])}
          >
            {percentage.toFixed(1)}%
          </span>
        )}

        {percentage >= 100 && onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
            type="button"
          >
            <TrendingUp className="h-3 w-3" />
            Upgrade
          </button>
        )}
      </div>

      {/* Critical warning message */}
      {warningLevel === 'critical' && !isUnlimited && (
        <p className="mt-2 text-xs text-orange-600">
          Approaching limit - consider upgrading soon
        </p>
      )}

      {warningLevel === 'exceeded' && !isUnlimited && (
        <p className="mt-2 text-xs text-red-600">
          Limit reached - upgrade to continue
        </p>
      )}
    </div>
  );
}
