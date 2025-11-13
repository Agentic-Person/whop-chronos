/**
 * Engagement Metrics Calculation Library
 * Core logic for computing student engagement analytics
 */

import type {
  StudentMetrics,
  EngagementScore,
  CohortData,
  Activity,
  ActiveUserData,
  SessionDurationData,
  RetentionData,
} from '@/components/analytics/engagement-types';

/**
 * Calculate composite engagement score (0-100)
 * Weighted average based on:
 * - Video completion rate (30%)
 * - Chat interaction frequency (25%)
 * - Login frequency (20%)
 * - Course progress (25%)
 */
export function calculateEngagementScore(metrics: StudentMetrics): EngagementScore {
  const weights = {
    videoCompletion: 0.3,
    chatInteraction: 0.25,
    loginFrequency: 0.2,
    courseProgress: 0.25,
  };

  // Normalize chat interaction frequency (assuming max 10 messages/day is 100%)
  const normalizedChatScore = Math.min(
    (metrics.chatInteractionFrequency / 10) * 100,
    100
  );

  // Normalize login frequency (assuming max 7 logins/week is 100%)
  const normalizedLoginScore = Math.min(
    (metrics.loginFrequency / 7) * 100,
    100
  );

  const breakdown = {
    videoCompletion: metrics.videoCompletionRate * weights.videoCompletion,
    chatInteraction: normalizedChatScore * weights.chatInteraction,
    loginFrequency: normalizedLoginScore * weights.loginFrequency,
    courseProgress: metrics.courseProgressRate * weights.courseProgress,
  };

  const total = Math.round(
    breakdown.videoCompletion +
      breakdown.chatInteraction +
      breakdown.loginFrequency +
      breakdown.courseProgress
  );

  return {
    total: Math.min(total, 100),
    breakdown: {
      videoCompletion: Math.round(breakdown.videoCompletion),
      chatInteraction: Math.round(breakdown.chatInteraction),
      loginFrequency: Math.round(breakdown.loginFrequency),
      courseProgress: Math.round(breakdown.courseProgress),
    },
  };
}

/**
 * Calculate retention rate for a cohort
 * Returns percentage of initial cohort still active
 */
export function calculateRetentionRate(cohortData: CohortData[]): number {
  if (!cohortData.length) return 0;

  const totalRetention = cohortData.reduce((sum, cohort) => {
    const avgRetention =
      cohort.retentionByWeek.reduce((a, b) => a + b, 0) /
      cohort.retentionByWeek.length;
    return sum + avgRetention;
  }, 0);

  return Math.round(totalRetention / cohortData.length);
}

/**
 * Calculate Daily Active Users (DAU)
 * Count unique users in last 24 hours
 */
export function calculateDAU(activities: Activity[]): number {
  const oneDayAgo = new Date();
  oneDayAgo.setHours(oneDayAgo.getHours() - 24);

  const recentActivities = activities.filter(
    (activity) => new Date(activity.timestamp) >= oneDayAgo
  );

  const uniqueUsers = new Set(
    recentActivities.map((activity) => activity.studentId)
  );

  return uniqueUsers.size;
}

/**
 * Calculate Monthly Active Users (MAU)
 * Count unique users in last 30 days
 */
export function calculateMAU(activities: Activity[]): number {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActivities = activities.filter(
    (activity) => new Date(activity.timestamp) >= thirtyDaysAgo
  );

  const uniqueUsers = new Set(
    recentActivities.map((activity) => activity.studentId)
  );

  return uniqueUsers.size;
}

/**
 * Calculate percentage change between current and previous period
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Group activities by date for time series analysis
 */
export function groupActivitiesByDate(
  activities: Activity[]
): Map<string, Activity[]> {
  const grouped = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const date = new Date(activity.timestamp).toISOString().split('T')[0]!;
    if (!grouped.has(date)) {
      grouped.set(date, []);
    }
    grouped.get(date)?.push(activity);
  });

  return grouped;
}

/**
 * Calculate active users over time range with comparison
 */
export function calculateActiveUsersOverTime(
  activities: Activity[],
  days: number
): ActiveUserData[] {
  const data: ActiveUserData[] = [];
  const now = new Date();

  for (let i = 0; i < days; i++) {
    const currentDate = new Date(now);
    currentDate.setDate(currentDate.getDate() - i);
    const dateStr = currentDate.toISOString().split('T')[0]!;

    const previousDate = new Date(currentDate);
    previousDate.setDate(previousDate.getDate() - 1);

    // Calculate DAU for current date
    const currentDayActivities = activities.filter((a) => {
      const activityDate = new Date(a.timestamp).toISOString().split('T')[0];
      return activityDate === dateStr;
    });
    const dau = new Set(currentDayActivities.map((a) => a.studentId)).size;

    // Calculate MAU for current date
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const mauActivities = activities.filter((a) => {
      const activityDate = new Date(a.timestamp);
      return activityDate >= thirtyDaysAgo && activityDate <= currentDate;
    });
    const mau = new Set(mauActivities.map((a) => a.studentId)).size;

    // Calculate previous day's DAU for comparison
    const previousDayActivities = activities.filter((a) => {
      const activityDate = new Date(a.timestamp).toISOString().split('T')[0];
      return activityDate === previousDate.toISOString().split('T')[0];
    });
    const previousDau = new Set(previousDayActivities.map((a) => a.studentId))
      .size;

    const change = calculatePercentageChange(dau, previousDau);

    data.unshift({
      date: dateStr,
      dau,
      mau,
      change,
    });
  }

  return data;
}

/**
 * Calculate session duration distribution
 */
export function calculateSessionDurations(
  sessionLengths: number[] // in minutes
): SessionDurationData[] {
  const buckets = [
    { bucket: '0-5m', range: [0, 5] as [number, number], count: 0 },
    { bucket: '5-15m', range: [5, 15] as [number, number], count: 0 },
    { bucket: '15-30m', range: [15, 30] as [number, number], count: 0 },
    { bucket: '30-60m', range: [30, 60] as [number, number], count: 0 },
    { bucket: '60m+', range: [60, Infinity] as [number, number], count: 0 },
  ];

  sessionLengths.forEach((duration) => {
    const bucket = buckets.find(
      (b) => duration >= b.range[0] && duration < b.range[1]
    );
    if (bucket) {
      bucket.count++;
    }
  });

  return buckets;
}

/**
 * Calculate average session duration
 */
export function calculateAverageSessionDuration(
  sessionLengths: number[]
): number {
  if (!sessionLengths.length) return 0;
  const sum = sessionLengths.reduce((a, b) => a + b, 0);
  return Math.round(sum / sessionLengths.length);
}

/**
 * Normalize engagement metrics to 0-100 scale
 */
export function normalizeMetric(value: number, max: number): number {
  return Math.min(Math.round((value / max) * 100), 100);
}

/**
 * Calculate cohort retention matrix
 */
export function calculateCohortRetention(
  cohortData: {
    cohortId: string;
    students: { id: string; joinDate: Date }[];
    activities: Activity[];
  }[]
): RetentionData[] {
  return cohortData.map((cohort) => {
    const cohortStart = new Date(
      Math.min(...cohort.students.map((s) => s.joinDate.getTime()))
    );
    const retentionData: Partial<RetentionData> = {
      cohort: `Week of ${cohortStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      week0: 100, // Always 100% at start
    };

    // Calculate retention for weeks 1-12
    for (let week = 1; week <= 12; week++) {
      const weekStart = new Date(cohortStart);
      weekStart.setDate(weekStart.getDate() + week * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 7);

      const activeInWeek = cohort.students.filter((student) => {
        return cohort.activities.some((activity) => {
          const activityDate = new Date(activity.timestamp);
          return (
            activity.studentId === student.id &&
            activityDate >= weekStart &&
            activityDate < weekEnd
          );
        });
      });

      const retentionRate = Math.round(
        (activeInWeek.length / cohort.students.length) * 100
      );

      (retentionData as any)[`week${week}`] = retentionRate;
    }

    return retentionData as RetentionData;
  });
}
