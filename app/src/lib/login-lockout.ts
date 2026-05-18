/**
 * Per-identifier login lockout in-process.
 * After N consecutive failures, deny logins for `cooldownMs`.
 * On success, the counter resets.
 *
 * For multi-replica deployments, back this with Redis using SETEX.
 */
type State = { failures: number; until: number };

const map = new Map<string, State>();

let maxFailures = 8;
let cooldownMs = 5 * 60_000;

/** Refresh thresholds from SiteSecurity. Called by auth on each attempt. */
export function configureLoginLockout(opts: { maxFailures: number; cooldownMinutes: number }) {
  if (opts.maxFailures > 0) maxFailures = opts.maxFailures;
  if (opts.cooldownMinutes > 0) cooldownMs = opts.cooldownMinutes * 60_000;
}

export function isLockedOut(identifier: string): boolean {
  const s = map.get(identifier);
  if (!s) return false;
  if (s.until <= Date.now()) {
    map.delete(identifier);
    return false;
  }
  return s.failures >= maxFailures;
}

export function recordLoginFailure(identifier: string): void {
  const s = map.get(identifier);
  if (!s) {
    map.set(identifier, { failures: 1, until: Date.now() + cooldownMs });
    return;
  }
  s.failures++;
  s.until = Date.now() + cooldownMs;
}

export function recordLoginSuccess(identifier: string): void {
  map.delete(identifier);
}
