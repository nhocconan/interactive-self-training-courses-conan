import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Card } from "@/components/ui";
import QuestionEditor from "./QuestionEditor";
import GenerateQuizPanel from "./GenerateQuizPanel";
import { ArrowLeft } from "lucide-react";

export default async function QuizEditor({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { id },
    include: { course: true, questions: { orderBy: { sortOrder: "asc" } } },
  });
  if (!quiz) notFound();
  return (
    <div className="space-y-6">
      <Link href="/admin/quizzes" className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><ArrowLeft className="h-3 w-3" /> All quizzes</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Quiz for {quiz.course.title}</div>
          <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Pass {quiz.passPercent}% · {quiz.maxAttempts ? `${quiz.maxAttempts} attempts` : "unlimited attempts"} · {quiz.timeLimitSec ? `${quiz.timeLimitSec / 60} min` : "no time limit"}
          </p>
        </div>
        <Badge tone={quiz.isPublished ? "success" : "neutral"}>{quiz.isPublished ? "Published" : "Draft"}</Badge>
      </div>

      <GenerateQuizPanel quizId={quiz.id} courseId={quiz.courseId} />

      <div className="space-y-3">
        {quiz.questions.length === 0 ? (
          <Card className="p-8 text-center text-sm text-[var(--muted-foreground)]">
            No questions yet. Add one below or generate from course content with AI.
          </Card>
        ) : (
          quiz.questions.map((q, i) => (
            <QuestionEditor key={q.id} quizId={quiz.id} index={i} initial={q} />
          ))
        )}
        <QuestionEditor quizId={quiz.id} index={quiz.questions.length} initial={null} />
      </div>
    </div>
  );
}
