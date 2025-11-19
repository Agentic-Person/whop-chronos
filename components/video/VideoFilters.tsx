'use client';

/**
 * Video Filters Component
 *
 * Advanced filtering for video library
 * Features:
 * - Status filter (all, completed, processing, failed, etc.)
 * - Source type filter (youtube, mux, loom, upload)
 * - Date range picker (last 7 days, 30 days, 90 days, custom)
 * - Search input with debounce
 */

import { useState, useEffect } from 'react';
import { Search, Filter, X, Calendar } from 'lucide-react';
import { Button, Card } from 'frosted-ui';
import { cn } from '@/lib/utils';

interface FilterState {
  status: string[];
  sourceType: string[];
  dateRange: { from: string | null; to: string | null };
  search: string;
}

interface VideoFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed', color: 'text-green-11 bg-green-3' },
  { value: 'processing', label: 'Processing', color: 'text-amber-11 bg-amber-3' },
  { value: 'transcribing', label: 'Transcribing', color: 'text-amber-11 bg-amber-3' },
  { value: 'embedding', label: 'Embedding', color: 'text-amber-11 bg-amber-3' },
  { value: 'pending', label: 'Pending', color: 'text-blue-11 bg-blue-3' },
  { value: 'uploading', label: 'Uploading', color: 'text-blue-11 bg-blue-3' },
  { value: 'failed', label: 'Failed', color: 'text-red-11 bg-red-3' },
];

const SOURCE_TYPE_OPTIONS = [
  { value: 'youtube', label: 'YouTube' },
  { value: 'mux', label: 'Mux' },
  { value: 'loom', label: 'Loom' },
  { value: 'upload', label: 'Upload' },
];

const DATE_RANGE_PRESETS = [
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'last90days', label: 'Last 90 Days' },
  { value: 'alltime', label: 'All Time' },
  { value: 'custom', label: 'Custom Range' },
];

export function VideoFilters({ filters, onFiltersChange }: VideoFiltersProps) {
  const [showFilters, setShowFilters] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const [datePreset, setDatePreset] = useState('alltime');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      onFiltersChange({ ...filters, search: searchInput });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Handle status filter toggle
  const handleStatusToggle = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter((s) => s !== status)
      : [...filters.status, status];

    onFiltersChange({ ...filters, status: newStatus });
  };

  // Handle source type filter toggle
  const handleSourceTypeToggle = (sourceType: string) => {
    const newSourceType = filters.sourceType.includes(sourceType)
      ? filters.sourceType.filter((s) => s !== sourceType)
      : [...filters.sourceType, sourceType];

    onFiltersChange({ ...filters, sourceType: newSourceType });
  };

  // Handle date range preset change
  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);

    const now = new Date();
    let from: string | null = null;
    let to: string | null = null;

    switch (preset) {
      case 'last7days':
        from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        to = now.toISOString();
        break;
      case 'last30days':
        from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        to = now.toISOString();
        break;
      case 'last90days':
        from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        to = now.toISOString();
        break;
      case 'alltime':
        from = null;
        to = null;
        break;
      case 'custom':
        // Don't change anything, wait for user input
        return;
    }

    onFiltersChange({ ...filters, dateRange: { from, to } });
  };

  // Handle custom date range
  const handleCustomDateRange = () => {
    onFiltersChange({
      ...filters,
      dateRange: {
        from: customDateFrom || null,
        to: customDateTo || null,
      },
    });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setDatePreset('alltime');
    setCustomDateFrom('');
    setCustomDateTo('');
    onFiltersChange({
      status: [],
      sourceType: [],
      dateRange: { from: null, to: null },
      search: '',
    });
  };

  const hasActiveFilters =
    filters.status.length > 0 ||
    filters.sourceType.length > 0 ||
    filters.dateRange.from !== null ||
    filters.dateRange.to !== null ||
    filters.search !== '';

  return (
    <div className="space-y-4">
      {/* Search and Filter Toggle */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-11" />
          <input
            type="text"
            placeholder="Search videos by title or description..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-a4 rounded-lg bg-gray-3 text-gray-12 placeholder:text-gray-11 focus:ring-2 focus:ring-purple-9 focus:border-transparent"
            aria-label="Search videos"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-11 hover:text-gray-12"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Toggle Button */}
        <Button
          variant={showFilters ? 'primary' : 'outline'}
          size="md"
          onClick={() => setShowFilters(!showFilters)}
          icon={<Filter className="h-5 w-5" />}
        >
          Filters
          {hasActiveFilters && (
            <span className="ml-2 px-2 py-0.5 bg-white/20 rounded-full text-xs">
              {filters.status.length + filters.sourceType.length + (filters.dateRange.from ? 1 : 0)}
            </span>
          )}
        </Button>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button variant="outline" size="md" onClick={handleClearFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <Card className="space-y-6">
          {/* Status Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-12 mb-3">Status</h3>
            <div className="flex flex-wrap gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleStatusToggle(option.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    filters.status.includes(option.value)
                      ? option.color
                      : 'bg-gray-3 text-gray-11 hover:bg-gray-4'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Source Type Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-12 mb-3">Source Type</h3>
            <div className="flex flex-wrap gap-2">
              {SOURCE_TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSourceTypeToggle(option.value)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                    filters.sourceType.includes(option.value)
                      ? 'bg-purple-9 text-white'
                      : 'bg-gray-3 text-gray-11 hover:bg-gray-4'
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Filter */}
          <div>
            <h3 className="text-sm font-semibold text-gray-12 mb-3">Date Range</h3>
            <div className="space-y-3">
              {/* Presets */}
              <div className="flex flex-wrap gap-2">
                {DATE_RANGE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleDatePresetChange(preset.value)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                      datePreset === preset.value
                        ? 'bg-blue-9 text-white'
                        : 'bg-gray-3 text-gray-11 hover:bg-gray-4'
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              {datePreset === 'custom' && (
                <div className="flex items-center gap-3 p-4 bg-gray-3 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-11" />
                  <div className="flex-1 flex items-center gap-3">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-11 mb-1">From</label>
                      <input
                        type="date"
                        value={customDateFrom}
                        onChange={(e) => setCustomDateFrom(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-a4 rounded-lg bg-gray-2 text-gray-12 text-sm focus:ring-2 focus:ring-purple-9 focus:border-transparent"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-11 mb-1">To</label>
                      <input
                        type="date"
                        value={customDateTo}
                        onChange={(e) => setCustomDateTo(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-a4 rounded-lg bg-gray-2 text-gray-12 text-sm focus:ring-2 focus:ring-purple-9 focus:border-transparent"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCustomDateRange}
                      className="mt-5"
                    >
                      Apply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
