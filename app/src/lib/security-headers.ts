/**
 * Standard enterprise security headers, applied to every response in proxy.ts.
 *
 * CSP rationale:
 *   - default 'self' lets us serve our app and same-origin assets.
 *   - 'unsafe-inline' in style-src is required for Tailwind's
 *     CSS-in-JS variables emitted by next/font; without it, fonts break.
 *   - script-src includes 'unsafe-eval' because Next dev uses turbopack HMR.
 *     In production this evaluates fewer scripts; tighten further as needed.
 *   - frame-ancestors 'self' prevents click-jacking.
 *   - img-src + font-src + connect-src open enough for our own CDNs + AI APIs
 *     because those calls are server-side only.
 */
export function applySecurityHeaders(res: { headers: Headers }, opts?: { isProd?: boolean }) {
  const h = res.headers;
  const prod = !!opts?.isProd;

  h.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `script-src 'self' 'unsafe-inline' ${prod ? "" : "'unsafe-eval'"}`.trim(),
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-src 'self'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "base-uri 'self'",
      "object-src 'none'",
    ].join("; "),
  );
  h.set("X-Content-Type-Options", "nosniff");
  h.set("X-Frame-Options", "SAMEORIGIN");
  h.set("Referrer-Policy", "strict-origin-when-cross-origin");
  h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  if (prod) {
    h.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  // Helpful disambiguator for downstream caches.
  h.set("Vary", "Cookie, Accept-Encoding");
  return res;
}
