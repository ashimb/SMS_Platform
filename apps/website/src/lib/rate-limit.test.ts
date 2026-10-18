import { describe, expect, it } from "vitest";

import { SlidingWindowLimiter } from "@/lib/rate-limit.ts";

describe("SlidingWindowLimiter", () => {
  it("allows up to the limit, then blocks with a retry hint", () => {
    let now = 1_000_000;
    const limiter = new SlidingWindowLimiter(3, 60_000, () => now);

    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").remaining).toBe(1);
    expect(limiter.check("a").remaining).toBe(0);

    now += 10_000;
    const blocked = limiter.check("a");
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(50);
  });

  it("frees capacity as old hits leave the window", () => {
    let now = 0;
    const limiter = new SlidingWindowLimiter(1, 1_000, () => now);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
    now = 1_001;
    expect(limiter.check("a").allowed).toBe(true);
  });

  it("tracks keys independently", () => {
    const limiter = new SlidingWindowLimiter(1, 60_000, () => 0);
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
    expect(limiter.check("a").allowed).toBe(false);
  });

  it("does not count blocked attempts against the window", () => {
    let now = 0;
    const limiter = new SlidingWindowLimiter(1, 1_000, () => now);
    limiter.check("a");
    for (let i = 0; i < 20; i += 1) {
      now += 10;
      limiter.check("a");
    }
    now = 1_001;
    expect(limiter.check("a").allowed).toBe(true);
  });
});
