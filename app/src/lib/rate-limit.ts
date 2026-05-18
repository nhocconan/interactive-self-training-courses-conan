/**
 * Simple in-process token bucket / fixed-window rate limiter.
 *
 * Suitable for a single-replica deployment. For multi-replica deployments,
 * back this with Redis or Postgres advisory locks. The seam is the
 * `RateLimitStore` interface — swap the in-memory map for a shared store.
 */

type Bucket = { count: number; resetAt: number };

interface RateLimitStore {
  hit(key: string, windowMs: number): Bucket;
}

class MemoryStore implements RateLimitStore {
  private map = new Map<string, Bucket>();
  hit(key: string, windowMs: number): Bucket {
    const now = Date.now();
    const b = this.map.get(key);
    if (!b || b.resetAt < now) {
      const fresh = { count: 1, resetAt: now + windowMs };
      this.map.set(key, fresh);
      return fresh;
    }
    b.count++;
    return b;
  }
}

const store: RateLimitStore = new MemoryStore();

/** Configurations centralised so they're easy to audit. */
// Tuned for ~500-user enterprise traffic; bump if many users share one NAT IP.
export const RATE_LIMITS = {
  AUTH: { max: 30, windowMs: 60_000 },     // 30 login attempts / IP / min
  AI:   { max: 30, windowMs: 60_000 },     // 30 AI calls / user / min
  QUIZ: { max: 30, windowMs: 60_000 },     // 30 quiz submits / user / min
  PROGRESS: { max: 240, windowMs: 60_000 },// progress autosaves can be frequent
  GENERIC: { max: 600, windowMs: 60_000 }, // any other API
} as const;

export type RateLimitName = keyof typeof RATE_LIMITS;

export function rateLimit(name: RateLimitName, key: string): { allowed: boolean; remaining: number; resetMs: number } {
  const cfg = RATE_LIMITS[name];
  const b = store.hit(`${name}:${key}`, cfg.windowMs);
  return {
    allowed: b.count <= cfg.max,
    remaining: Math.max(0, cfg.max - b.count),
    resetMs: Math.max(0, b.resetAt - Date.now()),
  };
}

/** Best-effort client identity for rate-limit keying. Prefer authenticated user id. */
export function rateKey(req: Request, userId?: string | null): string {
  if (userId) return `u:${userId}`;
  const h = req.headers;
  const xf = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `ip:${xf || h.get("x-real-ip") || "unknown"}`;
}

/** Convenience: produce a 429 NextResponse with standard headers. */
export function tooManyResponse(reset: number): Response {
  return new Response(JSON.stringify({ error: "rate-limited" }), {
    status: 429,
    headers: {
      "Content-Type": "application/json",
      "Retry-After": String(Math.ceil(reset / 1000)),
      "X-RateLimit-Reset": String(reset),
    },
  });
}
