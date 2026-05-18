import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { issuePathCertificate } from "@/lib/certificate";

const Body = z.object({ pathId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const path = await prisma.learningPath.findUnique({
    where: { id: parsed.data.pathId },
    include: { steps: true },
  });
  if (!path || !path.isPublished) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (path.steps.length === 0) return NextResponse.json({ error: "empty-path" }, { status: 409 });

  const completedIds = new Set(
    (
      await prisma.courseProgress.findMany({
        where: {
          userId: session.user.id,
          courseId: { in: path.steps.map((s) => s.courseId) },
          completedAt: { not: null },
        },
        select: { courseId: true },
      })
    ).map((p) => p.courseId),
  );
  const allDone = path.steps.every((s) => completedIds.has(s.courseId));
  if (!allDone) return NextResponse.json({ error: "not-complete" }, { status: 409 });

  const cert = await issuePathCertificate({ userId: session.user.id, pathId: path.id });
  return NextResponse.json({ ok: true, code: cert.code });
}
