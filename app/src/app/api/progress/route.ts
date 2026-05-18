import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/access";
import { z } from "zod";

const Body = z.object({
  courseId: z.string().min(1),
  percent: z.number().int().min(0).max(100),
  position: z.string().max(2000).optional(),
  complete: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });
  const { courseId, percent, position, complete } = parsed.data;

  if (!(await canAccessCourse(session.user.id, session.user.role, courseId))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const existing = await prisma.courseProgress.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId } },
  });
  const wasDone = !!existing?.completedAt;

  // Completion is an explicit action — never inferred from scroll percent.
  // A short page that triggers 100% on scroll must not auto-complete.
  const shouldComplete = !wasDone && !!complete;
  const newPct = shouldComplete ? 100 : Math.max(existing?.percent ?? 0, percent);
  const completedAt = wasDone
    ? existing!.completedAt
    : shouldComplete
      ? new Date()
      : null;

  const updated = await prisma.courseProgress.upsert({
    where: { userId_courseId: { userId: session.user.id, courseId } },
    create: {
      userId: session.user.id,
      courseId,
      percent: newPct,
      position,
      completedAt,
    },
    update: {
      percent: newPct,
      position,
      completedAt,
      lastSeenAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true, progress: updated });
}
