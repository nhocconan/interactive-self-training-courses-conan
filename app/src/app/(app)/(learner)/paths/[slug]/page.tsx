import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { CheckCircle2, Lock, Award } from "lucide-react";
import { ClaimPathCertButton } from "./ClaimPathCertButton";

export default async function PathDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const path = await prisma.learningPath.findUnique({
    where: { slug },
    include: { steps: { include: { course: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (!path || !path.isPublished) notFound();

  const [progress, existingCert] = await Promise.all([
    prisma.courseProgress.findMany({
      where: { userId: session!.user.id, courseId: { in: path.steps.map((s) => s.courseId) } },
    }),
    prisma.certificate.findFirst({
      where: { userId: session!.user.id, pathId: path.id },
      select: { code: true },
    }),
  ]);
  const doneSet = new Set(progress.filter((p) => p.completedAt).map((p) => p.courseId));
  const allDone = path.steps.length > 0 && path.steps.every((s) => doneSet.has(s.courseId));

  const completedCount = path.steps.filter((s) => doneSet.has(s.courseId)).length;
  const pct = path.steps.length ? Math.round((completedCount / path.steps.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Learning path</div>
        <h1 className="text-3xl font-bold tracking-tight">{path.title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-[var(--muted-foreground)]">{path.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="w-48"><ProgressBar value={pct} /></div>
          <Badge tone={allDone ? "success" : "neutral"}>{completedCount}/{path.steps.length} steps</Badge>
          {allDone && (existingCert ? (
            <Link href={`/verify/${existingCert.code}`} className="inline-flex items-center gap-1 rounded-full border border-[var(--success)]/40 bg-[color-mix(in_oklab,var(--success)_10%,transparent)] px-3 py-1 text-xs font-semibold text-[var(--success)]">
              <Award className="h-3 w-3" /> Certificate · {existingCert.code}
            </Link>
          ) : (
            <ClaimPathCertButton pathId={path.id} />
          ))}
        </div>
      </div>

      <ol className="space-y-3">
        {path.steps.map((s, i) => {
          const done = doneSet.has(s.courseId);
          const prevDone = i === 0 ? true : doneSet.has(path.steps[i - 1].courseId);
          const locked = !done && !prevDone;
          return (
            <li key={s.id}>
              <Card className={`flex items-center justify-between gap-3 p-5 ${locked ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--muted)] font-semibold">{i + 1}</span>
                  <div>
                    <div className="font-semibold">{s.course.title}</div>
                    <div className="text-xs text-[var(--muted-foreground)]">{s.course.level || ""}</div>
                  </div>
                </div>
                {done ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--success)]"><CheckCircle2 className="h-4 w-4" /> Completed</span>
                ) : locked ? (
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)]"><Lock className="h-4 w-4" /> Finish previous step first</span>
                ) : (
                  <Link href={`/courses/${s.course.slug}`} className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-xs font-semibold text-[var(--primary-foreground)]">Start</Link>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
