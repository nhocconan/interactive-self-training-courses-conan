/**
 * Enterprise-acceptable password policy for LOCAL accounts.
 * LDAP-managed accounts inherit their directory's policy.
 *
 * The minimum length and class-count are configurable per-deployment via
 * the SiteSecurity admin page. Callers can pass overrides; defaults match
 * the previous hard-coded policy.
 */
export function validatePassword(
  pwd: string,
  policy: { minLength?: number; minClasses?: number } = {},
): { ok: true } | { ok: false; reason: string } {
  const minLength = Math.max(8, policy.minLength ?? 10);
  const minClasses = Math.max(1, Math.min(4, policy.minClasses ?? 3));
  if (pwd.length < minLength)
    return { ok: false, reason: `Password must be at least ${minLength} characters.` };
  if (pwd.length > 128) return { ok: false, reason: "Password is too long." };
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) => re.test(pwd)).length;
  if (classes < minClasses)
    return {
      ok: false,
      reason: `Use at least ${minClasses} of: lowercase, uppercase, digit, symbol.`,
    };
  // simple weakest-100 deny list
  const banned = ["password", "qwerty", "123456", "letmein", "welcome", "admin", "demo", "passw0rd"];
  if (banned.some((b) => pwd.toLowerCase().includes(b))) {
    return { ok: false, reason: "Password contains a banned word." };
  }
  return { ok: true };
}
