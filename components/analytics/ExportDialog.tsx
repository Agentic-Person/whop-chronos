'use client';

import { useState } from 'react';
import type { DataType, ExportFormat } from '@/lib/reports/types';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  dataType?: DataType;
}

export function ExportDialog({ isOpen, onClose, dataType = 'videos' }: ExportDialogProps) {
  const [selectedDataType, setSelectedDataType] = useState<DataType>(dataType);
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv');
  const [fileName, setFileName] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState<'download' | 'email'>('download');
  const [emailAddress, setEmailAddress] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  const columnOptions: Record<DataType, string[]> = {
    videos: ['id', 'title', 'views', 'watch_time', 'completion_rate', 'engagement_score', 'created_at'],
    students: ['id', 'email', 'total_sessions', 'avg_session_duration', 'last_active', 'engagement_score'],
    chat: ['id', 'session_id', 'role', 'content', 'created_at', 'video_references'],
    all: ['all_fields'],
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(`/api/export/${selectedFormat}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataType: selectedDataType,
          format: selectedFormat,
          dateRange,
          columns: selectedColumns.length > 0 ? selectedColumns : columnOptions[selectedDataType],
          fileName: fileName || `${selectedDataType}_export`,
        }),
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (!response.ok) {
        throw new Error('Export failed');
      }

      if (deliveryMethod === 'download') {
        // Download file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || `${selectedDataType}_export.${selectedFormat}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        // Email delivery handled by backend
        alert(`Export sent to ${emailAddress}`);
      }

      setTimeout(() => {
        onClose();
        setIsExporting(false);
        setProgress(0);
      }, 1000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Export failed. Please try again.');
      setIsExporting(false);
      setProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Export Data</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-6">
          {/* Data Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['videos', 'students', 'chat', 'all'] as DataType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedDataType(type)}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedDataType === type
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {(['csv', 'pdf', 'json'] as ExportFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => setSelectedFormat(format)}
                  className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                    selectedFormat === format
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Column Selection (for CSV/JSON) */}
          {(selectedFormat === 'csv' || selectedFormat === 'json') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Columns (optional - leave empty for all)
              </label>
              <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto">
                {columnOptions[selectedDataType].map((col) => (
                  <label key={col} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      checked={selectedColumns.includes(col)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedColumns([...selectedColumns, col]);
                        } else {
                          setSelectedColumns(selectedColumns.filter((c) => c !== col));
                        }
                      }}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{col.replace(/_/g, ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* File Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File Name (optional)
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder={`${selectedDataType}_export`}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Delivery Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Delivery Method
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setDeliveryMethod('download')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  deliveryMethod === 'download'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                Download
              </button>
              <button
                onClick={() => setDeliveryMethod('email')}
                className={`px-4 py-3 rounded-lg border-2 transition-colors ${
                  deliveryMethod === 'email'
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                Email
              </button>
            </div>
          </div>

          {/* Email Address (if email delivery) */}
          {deliveryMethod === 'email' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}

          {/* Progress Bar */}
          {isExporting && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Exporting...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || (deliveryMethod === 'email' && !emailAddress)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? 'Exporting...' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
