'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@whop/react/components';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

export function RefreshButton() {
  const { refreshData } = useAnalytics();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    refreshData();

    // Simulate refresh delay for UX
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <Button
      onClick={handleRefresh}
      disabled={isRefreshing}
      variant="surface"
      size="2"
      loading={isRefreshing}
    >
      <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="hidden sm:inline">Refresh</span>
    </Button>
  );
}
