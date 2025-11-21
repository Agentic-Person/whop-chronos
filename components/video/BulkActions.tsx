'use client';

/**
 * Bulk Actions Component
 *
 * Actions for multiple selected videos with background processing
 * Features:
 * - Delete selected videos (background job)
 * - Reprocess failed videos (background job)
 * - Export metadata to CSV (background job)
 * - Real-time progress tracking
 * - Clear selection
 */

import { useState, useEffect } from 'react';
import { Trash2, RefreshCw, Download, X, Loader2 } from 'lucide-react';
import { Button, Card, Progress } from 'frosted-ui';

interface BulkActionsProps {
  selectedCount: number;
  selectedVideoIds: string[];
  creatorId: string;
  onDelete: () => void;
  onReprocess: () => void;
  onClearSelection: () => void;
}

interface OperationStatus {
  id: string;
  operation_type: 'delete' | 'export' | 'reprocess';
  status: 'pending' | 'in_progress' | 'completed' | 'partial' | 'failed';
  progress: {
    current: number;
    total: number;
    percentage: number;
  };
  result?: {
    deleted?: number;
    failed?: number;
    exported?: number;
    processed?: number;
    download_url?: string;
    errors?: Array<{ video_id: string; error: string }>;
  };
  error_message?: string;
}

export function BulkActions({
  selectedCount,
  selectedVideoIds,
  creatorId,
  onDelete,
  onReprocess,
  onClearSelection,
}: BulkActionsProps) {
  const [activeOperation, setActiveOperation] = useState<OperationStatus | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  // Poll for operation status
  useEffect(() => {
    if (!activeOperation || activeOperation.status === 'completed' || activeOperation.status === 'failed') {
      setIsPolling(false);
      return;
    }

    setIsPolling(true);
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/bulk/status/${activeOperation.id}`);
        const data = await response.json();

        if (data.success) {
          setActiveOperation(data.data);

          // Stop polling if completed or failed
          if (data.data.status === 'completed' || data.data.status === 'failed') {
            setIsPolling(false);
            clearInterval(interval);

            // Handle completion
            if (data.data.operation_type === 'delete' && data.data.status === 'completed') {
              onDelete(); // Refresh video list
              onClearSelection();
            } else if (data.data.operation_type === 'reprocess' && data.data.status === 'completed') {
              onReprocess(); // Refresh video list
              onClearSelection();
            } else if (data.data.operation_type === 'export' && data.data.status === 'completed') {
              // Download CSV
              if (data.data.result?.download_url) {
                window.open(data.data.result.download_url, '_blank');
              }
            }
          }
        }
      } catch (error) {
        console.error('Error polling operation status:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [activeOperation, onDelete, onReprocess, onClearSelection]);

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedVideoIds.length === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedVideoIds.length} video(s)?`)) {
      return;
    }

    try {
      const response = await fetch('/api/bulk/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creatorId,
          video_ids: selectedVideoIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActiveOperation({
          id: data.data.operation_id,
          operation_type: 'delete',
          status: 'pending',
          progress: {
            current: 0,
            total: selectedVideoIds.length,
            percentage: 0,
          },
        });
      } else {
        alert('Failed to start bulk deletion: ' + data.error);
      }
    } catch (error) {
      console.error('Error starting bulk delete:', error);
      alert('Failed to start bulk deletion');
    }
  };

  // Handle bulk reprocess
  const handleBulkReprocess = async () => {
    if (selectedVideoIds.length === 0) return;

    try {
      const response = await fetch('/api/bulk/reprocess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creatorId,
          video_ids: selectedVideoIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActiveOperation({
          id: data.data.operation_id,
          operation_type: 'reprocess',
          status: 'pending',
          progress: {
            current: 0,
            total: selectedVideoIds.length,
            percentage: 0,
          },
        });
      } else {
        alert('Failed to start bulk reprocessing: ' + data.error);
      }
    } catch (error) {
      console.error('Error starting bulk reprocess:', error);
      alert('Failed to start bulk reprocessing');
    }
  };

  // Handle bulk export
  const handleBulkExport = async () => {
    if (selectedVideoIds.length === 0) return;

    try {
      const response = await fetch('/api/bulk/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creator_id: creatorId,
          video_ids: selectedVideoIds,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setActiveOperation({
          id: data.data.operation_id,
          operation_type: 'export',
          status: 'pending',
          progress: {
            current: 0,
            total: selectedVideoIds.length,
            percentage: 0,
          },
        });
      } else {
        alert('Failed to start bulk export: ' + data.error);
      }
    } catch (error) {
      console.error('Error starting bulk export:', error);
      alert('Failed to start bulk export');
    }
  };

  // Get operation label
  const getOperationLabel = () => {
    if (!activeOperation) return '';

    switch (activeOperation.operation_type) {
      case 'delete':
        return 'Deleting';
      case 'export':
        return 'Exporting';
      case 'reprocess':
        return 'Reprocessing';
      default:
        return 'Processing';
    }
  };

  return (
    <>
      {/* Active Operation Progress */}
      {activeOperation && activeOperation.status !== 'completed' && (
        <Card className="bg-blue-50 border-blue-200 mb-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {getOperationLabel()} {activeOperation.progress.current}/{activeOperation.progress.total} videos
                  </p>
                  <p className="text-xs text-gray-600">
                    {activeOperation.progress.percentage}% complete
                  </p>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-blue-100 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${activeOperation.progress.percentage}%` }}
              />
            </div>
          </div>
        </Card>
      )}

      {/* Completion Message */}
      {activeOperation && activeOperation.status === 'completed' && (
        <Card className="bg-green-50 border-green-200 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full">
                ✓
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Operation completed successfully
                </p>
                {activeOperation.result && (
                  <p className="text-xs text-gray-600">
                    {activeOperation.operation_type === 'delete' && `Deleted ${activeOperation.result.deleted} videos`}
                    {activeOperation.operation_type === 'export' && `Exported ${activeOperation.result.exported} videos`}
                    {activeOperation.operation_type === 'reprocess' && `Reprocessed ${activeOperation.result.processed} videos`}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="h-4 w-4" />}
              onClick={() => setActiveOperation(null)}
            >
              Dismiss
            </Button>
          </div>
        </Card>
      )}

      {/* Bulk Actions Bar */}
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
              onClick={handleBulkReprocess}
              disabled={isPolling}
              title="Reprocess video embeddings"
            >
              Reprocess
            </Button>

            {/* Export */}
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="h-4 w-4" />}
              onClick={handleBulkExport}
              disabled={isPolling}
              title="Export metadata as CSV"
            >
              Export
            </Button>

            {/* Delete */}
            <Button
              variant="danger"
              size="sm"
              icon={<Trash2 className="h-4 w-4" />}
              onClick={handleBulkDelete}
              disabled={isPolling}
            >
              Delete
            </Button>

            {/* Clear Selection */}
            <Button
              variant="ghost"
              size="sm"
              icon={<X className="h-4 w-4" />}
              onClick={onClearSelection}
              disabled={isPolling}
              title="Clear selection"
            >
              Clear
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
}
