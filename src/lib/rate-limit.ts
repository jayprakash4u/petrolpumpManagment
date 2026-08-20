import "server-only";

/**
 * Fixed-window login throttle to blunt password-guessing. In-memory, so it
 * resets on deploy/restart and is per-instance — fine for a single-station
 * app on a single server. If this is ever deployed across multiple
 * instances, swap the Map for a shared store (Redis/Upstash) so limits are
 * enforced globally; noted in README.
 */
const attempts = new Map<string, { count: number; resetAt: number }>();
const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_ATTEMPTS = 8;

export function checkLoginRateLimit(key: string): { allowed: boolean; retryAfterSec?: number } {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true };
}

export function resetLoginRateLimit(key: string): void {
  attempts.delete(key);
}

/**
 * Clears every window. Intended for tests, which share this module-level Map
 * across cases in a file and would otherwise have one case's failed attempts
 * throttle the next. Harmless in production, where nothing calls it.
 */
export function resetAllLoginRateLimits(): void {
  attempts.clear();
}
