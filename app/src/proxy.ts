import { auth } from "@/auth";
import { NextResponse } from "next/server";
import { applySecurityHeaders } from "@/lib/security-headers";
import { rateLimit, rateKey, tooManyResponse } from "@/lib/rate-limit";

const isProd = process.env.NODE_ENV === "production";

/**
 * Apply our enterprise security headers — but NEVER for `/courses-html/*`.
 * Those responses ship interactive course HTML that loads Tailwind CDN,
 * Google Fonts, etc.; the route handler sets the right (permissive) CSP
 * for them. Layering a strict CSP on top would intersect to "deny" and
 * break the course content.
 */
function withHeaders(res: NextResponse, path: string): NextResponse {
  if (path.startsWith("/courses-html/")) return res;
  applySecurityHeaders(res, { isProd });
  return res;
}

export default auth((req) => {
  const { nextUrl, auth: session } = req;
  const isAuthed = !!session?.user;
  const path = nextUrl.pathname;
  const isApi = path.startsWith("/api/");

  if (path.startsWith("/api/auth/callback") || path.startsWith("/api/auth/signin")) {
    const rl = rateLimit("AUTH", rateKey(req, null));
    if (!rl.allowed) {
      return withHeaders(
        NextResponse.json(
          { error: "rate-limited" },
          { status: 429, headers: { "Retry-After": String(Math.ceil(rl.resetMs / 1000)) } },
        ),
        path,
      );
    }
  }

  const publicPaths = [
    "/login",
    "/api/auth",
    "/api/health",
    "/_next",
    "/favicon",
    "/apple-touch-icon",
    "/icon-",
    "/brand",
    "/logo",
    "/verify",
  ];
  if (publicPaths.some((p) => path.startsWith(p))) {
    return withHeaders(NextResponse.next(), path);
  }

  if (!isAuthed) {
    if (isApi) {
      return withHeaders(NextResponse.json({ error: "unauthorized" }, { status: 401 }), path);
    }
    const url = new URL("/login", nextUrl);
    url.searchParams.set("from", path);
    return withHeaders(NextResponse.redirect(url), path);
  }

  if (isApi) {
    const key = rateKey(req, session.user.id);
    let cfg: "AI" | "QUIZ" | "PROGRESS" | "GENERIC" = "GENERIC";
    if (path.startsWith("/api/ai/")) cfg = "AI";
    else if (path.startsWith("/api/quiz/")) cfg = "QUIZ";
    else if (path.startsWith("/api/progress")) cfg = "PROGRESS";
    const rl = rateLimit(cfg, key);
    if (!rl.allowed) {
      return withHeaders(tooManyResponse(rl.resetMs) as unknown as NextResponse, path);
    }
  }

  if (path.startsWith("/admin") && session.user.role !== "ADMIN") {
    return withHeaders(NextResponse.redirect(new URL("/dashboard", nextUrl)), path);
  }
  if (path.startsWith("/hr") && !["HR", "ADMIN"].includes(session.user.role)) {
    return withHeaders(NextResponse.redirect(new URL("/dashboard", nextUrl)), path);
  }

  return withHeaders(NextResponse.next(), path);
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|favicon-.*\\.png|apple-touch-icon\\.png|icon-.*\\.png|brand/|logo.*).*)"],
};
