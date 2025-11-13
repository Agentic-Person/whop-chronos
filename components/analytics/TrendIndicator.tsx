'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TrendIndicatorProps {
  currentValue: number;
  previousValue: number;
  metric: string;
  period?: string;
  className?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

const defaultFormatValue = (value: number): string => {
  return value.toLocaleString();
};

export const TrendIndicator: React.FC<TrendIndicatorProps> = React.memo(({
  currentValue,
  previousValue,
  metric: _metric,
  period = 'vs last period',
  className = '',
  showValue = true,
  formatValue = defaultFormatValue,
}) => {
  // Calculate percentage change
  const change = currentValue - previousValue;
  const percentageChange = previousValue !== 0
    ? ((change / previousValue) * 100)
    : currentValue > 0 ? 100 : 0;

  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0;

  const getTrendColor = (): string => {
    if (isPositive) return 'text-green-500';
    if (isNegative) return 'text-red-500';
    return 'text-gray-500';
  };

  const getTrendBgColor = (): string => {
    if (isPositive) return 'bg-green-500/10';
    if (isNegative) return 'bg-red-500/10';
    return 'bg-gray-500/10';
  };

  const getTrendIcon = () => {
    if (isPositive) return <TrendingUp className="w-4 h-4" />;
    if (isNegative) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  const formatPercentage = (): string => {
    const absPercentage = Math.abs(percentageChange);
    if (absPercentage >= 1000) return '999+';
    if (absPercentage >= 100) return absPercentage.toFixed(0);
    if (absPercentage >= 10) return absPercentage.toFixed(1);
    return absPercentage.toFixed(2);
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Main value (optional) */}
      {showValue && (
        <div className="text-2xl font-bold text-gray-100">
          {formatValue(currentValue)}
        </div>
      )}

      {/* Trend indicator */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full ${getTrendBgColor()}`}>
        <span className={getTrendColor()}>
          {getTrendIcon()}
        </span>
        <span className={`text-xs font-semibold ${getTrendColor()}`}>
          {isNeutral ? '0' : formatPercentage()}%
        </span>
      </div>

      {/* Period label */}
      {period && (
        <span className="text-xs text-gray-500">
          {period}
        </span>
      )}
    </div>
  );
});

TrendIndicator.displayName = 'TrendIndicator';

/**
 * Compact version for use in stat cards
 */
export const CompactTrendIndicator: React.FC<Omit<TrendIndicatorProps, 'showValue'>> = React.memo(({
  currentValue,
  previousValue,
  metric: _metric,
  period: _period,
  className = '',
}) => {
  const change = currentValue - previousValue;
  const percentageChange = previousValue !== 0
    ? ((change / previousValue) * 100)
    : currentValue > 0 ? 100 : 0;

  const isPositive = change > 0;
  const isNegative = change < 0;

  const getTrendColor = (): string => {
    if (isPositive) return 'text-green-500';
    if (isNegative) return 'text-red-500';
    return 'text-gray-500';
  };

  const getTrendIcon = () => {
    const size = 'w-3 h-3';
    if (isPositive) return <TrendingUp className={size} />;
    if (isNegative) return <TrendingDown className={size} />;
    return <Minus className={size} />;
  };

  const formatPercentage = (): string => {
    const absPercentage = Math.abs(percentageChange);
    if (absPercentage >= 1000) return '999+';
    if (absPercentage >= 100) return absPercentage.toFixed(0);
    return absPercentage.toFixed(1);
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className={getTrendColor()}>
        {getTrendIcon()}
      </span>
      <span className={`text-xs font-medium ${getTrendColor()}`}>
        {formatPercentage()}%
      </span>
    </div>
  );
});

CompactTrendIndicator.displayName = 'CompactTrendIndicator';

/**
 * Card wrapper with metric label
 */
interface TrendCardProps extends TrendIndicatorProps {
  label: string;
  icon?: React.ReactNode;
}

export const TrendCard: React.FC<TrendCardProps> = React.memo(({
  label,
  icon,
  currentValue,
  previousValue,
  metric,
  period,
  formatValue,
  className = '',
}) => {
  return (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-400">{label}</span>
        {icon && (
          <div className="text-gray-500">
            {icon}
          </div>
        )}
      </div>

      {/* Value and trend */}
      <TrendIndicator
        currentValue={currentValue}
        previousValue={previousValue}
        metric={metric}
        period={period}
        showValue={true}
        formatValue={formatValue}
      />
    </div>
  );
});

TrendCard.displayName = 'TrendCard';

/**
 * Helper function to format common metric types
 */
export const metricFormatters = {
  number: (value: number) => value.toLocaleString(),
  percentage: (value: number) => `${value.toFixed(1)}%`,
  currency: (value: number) => `$${value.toLocaleString()}`,
  time: (value: number) => {
    const hours = Math.floor(value / 3600);
    const minutes = Math.floor((value % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  },
  compact: (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
    return value.toLocaleString();
  },
};
