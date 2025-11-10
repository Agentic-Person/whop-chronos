'use client';

import { useState } from 'react';
import { Button, DropdownMenu } from '@whop/react/components';
import { Download, FileText, Mail, Share2, FileSpreadsheet } from 'lucide-react';
import { useAnalytics } from '@/lib/contexts/AnalyticsContext';

export function ExportButton() {
  const { dateRange, creatorId } = useAnalytics();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);

    try {
      const response = await fetch('/api/analytics/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          dateRange,
          format,
        }),
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `analytics-${format}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
      // TODO: Show error toast
    } finally {
      setIsExporting(false);
    }
  };

  const handleScheduleReport = async () => {
    // TODO: Open modal to schedule email reports
    console.log('Schedule report clicked');
  };

  const handleShareDashboard = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      // TODO: Show success toast
      console.log('Dashboard link copied to clipboard');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="2" disabled={isExporting} className="gap-2">
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Export</span>
        </Button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Content align="end" className="w-56">
        <DropdownMenu.Item onSelect={() => handleExport('csv')} className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Export as CSV</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onSelect={() => handleExport('pdf')} className="gap-2">
          <FileText className="w-4 h-4" />
          <span>Export as PDF Report</span>
        </DropdownMenu.Item>

        <DropdownMenu.Separator />

        <DropdownMenu.Item onSelect={handleScheduleReport} className="gap-2">
          <Mail className="w-4 h-4" />
          <span>Schedule Email Report</span>
        </DropdownMenu.Item>

        <DropdownMenu.Item onSelect={handleShareDashboard} className="gap-2">
          <Share2 className="w-4 h-4" />
          <span>Share Dashboard Link</span>
        </DropdownMenu.Item>
      </DropdownMenu.Content>
    </DropdownMenu>
  );
}
