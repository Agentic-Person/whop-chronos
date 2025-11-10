/**
 * UsageAlerts Component
 *
 * Alert banner for critical usage warnings
 */

'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UsageStats } from './usage-types';

interface UsageAlertsProps {
  creatorId: string;
  tier: 'free' | 'basic' | 'pro' | 'enterprise';
  onUpgrade?: () => void;
}

interface Alert {
  id: string;
  type: 'warning' | 'critical' | 'error';
  message: string;
  action?: string;
  actionLabel?: string;
}

export function UsageAlerts({
  creatorId,
  tier,
  onUpgrade,
}: UsageAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsage = async () => {
      try {
        const response = await fetch(`/api/analytics/usage?creatorId=${creatorId}`);

        if (!response.ok) {
          throw new Error('Failed to fetch usage data');
        }

        const data: UsageStats = await response.json();
        generateAlerts(data);
      } catch (err) {
        console.error('Error fetching usage:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsage();

    // Refresh alerts every 5 minutes
    const interval = setInterval(fetchUsage, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [creatorId]);

  const generateAlerts = (usage: UsageStats) => {
    const newAlerts: Alert[] = [];

    // Check each usage metric
    const metrics = [
      {
        key: 'videos',
        label: 'videos',
        stat: usage.usage.videos,
      },
      {
        key: 'storage_gb',
        label: 'storage',
        stat: usage.usage.storage_gb,
      },
      {
        key: 'ai_messages',
        label: 'AI credits',
        stat: usage.usage.ai_messages,
      },
      {
        key: 'students',
        label: 'students',
        stat: usage.usage.students,
      },
      {
        key: 'courses',
        label: 'courses',
        stat: usage.usage.courses,
      },
    ];

    metrics.forEach((metric) => {
      const { percentage, current, limit } = metric.stat;

      // Skip unlimited
      if (limit === -1) return;

      // 100% - limit reached
      if (percentage >= 100) {
        newAlerts.push({
          id: `${metric.key}-exceeded`,
          type: 'error',
          message: `${metric.label.charAt(0).toUpperCase() + metric.label.slice(1)} limit reached (${current}/${limit})`,
          action: 'upgrade',
          actionLabel: 'Upgrade Now',
        });
      }
      // 95% - critical warning
      else if (percentage >= 95) {
        newAlerts.push({
          id: `${metric.key}-critical`,
          type: 'critical',
          message: `${metric.label.charAt(0).toUpperCase() + metric.label.slice(1)} nearly full (${percentage.toFixed(0)}%)`,
          action: 'upgrade',
          actionLabel: 'View Plans',
        });
      }
      // 90% - warning
      else if (percentage >= 90) {
        newAlerts.push({
          id: `${metric.key}-warning`,
          type: 'warning',
          message: `${percentage.toFixed(0)}% of ${metric.label} used this month`,
          action: 'upgrade',
          actionLabel: 'Upgrade',
        });
      }
    });

    setAlerts(newAlerts);
  };

  const handleDismiss = (alertId: string) => {
    setDismissed(new Set([...dismissed, alertId]));
  };

  const handleAction = (action?: string) => {
    if (action === 'upgrade' && onUpgrade) {
      onUpgrade();
    }
  };

  if (loading) return null;

  // Filter out dismissed alerts
  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.id));

  if (visibleAlerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4',
            alert.type === 'error' &&
              'border-red-200 bg-red-50 text-red-900',
            alert.type === 'critical' &&
              'border-orange-200 bg-orange-50 text-orange-900',
            alert.type === 'warning' &&
              'border-yellow-200 bg-yellow-50 text-yellow-900',
          )}
        >
          <AlertTriangle
            className={cn(
              'mt-0.5 h-5 w-5 flex-shrink-0',
              alert.type === 'error' && 'text-red-600',
              alert.type === 'critical' && 'text-orange-600',
              alert.type === 'warning' && 'text-yellow-600',
            )}
          />

          <div className="flex-1">
            <p className="text-sm font-medium">{alert.message}</p>
          </div>

          <div className="flex items-center gap-2">
            {alert.action && alert.actionLabel && (
              <button
                onClick={() => handleAction(alert.action)}
                className={cn(
                  'rounded px-3 py-1 text-xs font-medium transition',
                  alert.type === 'error' &&
                    'bg-red-600 text-white hover:bg-red-700',
                  alert.type === 'critical' &&
                    'bg-orange-600 text-white hover:bg-orange-700',
                  alert.type === 'warning' &&
                    'bg-yellow-600 text-white hover:bg-yellow-700',
                )}
                type="button"
              >
                {alert.actionLabel}
              </button>
            )}

            <button
              onClick={() => handleDismiss(alert.id)}
              className="rounded p-1 transition hover:bg-white/50"
              type="button"
              aria-label="Dismiss alert"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
