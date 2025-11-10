/**
 * Rate Limiting for AI Chat
 *
 * Prevent abuse and ensure fair usage across tiers.
 * Uses Upstash Redis for distributed rate limiting.
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate limit configurations per tier
const RATE_LIMITS = {
  student: {
    // Per-student limits
    perMinute: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
      analytics: true,
      prefix: 'chronos:ratelimit:student:minute',
    }),
    perHour: new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(100, '1 h'), // 100 requests per hour
      analytics: true,
      prefix: 'chronos:ratelimit:student:hour',
    }),
  },
  creator: {
    // Per-creator limits (aggregate across all students)
    basic: {
      perDay: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(500, '1 d'), // 500 requests per day
        analytics: true,
        prefix: 'chronos:ratelimit:creator:basic:day',
      }),
    },
    pro: {
      perDay: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(2000, '1 d'), // 2000 requests per day
        analytics: true,
        prefix: 'chronos:ratelimit:creator:pro:day',
      }),
    },
    enterprise: {
      perDay: new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(10000, '1 d'), // 10000 requests per day
        analytics: true,
        prefix: 'chronos:ratelimit:creator:enterprise:day',
      }),
    },
  },
};

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp (ms)
  retryAfter?: number; // Seconds to wait
}

export interface RateLimitCheck {
  student: RateLimitResult;
  creator: RateLimitResult;
  allowed: boolean;
  limitedBy?: 'student' | 'creator';
}

/**
 * Check rate limits for a student message
 */
export async function checkRateLimit(
  studentId: string,
  creatorId: string,
  tier: 'basic' | 'pro' | 'enterprise'
): Promise<RateLimitCheck> {
  // Check student-level limits
  const studentMinuteCheck = await RATE_LIMITS.student.perMinute.limit(
    `student:${studentId}`
  );
  const studentHourCheck = await RATE_LIMITS.student.perHour.limit(
    `student:${studentId}`
  );

  // Check creator-level limit
  const creatorDayCheck = await RATE_LIMITS.creator[tier].perDay.limit(
    `creator:${creatorId}`
  );

  const studentResult: RateLimitResult = {
    allowed: studentMinuteCheck.success && studentHourCheck.success,
    limit: studentMinuteCheck.limit,
    remaining: Math.min(studentMinuteCheck.remaining, studentHourCheck.remaining),
    reset: studentMinuteCheck.reset,
    retryAfter: !studentMinuteCheck.success
      ? Math.ceil((studentMinuteCheck.reset - Date.now()) / 1000)
      : undefined,
  };

  const creatorResult: RateLimitResult = {
    allowed: creatorDayCheck.success,
    limit: creatorDayCheck.limit,
    remaining: creatorDayCheck.remaining,
    reset: creatorDayCheck.reset,
    retryAfter: !creatorDayCheck.success
      ? Math.ceil((creatorDayCheck.reset - Date.now()) / 1000)
      : undefined,
  };

  const allowed = studentResult.allowed && creatorResult.allowed;
  const limitedBy = !studentResult.allowed
    ? 'student'
    : !creatorResult.allowed
      ? 'creator'
      : undefined;

  return {
    student: studentResult,
    creator: creatorResult,
    allowed,
    limitedBy: limitedBy as 'student' | 'creator' | undefined,
  };
}

/**
 * Get rate limit status without incrementing
 */
export async function getRateLimitStatus(
  studentId: string,
  creatorId: string,
  tier: 'basic' | 'pro' | 'enterprise'
): Promise<{
  student: {
    perMinute: { limit: number; remaining: number; reset: number };
    perHour: { limit: number; remaining: number; reset: number };
  };
  creator: {
    perDay: { limit: number; remaining: number; reset: number };
  };
}> {
  // Get limits without incrementing
  const studentMinuteLimit = await redis.get(
    `chronos:ratelimit:student:minute:student:${studentId}`
  );
  const studentHourLimit = await redis.get(
    `chronos:ratelimit:student:hour:student:${studentId}`
  );
  const creatorDayLimit = await redis.get(
    `chronos:ratelimit:creator:${tier}:day:creator:${creatorId}`
  );

  return {
    student: {
      perMinute: {
        limit: RATE_LIMITS.student.perMinute['limiter']['tokens'],
        remaining: studentMinuteLimit
          ? RATE_LIMITS.student.perMinute['limiter']['tokens'] -
            (studentMinuteLimit as number)
          : RATE_LIMITS.student.perMinute['limiter']['tokens'],
        reset: Date.now() + 60000, // Approximate
      },
      perHour: {
        limit: RATE_LIMITS.student.perHour['limiter']['tokens'],
        remaining: studentHourLimit
          ? RATE_LIMITS.student.perHour['limiter']['tokens'] -
            (studentHourLimit as number)
          : RATE_LIMITS.student.perHour['limiter']['tokens'],
        reset: Date.now() + 3600000, // Approximate
      },
    },
    creator: {
      perDay: {
        limit: RATE_LIMITS.creator[tier].perDay['limiter']['tokens'],
        remaining: creatorDayLimit
          ? RATE_LIMITS.creator[tier].perDay['limiter']['tokens'] -
            (creatorDayLimit as number)
          : RATE_LIMITS.creator[tier].perDay['limiter']['tokens'],
        reset: Date.now() + 86400000, // Approximate
      },
    },
  };
}

/**
 * Reset rate limits for a student (admin function)
 */
export async function resetStudentRateLimit(studentId: string): Promise<void> {
  await redis.del(
    `chronos:ratelimit:student:minute:student:${studentId}`,
    `chronos:ratelimit:student:hour:student:${studentId}`
  );
  console.log(`Reset rate limits for student ${studentId}`);
}

/**
 * Reset rate limits for a creator (admin function)
 */
export async function resetCreatorRateLimit(
  creatorId: string,
  tier: 'basic' | 'pro' | 'enterprise'
): Promise<void> {
  await redis.del(`chronos:ratelimit:creator:${tier}:day:creator:${creatorId}`);
  console.log(`Reset rate limits for creator ${creatorId} (${tier})`);
}

/**
 * Get rate limit analytics
 */
export async function getRateLimitAnalytics(): Promise<{
  total_requests: number;
  blocked_requests: number;
  block_rate: number;
}> {
  // This would require additional tracking in Redis
  // For now, return placeholder
  return {
    total_requests: 0,
    blocked_requests: 0,
    block_rate: 0,
  };
}

/**
 * Format rate limit error message
 */
export function formatRateLimitError(check: RateLimitCheck): string {
  if (check.limitedBy === 'student') {
    const retryAfter = check.student.retryAfter || 60;
    return `Rate limit exceeded. You can send ${check.student.remaining} more messages. Please try again in ${retryAfter} seconds.`;
  }

  if (check.limitedBy === 'creator') {
    return `Your instructor's account has reached its daily message limit. This will reset in ${Math.ceil((check.creator.reset - Date.now()) / 3600000)} hours. Contact your instructor for more information.`;
  }

  return 'Rate limit exceeded. Please try again later.';
}

/**
 * Check if rate limiting is enabled
 */
export function isRateLimitingEnabled(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
