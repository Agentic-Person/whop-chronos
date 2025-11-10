// Export Utilities for CSV, JSON, and Image Generation

import type { AnalyticsData } from './types';

/**
 * Convert analytics data to CSV format
 */
export async function exportToCSV(
  data: any[],
  columns: string[]
): Promise<string> {
  if (!data || data.length === 0) {
    return '';
  }

  // CSV header row
  const header = columns.join(',');

  // CSV data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = row[col];

        // Handle null/undefined
        if (value === null || value === undefined) {
          return '';
        }

        // Convert to string
        let cellValue = String(value);

        // Escape quotes and wrap in quotes if needed
        if (
          cellValue.includes(',') ||
          cellValue.includes('"') ||
          cellValue.includes('\n')
        ) {
          cellValue = `"${cellValue.replace(/"/g, '""')}"`;
        }

        return cellValue;
      })
      .join(',');
  });

  return [header, ...rows].join('\n');
}

/**
 * Format analytics data for different export types
 */
export function formatDataForExport(
  dataType: 'videos' | 'students' | 'chat',
  data: AnalyticsData
): { data: any[]; columns: string[] } {
  switch (dataType) {
    case 'videos':
      return {
        data: data.videos,
        columns: [
          'id',
          'title',
          'views',
          'watch_time',
          'completion_rate',
          'engagement_score',
          'created_at',
        ],
      };

    case 'students':
      return {
        data: data.students,
        columns: [
          'id',
          'email',
          'total_sessions',
          'avg_session_duration',
          'last_active',
          'engagement_score',
        ],
      };

    case 'chat':
      return {
        data: data.chatMessages,
        columns: [
          'id',
          'session_id',
          'role',
          'content',
          'created_at',
          'video_references',
        ],
      };

    default:
      return { data: [], columns: [] };
  }
}

/**
 * Convert data to JSON with formatting
 */
export function exportToJSON(data: any): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Generate filename with timestamp
 */
export function generateFileName(
  baseName: string,
  extension: string
): string {
  const timestamp = new Date().toISOString().split('T')[0];
  return `${baseName}_${timestamp}.${extension}`;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Parse and validate date range
 */
export function validateDateRange(start: string, end: string): boolean {
  const startDate = new Date(start);
  const endDate = new Date(end);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return false;
  }

  return startDate <= endDate;
}

/**
 * Calculate file size from string content
 */
export function getContentSize(content: string): number {
  return new Blob([content]).size;
}
