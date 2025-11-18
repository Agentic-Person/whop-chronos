/**
 * Utility functions for formatting data into human-readable strings
 * Used across the application for consistent data presentation
 */

/**
 * Formats a duration in seconds to a human-readable time string
 *
 * @param seconds - The duration in seconds (can be decimal)
 * @returns Formatted time string in format:
 *   - Under 60s: "0:XX" (e.g., "0:45")
 *   - Under 1 hour: "MM:SS" (e.g., "4:30", "15:42")
 *   - 1 hour or more: "H:MM:SS" or "HH:MM:SS" (e.g., "1:23:45", "12:05:30")
 *
 * @example
 * formatDuration(30)    // "0:30"
 * formatDuration(90)    // "1:30"
 * formatDuration(270)   // "4:30"
 * formatDuration(3661)  // "1:01:01"
 * formatDuration(7384)  // "2:03:04"
 * formatDuration(36000) // "10:00:00"
 */
export function formatDuration(seconds: number): string {
  // Round to nearest integer to avoid fractional seconds display
  const totalSeconds = Math.round(seconds);

  // Calculate hours, minutes, and remaining seconds
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  // Format based on duration length
  if (hours > 0) {
    // Format: H:MM:SS or HH:MM:SS
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  // Format: M:SS or MM:SS
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formats bytes to human-readable file size string
 *
 * @param bytes - The size in bytes
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted size string (e.g., "1.5 MB", "500 KB", "2.3 GB")
 *
 * @example
 * formatBytes(1024)           // "1.00 KB"
 * formatBytes(1536, 1)        // "1.5 KB"
 * formatBytes(1048576)        // "1.00 MB"
 * formatBytes(1073741824)     // "1.00 GB"
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Formats a date to human-readable string with relative time
 *
 * @param date - The date to format (Date object, timestamp, or ISO string)
 * @param includeTime - Whether to include time (default: false)
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date())                    // "Today"
 * formatDate(new Date('2025-01-15'))       // "Jan 15, 2025"
 * formatDate(new Date(), true)              // "Today at 2:30 PM"
 */
export function formatDate(date: Date | string | number, includeTime: boolean = false): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;

  const now = new Date();
  const diff = now.getTime() - dateObj.getTime();
  const daysDiff = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Format time if requested
  const timeString = includeTime
    ? ` at ${dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
    : '';

  // Relative dates for recent items
  if (daysDiff === 0) return `Today${timeString}`;
  if (daysDiff === 1) return `Yesterday${timeString}`;
  if (daysDiff < 7) return `${daysDiff} days ago${timeString}`;

  // Absolute date for older items
  return dateObj.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }) + timeString;
}

/**
 * Formats a number with thousands separators
 *
 * @param num - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 *
 * @example
 * formatNumber(1000)        // "1,000"
 * formatNumber(1234567)     // "1,234,567"
 * formatNumber(1234.56, 2)  // "1,234.56"
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Formats a percentage value
 *
 * @param value - The percentage value (0-100 or 0-1)
 * @param decimals - Number of decimal places (default: 1)
 * @param normalize - Whether to normalize from 0-1 to 0-100 (default: false)
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(75)          // "75.0%"
 * formatPercentage(0.75, 1, true) // "75.0%"
 * formatPercentage(66.666, 2)   // "66.67%"
 */
export function formatPercentage(
  value: number,
  decimals: number = 1,
  normalize: boolean = false
): string {
  const percentage = normalize ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
}

/**
 * Formats currency value
 *
 * @param amount - The amount in dollars/cents
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56)    // "$1,234.56"
 * formatCurrency(0.99)       // "$0.99"
 * formatCurrency(1000000)    // "$1,000,000.00"
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
