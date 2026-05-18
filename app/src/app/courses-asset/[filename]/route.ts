import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import { createReadStream, statSync } from "fs";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/access";

const ASSETS_DIR = path.resolve(
  process.cwd(),
  process.env.COURSE_ASSETS_DIR || "../course-assets",
);

const MIME_BY_EXT: Record<string, string> = {
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".ppt": "application/vnd.ms-powerpoint",
};

export async function GET(
  req: Request,
  ctx: { params: Promise<{ filename: string }> },
) {
  const { filename } = await ctx.params;
  const session = await auth();
  if (!session?.user) return new NextResponse("Unauthorized", { status: 401 });

  // Validate filename doesn't escape the assets dir.
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return new NextResponse("Bad filename", { status: 400 });
  }
  const target = path.resolve(ASSETS_DIR, filename);
  if (!target.startsWith(ASSETS_DIR + path.sep)) {
    return new NextResponse("Bad path", { status: 400 });
  }

  // Find the course this asset is attached to and check access.
  const url = `/courses-asset/${filename}`;
  const course = await prisma.course.findFirst({ where: { contentUrl: url } });
  if (!course) return new NextResponse("Not found", { status: 404 });
  const allowed = await canAccessCourse(session.user.id, session.user.role, course.id);
  if (!allowed) return new NextResponse("Forbidden", { status: 403 });

  let stat;
  try {
    stat = statSync(target);
  } catch {
    return new NextResponse("File missing", { status: 410 });
  }
  const ext = path.extname(target).toLowerCase();
  const contentType = course.mimeType ?? MIME_BY_EXT[ext] ?? "application/octet-stream";

  // HTTP Range support for video files.
  const range = req.headers.get("range");
  if (range && contentType.startsWith("video/")) {
    const m = /^bytes=(\d+)-(\d*)$/.exec(range);
    if (m) {
      const start = Number(m[1]);
      const end = m[2] ? Number(m[2]) : stat.size - 1;
      if (start < stat.size && end < stat.size) {
        const stream = createReadStream(target, { start, end });
        return new NextResponse(stream as unknown as BodyInit, {
          status: 206,
          headers: {
            "Content-Type": contentType,
            "Content-Length": String(end - start + 1),
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Cache-Control": "private, max-age=300",
          },
        });
      }
    }
  }

  const buf = await fs.readFile(target);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(stat.size),
      "Accept-Ranges": contentType.startsWith("video/") ? "bytes" : "none",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
