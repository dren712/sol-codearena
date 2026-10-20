/**
 * Minimal in-memory rate limiter for public API routes.
 *
 * Deliberately dependency-free: the app targets a single Node process for demo
 * purposes. If this is ever deployed across multiple instances, swap the Map
 * for a shared store (Redis, Upstash) — the call sites do not change.
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

let lastSweep = 0;
const SWEEP_INTERVAL_MS = 60_000;

/** Drops expired buckets so a long-running process cannot leak memory. */
function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  /** Seconds until the window resets. */
  retryAfterSeconds: number;
  limit: number;
};

/**
 * Consumes one token for `key` and reports whether the call is allowed.
 *
 * @param key       Identifier to bucket on (usually IP + wallet address)
 * @param limit     Maximum requests allowed per window
 * @param windowMs  Window length in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: limit - 1,
      retryAfterSeconds: 0,
      limit,
    };
  }

  existing.count += 1;

  const allowed = existing.count <= limit;
  const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));

  return {
    allowed,
    remaining: Math.max(0, limit - existing.count),
    retryAfterSeconds: allowed ? 0 : retryAfterSeconds,
    limit,
  };
}

/**
 * Best-effort client identity for rate limiting.
 *
 * The key is scoped per route so that one noisy endpoint cannot exhaust
 * another's budget (e.g. spamming validation shouldn't block the faucet).
 *
 * @param headers Request headers
 * @param scope   Route identifier, e.g. `'validate'`
 * @param id      Optional finer-grained identifier, e.g. a wallet address
 */
export function clientKey(headers: Headers, scope: string, id?: string): string {
  const forwarded = headers.get('x-forwarded-for');
  const ip =
    forwarded?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'local';

  return id ? `${ip}|${scope}|${id}` : `${ip}|${scope}`;
}

/** Clears all buckets. Exposed for tests. */
export function resetRateLimits(): void {
  buckets.clear();
  lastSweep = 0;
}