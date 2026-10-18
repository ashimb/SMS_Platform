/**
 * In-memory sliding-window rate limiter for the public form proxy.
 *
 * Per process: with several website replicas each keeps its own counters, so the effective limit
 * is `limit x replicas`. That is acceptable here because nginx applies a coarse per-IP limit at
 * the edge (infra/nginx/nginx.conf, zone req_public_forms) and the API enforces its own limits.
 */
import { getEnv } from "@/lib/env.ts";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

const MAX_TRACKED_KEYS = 10_000;

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly now: () => number;

  constructor(limit: number, windowMs: number, now: () => number = Date.now) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.now = now;
  }

  check(key: string): RateLimitResult {
    const now = this.now();
    const cutoff = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > cutoff);

    if (recent.length >= this.limit) {
      const oldest = recent[0] ?? now;
      this.hits.set(key, recent);
      return {
        allowed: false,
        remaining: 0,
        retryAfterSeconds: Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000)),
      };
    }

    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > MAX_TRACKED_KEYS) this.prune(cutoff);
    return { allowed: true, remaining: this.limit - recent.length, retryAfterSeconds: 0 };
  }

  private prune(cutoff: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= cutoff)) this.hits.delete(key);
    }
  }
}

let enquiryLimiterInstance: SlidingWindowLimiter | undefined;

/** Process-wide limiter for the enquiry proxy, sized from ENQUIRY_RATE_* settings. */
export function enquiryLimiter(): SlidingWindowLimiter {
  const env = getEnv();
  enquiryLimiterInstance ??= new SlidingWindowLimiter(
    env.ENQUIRY_RATE_LIMIT,
    env.ENQUIRY_RATE_WINDOW_SECONDS * 1000,
  );
  return enquiryLimiterInstance;
}

/** Test helper: forget all counters and the cached configuration. */
export function resetEnquiryLimiter(): void {
  enquiryLimiterInstance = undefined;
}
