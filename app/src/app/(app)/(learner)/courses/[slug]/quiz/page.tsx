import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { canAccessCourse } from "@/lib/access";
import QuizRunner from "./QuizRunner";
import { Badge, Card } from "@/components/ui";
import { ArrowLeft } from "lucide-react";

export default async function CourseQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();
  if (!session?.user) redirect("/login");

  const course = await prisma.course.findUnique({
    where: { slug },
    include: {
      quizzes: { where: { isPublished: true }, include: { questions: { orderBy: { sortOrder: "asc" } } } },
    },
  });
  if (!course) notFound();
  if (!(await canAccessCourse(session.user.id, session.user.role, course.id))) redirect("/courses");

  const quiz = course.quizzes[0];
  if (!quiz || quiz.questions.length === 0) {
    return (
      <div className="space-y-4">
        <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><ArrowLeft className="h-3 w-3" /> Back to course</Link>
        <Card className="p-8 text-center">
          <h1 className="text-xl font-semibold">No quiz available yet</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">This course doesn&apos;t have a published quiz.</p>
        </Card>
      </div>
    );
  }

  const attempts = await prisma.quizAttempt.findMany({
    where: { userId: session.user.id, quizId: quiz.id, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
  });

  const lastPassed = attempts.find((a) => a.passed);

  if (quiz.maxAttempts && attempts.length >= quiz.maxAttempts && !lastPassed) {
    return (
      <Card className="p-8 text-center">
        <h1 className="text-xl font-semibold">Max attempts reached</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">Contact your admin if you need to retake.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><ArrowLeft className="h-3 w-3" /> Back to course</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">{course.title}</div>
          <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
          {quiz.description && <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">{quiz.description}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Badge>Pass {quiz.passPercent}%</Badge>
          <Badge>{quiz.questions.length} questions</Badge>
          {quiz.timeLimitSec ? <Badge tone="warning">{Math.round(quiz.timeLimitSec / 60)} min</Badge> : null}
          {quiz.maxAttempts ? <Badge>{attempts.length}/{quiz.maxAttempts} attempts used</Badge> : null}
          {lastPassed && <Badge tone="success">Passed</Badge>}
        </div>
      </div>
      <QuizRunner quiz={{ id: quiz.id, passPercent: quiz.passPercent, timeLimitSec: quiz.timeLimitSec, shuffle: quiz.shuffle, questions: quiz.questions.map(q => ({
        id: q.id, kind: q.kind, prompt: q.prompt, options: ((q.options as unknown) as string[]) ?? [], points: q.points,
      })) }} />
    </div>
  );
}
