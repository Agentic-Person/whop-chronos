/**
 * Timestamp Formatting Utilities
 *
 * Provides utilities for converting between seconds and human-readable timestamp formats
 * Used for video timestamp display and navigation in the chat interface
 */

/**
 * Convert seconds to timestamp format (MM:SS or HH:MM:SS)
 *
 * Examples:
 * - 67 → "1:07"
 * - 847 → "14:07"
 * - 3661 → "1:01:01"
 *
 * @param seconds - Total seconds to convert
 * @returns Formatted timestamp string
 */
export function formatTimestamp(seconds: number): string {
  if (seconds < 0) {
    return "0:00";
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Convert seconds to human-readable format
 *
 * Examples:
 * - 67 → "1 minute 7 seconds"
 * - 847 → "14 minutes 7 seconds"
 * - 3661 → "1 hour 1 minute 1 second"
 *
 * @param seconds - Total seconds to convert
 * @returns Human-readable time string
 */
export function formatTimestampHuman(seconds: number): string {
  if (seconds < 0) {
    return '0 seconds';
  }

  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts: string[] = [];

  if (hours > 0) {
    parts.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  }
  if (mins > 0) {
    parts.push(`${mins} minute${mins !== 1 ? 's' : ''}`);
  }
  if (secs > 0 || parts.length === 0) {
    parts.push(`${secs} second${secs !== 1 ? 's' : ''}`);
  }

  return parts.join(' ');
}

/**
 * Parse timestamp string to seconds
 *
 * Supports formats:
 * - "1:07" → 67
 * - "14:07" → 847
 * - "1:01:01" → 3661
 *
 * @param timestamp - Timestamp string to parse (MM:SS or HH:MM:SS)
 * @returns Total seconds
 */
export function parseTimestamp(timestamp: string): number {
  const parts = timestamp.split(':').map(Number);

  // Handle invalid input
  if (parts.some(isNaN)) {
    return 0;
  }

  if (parts.length === 2) {
    // MM:SS format
    const [mins = 0, secs = 0] = parts;
    return mins * 60 + secs;
  }

  if (parts.length === 3) {
    // HH:MM:SS format
    const [hours = 0, mins = 0, secs = 0] = parts;
    return hours * 3600 + mins * 60 + secs;
  }

  return 0;
}

/**
 * Get a short description of timestamp for tooltips
 *
 * Examples:
 * - 67 → "at 1:07"
 * - 847 → "at 14:07"
 *
 * @param seconds - Timestamp in seconds
 * @returns Short description for tooltips
 */
export function getTimestampTooltip(seconds: number): string {
  return `Jump to ${formatTimestamp(seconds)}`;
}

/**
 * Validate if seconds value is within video duration
 *
 * @param seconds - Timestamp to validate
 * @param duration - Total video duration in seconds
 * @returns True if timestamp is valid
 */
export function isValidTimestamp(seconds: number, duration: number): boolean {
  return seconds >= 0 && seconds <= duration;
}

/**
 * Clamp timestamp to valid range
 *
 * @param seconds - Timestamp to clamp
 * @param duration - Total video duration in seconds
 * @returns Clamped timestamp
 */
export function clampTimestamp(seconds: number, duration: number): number {
  return Math.max(0, Math.min(seconds, duration));
}
