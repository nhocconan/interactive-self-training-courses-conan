import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/access";
import { gradeAttempt, type LearnerAnswer } from "@/lib/quiz";
import { issueCourseCertificate } from "@/lib/certificate";
import { notify } from "@/lib/notifications";

const Body = z.object({
  quizId: z.string().min(1),
  attemptId: z.string().min(1).optional(),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      value: z.union([z.string(), z.number(), z.array(z.number()), z.null()]),
    }),
  ).max(200),
});

const GRACE_SEC = 10; // small clock-skew tolerance

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const quiz = await prisma.quiz.findUnique({
    where: { id: parsed.data.quizId },
    include: { questions: true, course: true },
  });
  if (!quiz) return NextResponse.json({ error: "not-found" }, { status: 404 });
  if (!(await canAccessCourse(session.user.id, session.user.role, quiz.courseId)))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });

  // Resolve attempt: either the explicit one or the most recent open attempt
  // for this user/quiz. If none exists, open one on the fly (legacy compat).
  let attempt = parsed.data.attemptId
    ? await prisma.quizAttempt.findUnique({ where: { id: parsed.data.attemptId } })
    : await prisma.quizAttempt.findFirst({
        where: { quizId: quiz.id, userId: session.user.id, submittedAt: null },
        orderBy: { startedAt: "desc" },
      });
  if (attempt && (attempt.userId !== session.user.id || attempt.quizId !== quiz.id)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (!attempt) {
    attempt = await prisma.quizAttempt.create({
      data: { quizId: quiz.id, userId: session.user.id },
    });
  }
  if (attempt.submittedAt) {
    return NextResponse.json({ error: "already-submitted" }, { status: 409 });
  }

  // Enforce server-side time limit.
  const elapsedSec = Math.max(1, Math.round((Date.now() - attempt.startedAt.getTime()) / 1000));
  if (quiz.timeLimitSec && elapsedSec > quiz.timeLimitSec + GRACE_SEC) {
    // Auto-submit with 0 score, mark as not passed.
    const tl = await prisma.quizAttempt.update({
      where: { id: attempt.id },
      data: {
        score: 0,
        passed: false,
        submittedAt: new Date(),
        durationSec: elapsedSec,
        answers: [] as unknown as object,
      },
    });
    return NextResponse.json(
      { ok: false, error: "time-expired", attemptId: tl.id, scorePct: 0, passed: false, graded: [] },
      { status: 200 },
    );
  }

  const answers = parsed.data.answers as LearnerAnswer[];
  const { graded, scorePct } = gradeAttempt(quiz.questions, answers);
  const passed = scorePct >= quiz.passPercent;

  const final = await prisma.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      score: scorePct,
      passed,
      submittedAt: new Date(),
      durationSec: elapsedSec,
      answers: graded as unknown as object,
    },
  });

  if (passed) {
    // Course is now complete — but preserve the ORIGINAL completedAt
    // if it was set by an earlier pass.
    const existingProg = await prisma.courseProgress.findUnique({
      where: { userId_courseId: { userId: session.user.id, courseId: quiz.courseId } },
      select: { completedAt: true },
    });
    await prisma.courseProgress.upsert({
      where: { userId_courseId: { userId: session.user.id, courseId: quiz.courseId } },
      create: {
        userId: session.user.id,
        courseId: quiz.courseId,
        percent: 100,
        completedAt: new Date(),
      },
      update: {
        percent: 100,
        completedAt: existingProg?.completedAt ?? new Date(),
        lastSeenAt: new Date(),
      },
    });
    await issueCourseCertificate({
      userId: session.user.id,
      courseId: quiz.courseId,
      meta: { quizId: quiz.id, score: scorePct },
    });
  } else {
    await notify({
      userId: session.user.id,
      kind: "QUIZ_GRADED",
      title: `Quiz "${quiz.title}" — ${scorePct}%`,
      body: `Score below ${quiz.passPercent}% — review and retake when ready.`,
      href: `/courses/${quiz.course.slug}/quiz`,
    });
  }

  return NextResponse.json({ ok: true, attemptId: final.id, scorePct, passed, graded });
}
