import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/access";

const COURSES_DIR = path.resolve(process.cwd(), process.env.COURSES_DIR || "../courses");

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) return new NextResponse("Not found", { status: 404 });

  const allowed = await canAccessCourse(session.user.id, session.user.role, course.id);
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  // sanitize: only allow files that live under COURSES_DIR
  const target = path.resolve(COURSES_DIR, course.htmlPath);
  if (!target.startsWith(COURSES_DIR + path.sep)) {
    return new NextResponse("Bad path", { status: 400 });
  }
  try {
    const buf = await fs.readFile(target);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff",
        // Permissive CSP intended for the interactive HTML courses we ship.
        // Courses may use Tailwind CDN, Google Fonts, embedded images/iframes
        // (e.g. YouTube), and inline scripts. Keep `frame-ancestors 'self'`
        // so the lesson can only be embedded by our own portal.
        "Content-Security-Policy": [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https:",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
          "style-src 'self' 'unsafe-inline' https:",
          "font-src 'self' data: https:",
          "img-src 'self' data: blob: https:",
          "media-src 'self' data: blob: https:",
          "frame-src 'self' https:",
          "connect-src 'self' https:",
          "frame-ancestors 'self'",
        ].join("; "),
        "Referrer-Policy": "strict-origin-when-cross-origin",
      },
    });
  } catch {
    return new NextResponse("File missing on disk", { status: 410 });
  }
}
