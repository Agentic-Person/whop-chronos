'use client';

import { useState } from 'react';
import { Button, Popover } from '@whop/react/components';
import { Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { useAnalytics, DATE_RANGE_PRESETS, type DateRangePreset } from '@/lib/contexts/AnalyticsContext';

export function DateRangePicker() {
  const { dateRange, setDateRange } = useAnalytics();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>('30d');

  const handlePresetClick = (preset: DateRangePreset) => {
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
      setIsOpen(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange.start || !dateRange.end) return 'Select date range';
    return `${format(dateRange.start, 'MMM d, yyyy')} - ${format(dateRange.end, 'MMM d, yyyy')}`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <Button variant="outline" size="2" className="gap-2">
          <Calendar className="w-4 h-4" />
          <span className="hidden sm:inline">{formatDateRange()}</span>
          <span className="sm:hidden">{DATE_RANGE_PRESETS[selectedPreset].label}</span>
        </Button>
      </Popover.Trigger>
      <Popover.Content align="end" className="w-80 p-4">
        <div className="flex flex-col gap-3">
          <h3 className="text-4 font-semibold text-gray-12">Select Date Range</h3>

          <div className="flex flex-col gap-2">
            {(Object.entries(DATE_RANGE_PRESETS) as [DateRangePreset, typeof DATE_RANGE_PRESETS[DateRangePreset]][]).map(
              ([key, preset]) => (
                <Button
                  key={key}
                  variant={selectedPreset === key ? 'solid' : 'ghost'}
                  size="2"
                  onClick={() => handlePresetClick(key)}
                  className="justify-start"
                >
                  {preset.label}
                </Button>
              )
            )}
          </div>

          {selectedPreset === 'custom' && (
            <div className="border-t border-gray-a4 pt-3 mt-2">
              <p className="text-3 text-gray-11 mb-2">Custom range selection</p>
              <div className="flex flex-col gap-2">
                <input
                  type="date"
                  value={format(dateRange.start, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newStart = new Date(e.target.value);
                    setDateRange({ start: newStart, end: dateRange.end });
                  }}
                  className="px-3 py-2 rounded-md border border-gray-a6 bg-gray-a2 text-gray-12"
                />
                <input
                  type="date"
                  value={format(dateRange.end, 'yyyy-MM-dd')}
                  onChange={(e) => {
                    const newEnd = new Date(e.target.value);
                    setDateRange({ start: dateRange.start, end: newEnd });
                  }}
                  className="px-3 py-2 rounded-md border border-gray-a6 bg-gray-a2 text-gray-12"
                />
              </div>
            </div>
          )}

          <div className="border-t border-gray-a4 pt-3 mt-2">
            <Button
              variant="solid"
              size="2"
              onClick={() => setIsOpen(false)}
              className="w-full"
            >
              Apply
            </Button>
          </div>
        </div>
      </Popover.Content>
    </Popover>
  );
}
