'use client';

/**
 * Bulk Actions Component
 *
 * Actions for multiple selected videos
 * Features:
 * - Delete selected videos
 * - Reprocess failed videos
 * - Export metadata (CSV)
 * - Clear selection
 */

import { Trash2, RefreshCw, Download, X } from 'lucide-react';
import { Button, Card } from 'frosted-ui';

interface BulkActionsProps {
  selectedCount: number;
  onDelete: () => void;
  onReprocess: () => void;
  onClearSelection: () => void;
}

export function BulkActions({
  selectedCount,
  onDelete,
  onReprocess,
  onClearSelection,
}: BulkActionsProps) {
  return (
    <Card className="bg-purple-50 border-purple-200">
      <div className="flex items-center justify-between gap-4">
        {/* Selection Info */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-purple-600 text-white rounded-full text-sm font-semibold">
            {selectedCount}
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {selectedCount} video{selectedCount !== 1 ? 's' : ''} selected
            </p>
            <p className="text-xs text-gray-600">Choose an action to perform</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Reprocess */}
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw className="h-4 w-4" />}
            onClick={onReprocess}
            title="Reprocess failed videos"
          >
            Reprocess
          </Button>

          {/* Export (Future Feature) */}
          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-4 w-4" />}
            onClick={() => alert('Export feature coming soon!')}
            title="Export metadata as CSV"
          >
            Export
          </Button>

          {/* Delete */}
          <Button
            variant="danger"
            size="sm"
            icon={<Trash2 className="h-4 w-4" />}
            onClick={onDelete}
          >
            Delete
          </Button>

          {/* Clear Selection */}
          <Button
            variant="ghost"
            size="sm"
            icon={<X className="h-4 w-4" />}
            onClick={onClearSelection}
            title="Clear selection"
          >
            Clear
          </Button>
        </div>
      </div>
    </Card>
  );
}
