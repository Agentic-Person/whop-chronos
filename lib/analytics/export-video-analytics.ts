/**
 * Export Video Analytics Data to CSV
 *
 * Utility functions for exporting video analytics dashboard data as downloadable CSV files
 */

import type { VideoAnalyticsDashboardData } from '@/app/dashboard/creator/analytics/videos/page';

/**
 * Convert dashboard data to CSV format
 */
export function exportVideoAnalyticsToCSV(data: VideoAnalyticsDashboardData): string {
  const sections: string[] = [];

  // Section 1: Summary Metrics
  sections.push('SUMMARY METRICS');
  sections.push('Metric,Value');
  sections.push(`Total Views,${data.metrics.total_views}`);
  sections.push(
    `Total Watch Time (hours),${(data.metrics.total_watch_time_seconds / 3600).toFixed(2)}`
  );
  sections.push(`Average Completion Rate (%),${data.metrics.avg_completion_rate.toFixed(2)}`);
  sections.push(`Total Videos,${data.metrics.total_videos}`);
  sections.push('');

  // Section 2: Trends
  sections.push('TRENDS (vs Previous Period)');
  sections.push('Metric,Change (%)');
  sections.push(`Views,${data.metrics.trends.views}`);
  sections.push(`Watch Time,${data.metrics.trends.watch_time}`);
  sections.push(`Completion Rate,${data.metrics.trends.completion}`);
  sections.push(`Videos,${data.metrics.trends.videos}`);
  sections.push('');

  // Section 3: Views Over Time
  sections.push('VIEWS OVER TIME');
  sections.push('Date,Views');
  data.views_over_time.forEach((row) => {
    sections.push(`${row.date},${row.views}`);
  });
  sections.push('');

  // Section 4: Completion Rates by Video
  sections.push('COMPLETION RATES BY VIDEO');
  sections.push('Video Title,Views,Completion Rate (%)');
  data.completion_rates.forEach((row) => {
    sections.push(`"${row.title.replace(/"/g, '""')}",${row.views},${row.completion_rate.toFixed(2)}`);
  });
  sections.push('');

  // Section 5: Cost Breakdown
  sections.push('COST BREAKDOWN');
  sections.push('Method,Total Cost ($),Video Count');
  data.cost_breakdown.forEach((row) => {
    sections.push(`${row.method},${row.total_cost.toFixed(2)},${row.video_count}`);
  });
  sections.push('');

  // Section 6: Storage Usage
  sections.push('STORAGE USAGE');
  sections.push('Date,Daily Storage (GB),Cumulative Storage (GB)');
  data.storage_usage.forEach((row) => {
    sections.push(
      `${row.date},${row.storage_gb.toFixed(4)},${row.cumulative_gb.toFixed(4)}`
    );
  });
  sections.push('');

  // Section 7: Student Engagement
  sections.push('STUDENT ENGAGEMENT');
  sections.push('Metric,Value');
  sections.push(`Active Learners,${data.student_engagement.active_learners}`);
  sections.push(
    `Average Videos per Student,${data.student_engagement.avg_videos_per_student.toFixed(2)}`
  );
  sections.push('');

  // Section 8: Peak Activity Hours
  sections.push('PEAK ACTIVITY HOURS');
  sections.push('Day of Week,Hour,Activity Count');
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  data.student_engagement.peak_hours
    .sort((a, b) => b.activity_count - a.activity_count)
    .slice(0, 20)
    .forEach((row) => {
      sections.push(
        `${dayNames[row.day_of_week]},${row.hour}:00,${row.activity_count}`
      );
    });
  sections.push('');

  // Section 9: Top Performing Videos
  sections.push('TOP PERFORMING VIDEOS');
  sections.push(
    'Video Title,Source,Views,Avg Watch Time (min),Completion Rate (%),Duration (min)'
  );
  data.top_videos.forEach((row) => {
    sections.push(
      `"${row.title.replace(/"/g, '""')}",${row.source_type},${row.views},${(row.avg_watch_time_seconds / 60).toFixed(2)},${row.completion_rate.toFixed(2)},${(row.duration_seconds / 60).toFixed(2)}`
    );
  });
  sections.push('');

  return sections.join('\n');
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate filename for export
 */
export function generateExportFilename(dateRange: { start: Date; end: Date }): string {
  const startStr = dateRange.start.toISOString().split('T')[0];
  const endStr = dateRange.end.toISOString().split('T')[0];
  return `video-analytics-${startStr}_to_${endStr}.csv`;
}
