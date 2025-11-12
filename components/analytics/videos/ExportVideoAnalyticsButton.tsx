'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@whop/react/components';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';
import {
  exportVideoAnalyticsToCSV,
  downloadCSV,
  generateExportFilename,
} from '@/lib/analytics/export-video-analytics';
import type { VideoAnalyticsDashboardData } from '@/app/dashboard/creator/analytics/videos/page';

interface ExportVideoAnalyticsButtonProps {
  data: VideoAnalyticsDashboardData | null;
}

export function ExportVideoAnalyticsButton({ data }: ExportVideoAnalyticsButtonProps) {
  const { dateRange } = useAnalytics();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data) {
      alert('No data available to export');
      return;
    }

    setIsExporting(true);

    try {
      // Convert data to CSV
      const csvContent = exportVideoAnalyticsToCSV(data);

      // Generate filename
      const filename = generateExportFilename(dateRange);

      // Download file
      downloadCSV(csvContent, filename);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export analytics data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={isExporting || !data}
      variant="surface"
      size="2"
      loading={isExporting}
    >
      <Download className="w-4 h-4" />
      <span className="hidden sm:inline">Export CSV</span>
    </Button>
  );
}
