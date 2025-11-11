'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@whop/react/components';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

export function ExportButton() {
  const { dateRange, creatorId } = useAnalytics();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          dateRange,
          format: 'csv',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Export feature coming soon!';
      alert(errorMessage);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting}
      variant="surface"
      size="2"
      loading={isExporting}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
}
