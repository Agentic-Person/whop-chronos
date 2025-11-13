/**
 * Simple in-memory rate limiter for landing page demo
 *
 * Tracks requests by IP address to prevent abuse.
 * Note: This is reset when the server restarts.
 * For production, consider using Upstash Redis or Vercel KV.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry> = new Map();

  constructor() {
    // Clean up expired entries every 5 minutes
    // Store interval reference (intentionally not cleared - runs for lifetime of instance)
    void setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  /**
   * Check if request is allowed
   * @param identifier - Usually IP address
   * @param limit - Max requests allowed
   * @param windowMs - Time window in milliseconds
   * @returns { allowed: boolean, remaining: number, resetAt: number }
   */
  check(identifier: string, limit: number, windowMs: number): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No previous requests or window expired
    if (!entry || now >= entry.resetAt) {
      const resetAt = now + windowMs;
      this.requests.set(identifier, { count: 1, resetAt });
      return {
        allowed: true,
        remaining: limit - 1,
        resetAt,
      };
    }

    // Within window, check limit
    if (entry.count < limit) {
      entry.count++;
      return {
        allowed: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
      };
    }

    // Limit exceeded
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for an identifier
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.requests.entries()) {
      if (now >= entry.resetAt) {
        this.requests.delete(key);
      }
    }
  }

  /**
   * Get current stats for identifier
   */
  getStats(identifier: string): { count: number; resetAt: number } | null {
    const entry = this.requests.get(identifier);
    if (!entry || Date.now() >= entry.resetAt) {
      return null;
    }
    return { count: entry.count, resetAt: entry.resetAt };
  }

  /**
   * Clear all rate limit data
   */
  clear(): void {
    this.requests.clear();
  }
}

// Singleton instance
const rateLimiter = new RateLimiter();

export { rateLimiter, type RateLimitEntry };
