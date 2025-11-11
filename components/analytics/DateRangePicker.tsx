'use client';

import { useState } from 'react';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Select } from '@whop/react/components';
import { useAnalytics, DATE_RANGE_PRESETS, type DateRangePreset } from '@/lib/contexts/AnalyticsContext';

export function DateRangePicker() {
  const { dateRange, setDateRange } = useAnalytics();
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('30d');

  const handlePresetChange = (value: string) => {
    const preset = value as DateRangePreset;
    setSelectedPreset(preset);

    if (preset !== 'custom') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      let start: Date;
      let end: Date = today;

      switch (preset) {
        case '7d':
          start = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          start = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'thisMonth':
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'lastMonth':
          start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          end = new Date(now.getFullYear(), now.getMonth(), 0);
          break;
        default:
          start = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      }

      setDateRange({ start, end });
    }
  };

  const formatDateRange = () => {
    if (!dateRange.start || !dateRange.end) return 'Select date range';
    return `${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  };

  return (
    <div className="relative inline-flex items-center gap-2">
      <Calendar className="w-4 h-4 text-gray-11 absolute left-3 pointer-events-none z-10" />
      <Select.Root value={selectedPreset} onValueChange={handlePresetChange} size="2">
        <Select.Trigger variant="surface" className="pl-9 min-w-[180px]" />
        <Select.Content>
          {(Object.entries(DATE_RANGE_PRESETS) as [DateRangePreset, typeof DATE_RANGE_PRESETS[DateRangePreset]][]).map(
            ([key, preset]) => (
              <Select.Item key={key} value={key}>
                {preset.label}
              </Select.Item>
            )
          )}
        </Select.Content>
      </Select.Root>
      <span className="text-xs text-gray-11 hidden md:inline ml-2">
        {formatDateRange()}
      </span>
    </div>
  );
}
