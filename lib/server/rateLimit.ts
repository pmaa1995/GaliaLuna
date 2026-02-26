type RateLimitBucket = {
  count: number;
  resetAt: number;
  lastSeenAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
};

// Best-effort in-memory limiter for Workers/Node runtimes.
// It won't be globally consistent across isolates, but it is cheap and
// significantly reduces accidental spam and abusive bursts.
const buckets = new Map<string, RateLimitBucket>();
let lastCleanupAt = 0;

function cleanupBuckets(now: number) {
  if (now - lastCleanupAt < 30_000) return;
  lastCleanupAt = now;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now && now - bucket.lastSeenAt > 30_000) {
      buckets.delete(key);
    }
  }
}

export function consumeRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  cleanupBuckets(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + options.windowMs;
    buckets.set(key, {
      count: 1,
      resetAt,
      lastSeenAt: now,
    });

    return {
      allowed: true,
      remaining: Math.max(0, options.limit - 1),
      retryAfterSeconds: Math.ceil(options.windowMs / 1000),
    };
  }

  existing.lastSeenAt = now;

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
    };
  }

  existing.count += 1;

  return {
    allowed: true,
    remaining: Math.max(0, options.limit - existing.count),
    retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)),
  };
}

