'use client';

import { useState, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CourseFiltersProps {
  onFilterChange: (filter: 'all' | 'in_progress' | 'completed') => void;
  onSearchChange: (query: string) => void;
  onSortChange: (sort: 'recent' | 'progress' | 'name') => void;
  currentFilter: 'all' | 'in_progress' | 'completed';
  currentSort: 'recent' | 'progress' | 'name';
}

/**
 * CourseFilters - Filter and search controls for course catalog
 *
 * Features:
 * - Search input with magnifying glass icon
 * - Filter buttons: All, In Progress, Completed
 * - Sort dropdown: Recent, Progress, Name
 * - Debounced search (500ms)
 * - Active filter highlighting
 * - Responsive layout
 */
export function CourseFilters({
  onFilterChange,
  onSearchChange,
  onSortChange,
  currentFilter,
  currentSort,
}: CourseFiltersProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  /**
   * Debounced search handler - wait 500ms after user stops typing
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(searchQuery);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  /**
   * Handle filter button click
   */
  const handleFilterClick = (filter: 'all' | 'in_progress' | 'completed') => {
    onFilterChange(filter);
  };

  /**
   * Handle sort selection
   */
  const handleSortSelect = (sort: 'recent' | 'progress' | 'name') => {
    onSortChange(sort);
    setSortDropdownOpen(false);
  };

  /**
   * Get sort label for display
   */
  const getSortLabel = (): string => {
    switch (currentSort) {
      case 'recent':
        return 'Recent';
      case 'progress':
        return 'Progress';
      case 'name':
        return 'Name';
      default:
        return 'Sort';
    }
  };

  /**
   * Close dropdown when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = () => {
      if (sortDropdownOpen) {
        setSortDropdownOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [sortDropdownOpen]);

  return (
    <div className="bg-white border border-gray-a4 rounded-lg p-4 space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-9" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={cn(
            'w-full pl-10 pr-4 py-2.5 rounded-lg',
            'border border-gray-a4 bg-gray-2',
            'text-gray-12 placeholder-gray-9',
            'focus:outline-none focus:ring-2 focus:ring-purple-9 focus:border-transparent',
            'transition-all'
          )}
        />
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleFilterClick('all')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              currentFilter === 'all'
                ? 'bg-purple-9 text-white shadow-md'
                : 'bg-gray-a3 text-gray-11 hover:bg-gray-a4'
            )}
          >
            All
          </button>
          <button
            onClick={() => handleFilterClick('in_progress')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              currentFilter === 'in_progress'
                ? 'bg-blue-9 text-white shadow-md'
                : 'bg-gray-a3 text-gray-11 hover:bg-gray-a4'
            )}
          >
            In Progress
          </button>
          <button
            onClick={() => handleFilterClick('completed')}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              currentFilter === 'completed'
                ? 'bg-green-9 text-white shadow-md'
                : 'bg-gray-a3 text-gray-11 hover:bg-gray-a4'
            )}
          >
            Completed
          </button>
        </div>

        {/* Sort Dropdown */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSortDropdownOpen(!sortDropdownOpen);
            }}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              'bg-gray-a3 text-gray-11 hover:bg-gray-a4',
              'flex items-center gap-2 min-w-[120px] justify-between'
            )}
          >
            <span>Sort: {getSortLabel()}</span>
            <ChevronDown
              className={cn(
                'w-4 h-4 transition-transform',
                sortDropdownOpen && 'rotate-180'
              )}
            />
          </button>

          {/* Dropdown Menu */}
          {sortDropdownOpen && (
            <div
              className={cn(
                'absolute right-0 mt-2 w-48 rounded-lg shadow-lg',
                'bg-white border border-gray-a4',
                'py-1 z-10'
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => handleSortSelect('recent')}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  currentSort === 'recent'
                    ? 'bg-purple-a3 text-purple-11 font-medium'
                    : 'text-gray-11 hover:bg-gray-a2'
                )}
              >
                Recent
              </button>
              <button
                onClick={() => handleSortSelect('progress')}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  currentSort === 'progress'
                    ? 'bg-purple-a3 text-purple-11 font-medium'
                    : 'text-gray-11 hover:bg-gray-a2'
                )}
              >
                Progress
              </button>
              <button
                onClick={() => handleSortSelect('name')}
                className={cn(
                  'w-full px-4 py-2 text-left text-sm transition-colors',
                  currentSort === 'name'
                    ? 'bg-purple-a3 text-purple-11 font-medium'
                    : 'text-gray-11 hover:bg-gray-a2'
                )}
              >
                Name
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
