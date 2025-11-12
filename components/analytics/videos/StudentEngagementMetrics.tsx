'use client';

import { Users, Video, TrendingUp } from 'lucide-react';

interface StudentEngagementData {
  active_learners: number;
  avg_videos_per_student: number;
  peak_hours: Array<{
    hour: number;
    day_of_week: number;
    activity_count: number;
  }>;
}

interface StudentEngagementMetricsProps {
  engagement: StudentEngagementData;
}

// Day names for heatmap
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Hours to display (6am - 11pm)
const HOURS = [6, 9, 12, 15, 18, 21];

export function StudentEngagementMetrics({ engagement }: StudentEngagementMetricsProps) {
  // Create heatmap matrix
  const createHeatmapMatrix = () => {
    const matrix: number[][] = Array(7)
      .fill(0)
      .map(() => Array(6).fill(0));

    engagement.peak_hours.forEach((peak) => {
      const hourIndex = HOURS.indexOf(peak.hour);
      if (hourIndex !== -1 && peak.day_of_week >= 0 && peak.day_of_week <= 6) {
        matrix[peak.day_of_week][hourIndex] = peak.activity_count;
      }
    });

    return matrix;
  };

  const matrix = createHeatmapMatrix();

  // Find max activity for color scaling
  const maxActivity = Math.max(
    ...engagement.peak_hours.map((p) => p.activity_count),
    1
  );

  // Get color intensity based on activity
  const getColorIntensity = (count: number): string => {
    if (count === 0) return 'var(--gray-a3)';
    const intensity = (count / maxActivity) * 100;
    if (intensity >= 80) return 'var(--blue-9)';
    if (intensity >= 60) return 'var(--blue-8)';
    if (intensity >= 40) return 'var(--blue-7)';
    if (intensity >= 20) return 'var(--blue-6)';
    return 'var(--blue-5)';
  };

  return (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-start gap-3 p-4 bg-gray-a2 rounded-lg">
          <div className="p-2 rounded-lg bg-blue-a3">
            <Users className="w-5 h-5 text-blue-11" />
          </div>
          <div>
            <div className="text-2 text-gray-11 mb-1">Active Learners</div>
            <div className="text-6 font-bold text-gray-12">
              {engagement.active_learners.toLocaleString()}
            </div>
            <div className="text-2 text-gray-10 mt-1">Last 30 days</div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-a2 rounded-lg">
          <div className="p-2 rounded-lg bg-purple-a3">
            <Video className="w-5 h-5 text-purple-11" />
          </div>
          <div>
            <div className="text-2 text-gray-11 mb-1">Avg Videos per Student</div>
            <div className="text-6 font-bold text-gray-12">
              {engagement.avg_videos_per_student.toFixed(1)}
            </div>
            <div className="text-2 text-gray-10 mt-1">Engagement rate</div>
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-gray-a2 rounded-lg">
          <div className="p-2 rounded-lg bg-green-a3">
            <TrendingUp className="w-5 h-5 text-green-11" />
          </div>
          <div>
            <div className="text-2 text-gray-11 mb-1">Peak Activity</div>
            <div className="text-6 font-bold text-gray-12">
              {findPeakTime(engagement.peak_hours)}
            </div>
            <div className="text-2 text-gray-10 mt-1">Most active time</div>
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div>
        <h4 className="text-4 font-medium text-gray-12 mb-3">Peak Usage Times</h4>
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Header with hours */}
            <div className="flex mb-2">
              <div className="w-16" /> {/* Spacer for day labels */}
              {HOURS.map((hour) => (
                <div key={hour} className="w-12 text-center text-2 text-gray-11">
                  {hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {DAYS.map((day, dayIndex) => (
              <div key={day} className="flex mb-1">
                <div className="w-16 text-2 text-gray-11 flex items-center">{day}</div>
                {HOURS.map((hour, hourIndex) => {
                  const count = matrix[dayIndex][hourIndex];
                  return (
                    <div
                      key={`${dayIndex}-${hourIndex}`}
                      className="w-12 h-8 mx-0.5 rounded flex items-center justify-center text-xs font-medium transition-colors cursor-help"
                      style={{
                        backgroundColor: getColorIntensity(count),
                        color: count > maxActivity * 0.5 ? 'white' : 'var(--gray-11)',
                      }}
                      title={`${day} ${hour}:00 - ${count} views`}
                    >
                      {count > 0 ? count : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-2 mt-4 text-2 text-gray-11">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--gray-a3)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--blue-5)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--blue-6)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--blue-7)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--blue-8)' }} />
            <div className="w-4 h-4 rounded" style={{ backgroundColor: 'var(--blue-9)' }} />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to find peak time
function findPeakTime(peakHours: StudentEngagementData['peak_hours']): string {
  if (!peakHours || peakHours.length === 0) return 'N/A';

  const peak = peakHours.reduce((max, current) =>
    current.activity_count > max.activity_count ? current : max
  );

  const dayName = DAYS[peak.day_of_week] || 'Unknown';
  const hourDisplay =
    peak.hour === 0
      ? '12am'
      : peak.hour < 12
        ? `${peak.hour}am`
        : peak.hour === 12
          ? '12pm'
          : `${peak.hour - 12}pm`;

  return `${dayName} ${hourDisplay}`;
}
