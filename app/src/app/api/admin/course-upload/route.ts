import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { auth } from "@/auth";
import { ACCEPTED_UPLOAD_MIME, MAX_UPLOAD_BYTES } from "@/lib/course-content";
import { audit } from "@/lib/audit";

const ASSETS_DIR = path.resolve(
  process.cwd(),
  process.env.COURSE_ASSETS_DIR || "../course-assets",
);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `File too large. Max ${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.` },
      { status: 413 },
    );
  }
  const kind = ACCEPTED_UPLOAD_MIME[file.type];
  if (!kind) {
    return NextResponse.json(
      { error: `Unsupported content type: ${file.type}` },
      { status: 415 },
    );
  }
  await fs.mkdir(ASSETS_DIR, { recursive: true });
  const ext = path.extname(file.name).toLowerCase().slice(0, 8) || "";
  const slug = crypto.randomBytes(12).toString("hex");
  const filename = `${slug}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(ASSETS_DIR, filename), buf);
  await audit({
    actorId: session.user.id,
    action: "course.upload",
    target: filename,
    after: { name: file.name, type: file.type, size: file.size, kind },
  });
  return NextResponse.json({
    ok: true,
    contentUrl: `/courses-asset/${filename}`,
    kind,
    mimeType: file.type,
    fileSize: file.size,
    originalName: file.name,
  });
}
