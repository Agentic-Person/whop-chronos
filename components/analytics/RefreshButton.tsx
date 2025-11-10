'use client';

import { useState } from 'react';
import { Button, Switch, Popover } from '@whop/react/components';
import { RefreshCw } from 'lucide-react';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

export function RefreshButton() {
  const { refreshData, autoRefresh, setAutoRefresh, lastUpdated } = useAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshData();

    // Simulate refresh delay for UX
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="2"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Refresh</span>
        </Button>

        <Popover.Trigger asChild>
          <Button variant="ghost" size="2" className="px-2">
            <svg
              width="15"
              height="15"
              viewBox="0 0 15 15"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
            >
              <path
                d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z"
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
              />
            </svg>
          </Button>
        </Popover.Trigger>
      </div>

      <Popover.Content align="end" className="w-64 p-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-4 font-semibold text-gray-12">Refresh Settings</h3>

          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <span className="text-3 font-medium text-gray-12">Auto-refresh</span>
              <span className="text-2 text-gray-11">Update every 60 seconds</span>
            </div>
            <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
          </div>

          {lastUpdated && (
            <div className="border-t border-gray-a4 pt-3 mt-2">
              <span className="text-2 text-gray-11">
                Last updated: {lastUpdated.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </Popover.Content>
    </Popover>
  );
}
