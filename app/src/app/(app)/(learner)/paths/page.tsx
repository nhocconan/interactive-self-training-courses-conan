import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { Card, ProgressBar } from "@/components/ui";

export default async function PathsList() {
  const session = await auth();
  const paths = await prisma.learningPath.findMany({
    where: { isPublished: true },
    include: { steps: true, _count: { select: { steps: true } } },
    orderBy: { createdAt: "desc" },
  });
  const progressByCourse = new Map(
    (
      await prisma.courseProgress.findMany({
        where: { userId: session!.user.id, completedAt: { not: null } },
      })
    ).map((p) => [p.courseId, true]),
  );

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Learning paths</h1>
      <p className="text-sm text-[var(--muted-foreground)]">Curated sequences of courses — finish them all to earn a path certificate.</p>
      {paths.length === 0 ? (
        <Card className="p-8 text-center text-sm text-[var(--muted-foreground)]">No learning paths published yet.</Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {paths.map((p) => {
            const done = p.steps.filter((s) => progressByCourse.get(s.courseId)).length;
            const pct = p.steps.length ? Math.round((done / p.steps.length) * 100) : 0;
            return (
              <Link key={p.id} href={`/paths/${p.slug}`} className="block">
                <Card className="card-hover overflow-hidden p-0">
                  <div className="h-20" style={{ background: `linear-gradient(135deg, ${p.color || "var(--brand-coral)"} 0%, var(--brand-red) 100%)` }} />
                  <div className="space-y-2 p-5">
                    <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">Path · {p._count.steps} courses</div>
                    <div className="font-semibold">{p.title}</div>
                    <p className="line-clamp-2 text-sm text-[var(--muted-foreground)]">{p.description}</p>
                    <ProgressBar value={pct} />
                    <div className="text-[11px] text-[var(--muted-foreground)]">{done}/{p.steps.length} done · {pct}%</div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
