// Simple in-memory rate limiter: at most `limit` hits per `windowMs` per key.
//
// Good enough to stop someone hammering a form from one machine. Note: on
// serverless hosting (Vercel) each instance has its own memory, so this is a
// speed bump, not a guarantee. For a hard limit, swap in a shared store such
// as Upstash Redis (planned for Phase 3).
const hits = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= limit) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing forever.
  if (hits.size > 5000) {
    for (const [k, times] of Array.from(hits.entries())) {
      if (times.every((t) => now - t >= windowMs)) hits.delete(k);
    }
  }
  return true;
}

/** Best-effort client IP from the usual proxy headers. */
export function clientIp(headers: Headers): string {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
