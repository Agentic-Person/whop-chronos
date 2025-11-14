/**
 * Formatting Utilities
 *
 * Helper functions for formatting durations, timestamps, and other data
 * Used across video lesson components
 */

/**
 * Format duration in seconds to human-readable format
 * Examples:
 * - 90 seconds -> "1m 30s"
 * - 3665 seconds -> "1h 1m 5s"
 * - 45 seconds -> "0m 45s"
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
}

/**
 * Format duration in seconds to short MM:SS or HH:MM:SS format
 * Examples:
 * - 90 seconds -> "1:30"
 * - 3665 seconds -> "1:01:05"
 * - 45 seconds -> "0:45"
 */
export function formatDurationShort(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Format date string to relative time
 * Examples:
 * - Today -> "Today"
 * - Yesterday -> "Yesterday"
 * - 3 days ago -> "3 days ago"
 * - 2 weeks ago -> "2 weeks ago"
 * - 3 months ago -> "3 months ago"
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

/**
 * Format percentage with optional decimal places
 * Examples:
 * - 0.6745 -> "67%"
 * - 0.6745 (with decimals=1) -> "67.5%"
 */
export function formatPercent(value: number, decimals: number = 0): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncate text to max length with ellipsis
 * Examples:
 * - "Hello World", 5 -> "Hello..."
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
