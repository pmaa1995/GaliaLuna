import { getCloudflareContext } from "@opennextjs/cloudflare";

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
  // Unknown when Cloudflare's shared limiter answered.
  remaining: number | null;
  retryAfterSeconds: number;
};

type RateLimiterBinding = { limit: (options: { key: string }) => Promise<{ success: boolean }> };

// Fallback in-memory limiter, used when the Cloudflare binding is unavailable (local development).
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

async function getOrdersRateLimiter(): Promise<RateLimiterBinding | null> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as { ORDERS_RATE_LIMITER?: RateLimiterBinding }).ORDERS_RATE_LIMITER ?? null;
  } catch {
    return null;
  }
}

// Order creation uses Cloudflare's Rate Limiting binding (wrangler.jsonc, 60 s window) when deployed.
export async function consumeOrderRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult & { source: "shared" | "local" }> {
  const limiter = await getOrdersRateLimiter();
  if (!limiter) return { ...consumeRateLimit(key, options), source: "local" };
  try {
    const { success } = await limiter.limit({ key });
    return { allowed: success, remaining: null, retryAfterSeconds: 60, source: "shared" };
  } catch {
    return { ...consumeRateLimit(key, options), source: "local" };
  }
}
