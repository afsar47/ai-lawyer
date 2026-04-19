type Bucket = {
  count: number;
  resetAt: number;
};

// Simple in-memory limiter (single-tenant/dev friendly).
// Note: In serverless, this is best-effort. Replace with Redis/Upstash if needed.
const buckets = new Map<string, Bucket>();

export type RateLimitResult =
  | { ok: true; remaining: number; resetAt: number }
  | { ok: false; remaining: 0; resetAt: number; retryAfterSeconds: number };

export function rateLimit(args: {
  key: string; // e.g. `${userId}:${route}`
  limit: number;
  windowMs: number;
  now?: number;
}): RateLimitResult {
  const now = args.now ?? Date.now();
  const existing = buckets.get(args.key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + args.windowMs;
    buckets.set(args.key, { count: 1, resetAt });
    return { ok: true, remaining: Math.max(args.limit - 1, 0), resetAt };
  }

  if (existing.count >= args.limit) {
    const retryAfterSeconds = Math.max(Math.ceil((existing.resetAt - now) / 1000), 1);
    return { ok: false, remaining: 0, resetAt: existing.resetAt, retryAfterSeconds };
  }

  existing.count += 1;
  buckets.set(args.key, existing);
  return { ok: true, remaining: Math.max(args.limit - existing.count, 0), resetAt: existing.resetAt };
}

