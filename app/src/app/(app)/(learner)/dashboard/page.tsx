import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { accessibleCourseIds } from "@/lib/access";
import { CourseCard } from "@/components/course-card";
import { Card, EmptyState } from "@/components/ui";
import { Award, BookOpenCheck, Clock4, Sparkles } from "lucide-react";

export default async function Dashboard() {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;

  const ids = await accessibleCourseIds(userId, role);
  const courses = await prisma.course.findMany({
    where: { id: { in: [...ids] }, isPublished: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });
  const progress = await prisma.courseProgress.findMany({
    where: { userId, courseId: { in: courses.map((c) => c.id) } },
  });
  const progressMap = new Map(progress.map((p) => [p.courseId, p]));

  const inProgress = courses.filter((c) => {
    const p = progressMap.get(c.id);
    return p && !p.completedAt;
  });
  const completed = progress.filter((p) => p.completedAt).length;
  const minutes = courses
    .filter((c) => progressMap.get(c.id)?.completedAt)
    .reduce((acc, c) => acc + (c.durationMin || 0), 0);

  const recommended = courses
    .filter((c) => !progressMap.get(c.id))
    .slice(0, 6);

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
              Welcome back
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Hi, {session!.user.name?.split(" ")[0] || "there"} 👋
            </h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
              Continue where you left off or explore something new today.
            </p>
          </div>
          <Link
            href="/courses"
            className="text-sm font-semibold text-[var(--primary)] hover:underline"
          >
            Browse catalog →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={<BookOpenCheck className="h-4 w-4" />} label="Accessible" value={courses.length} />
          <Stat icon={<Clock4 className="h-4 w-4" />} label="In progress" value={inProgress.length} />
          <Stat icon={<Award className="h-4 w-4" />} label="Completed" value={completed} />
          <Stat icon={<Sparkles className="h-4 w-4" />} label="Minutes learned" value={minutes} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">Continue learning</h2>
        {inProgress.length === 0 ? (
          <EmptyState
            title="Nothing in progress yet"
            description="Pick a course from your catalog and start learning."
            action={
              <Link
                href="/courses"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
              >
                Browse courses
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {inProgress.map((c) => (
              <CourseCard key={c.id} course={c} progress={progressMap.get(c.id) || null} />
            ))}
          </div>
        )}
      </section>

      {recommended.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold">Recommended for you</h2>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}
