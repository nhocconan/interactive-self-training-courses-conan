import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/access";

const Body = z.object({ quizId: z.string().min(1) });

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const quiz = await prisma.quiz.findUnique({ where: { id: parsed.data.quizId } });
  if (!quiz) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (!(await canAccessCourse(session.user.id, session.user.role, quiz.courseId)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const submitted = await prisma.quizAttempt.count({
    where: { quizId: quiz.id, userId: session.user.id, submittedAt: { not: null } },
  });
  if (quiz.maxAttempts && submitted >= quiz.maxAttempts) {
    const passed = await prisma.quizAttempt.findFirst({
      where: { quizId: quiz.id, userId: session.user.id, passed: true },
      select: { id: true },
    });
    if (!passed) return NextResponse.json({ error: "max-attempts" }, { status: 409 });
  }

  // Reuse a still-open attempt if there is one (browser refresh).
  let open = await prisma.quizAttempt.findFirst({
    where: { quizId: quiz.id, userId: session.user.id, submittedAt: null },
    orderBy: { startedAt: "desc" },
  });
  if (!open) {
    open = await prisma.quizAttempt.create({
      data: { quizId: quiz.id, userId: session.user.id },
    });
  }
  return NextResponse.json({
    attemptId: open.id,
    startedAt: open.startedAt.toISOString(),
    timeLimitSec: quiz.timeLimitSec,
  });
}
