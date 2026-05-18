import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { accessibleCourseIds } from "@/lib/access";
import { CourseCard } from "@/components/course-card";
import { Badge, Card, EmptyState } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  Clock4,
  Flame,
  GraduationCap,
  ScrollText,
} from "lucide-react";

type Filter = "all" | "in-progress" | "completed" | "not-started" | "mandatory";
const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "in-progress", label: "In progress" },
  { key: "completed", label: "Completed" },
  { key: "not-started", label: "Not started" },
  { key: "mandatory", label: "Mandatory" },
];

export default async function MyLearningPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const session = await auth();
  const userId = session!.user.id;
  const role = session!.user.role;
  const sp = await searchParams;
  const filter: Filter = (FILTERS.find((f) => f.key === sp.filter)?.key ?? "all") as Filter;

  const ids = await accessibleCourseIds(userId, role);
  const [courses, progress, certificates] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: [...ids] }, isPublished: true },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.courseProgress.findMany({ where: { userId, courseId: { in: [...ids] } } }),
    prisma.certificate.findMany({
      where: { userId },
      orderBy: { issuedAt: "desc" },
      include: { course: { select: { title: true, slug: true } }, path: { select: { title: true, slug: true } } },
    }),
  ]);
  const progressMap = new Map(progress.map((p) => [p.courseId, p]));

  const inProgressList = courses.filter((c) => {
    const p = progressMap.get(c.id);
    return p && !p.completedAt;
  });
  const completedList = courses.filter((c) => progressMap.get(c.id)?.completedAt);
  const notStartedList = courses.filter((c) => !progressMap.get(c.id));
  const mandatoryList = courses.filter((c) => c.isMandatory);

  const filteredCourses =
    filter === "in-progress"
      ? inProgressList
      : filter === "completed"
        ? completedList
        : filter === "not-started"
          ? notStartedList
          : filter === "mandatory"
            ? mandatoryList
            : courses;

  const minutes = completedList.reduce((acc, c) => acc + (c.durationMin || 0), 0);
  const streak = computeStreakDays(progress.map((p) => p.lastSeenAt));

  return (
    <div className="space-y-10">
      <section>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
              <GraduationCap className="mr-1 inline h-3 w-3" /> Your tracking hub
            </div>
            <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">My Learning</h1>
            <p className="mt-1 max-w-xl text-sm text-[var(--muted-foreground)]">
              Every course you&apos;re enrolled in, where you left off, and what you&apos;ve earned.
            </p>
          </div>
          <Link href="/courses" className="text-sm font-semibold text-[var(--primary)] hover:underline">
            Discover more →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <Stat icon={<Clock4 className="h-4 w-4" />} label="In progress" value={inProgressList.length} />
          <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Completed" value={completedList.length} tone="success" />
          <Stat icon={<Award className="h-4 w-4" />} label="Certificates" value={certificates.length} tone="primary" />
          <Stat icon={<BookOpenCheck className="h-4 w-4" />} label="Minutes learned" value={minutes} />
          <Stat icon={<Flame className="h-4 w-4" />} label="Day streak" value={streak} tone={streak >= 3 ? "warning" : "neutral"} />
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Your courses</h2>
          <div className="flex flex-wrap items-center gap-1.5">
            {FILTERS.map((f) => {
              const active = f.key === filter;
              const count =
                f.key === "in-progress"
                  ? inProgressList.length
                  : f.key === "completed"
                    ? completedList.length
                    : f.key === "not-started"
                      ? notStartedList.length
                      : f.key === "mandatory"
                        ? mandatoryList.length
                        : courses.length;
              return (
                <Link
                  key={f.key}
                  href={f.key === "all" ? "/my-learning" : `/my-learning?filter=${f.key}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors",
                    active
                      ? "border-transparent bg-[var(--foreground)] text-[var(--background)]"
                      : "border-[var(--border)] bg-[var(--card)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]",
                  )}
                >
                  {f.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                      active ? "bg-[var(--background)]/20 text-[var(--background)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]",
                    )}
                  >
                    {count}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>

        {filteredCourses.length === 0 ? (
          <EmptyState
            title={emptyTitle(filter)}
            description={emptyDesc(filter)}
            action={
              <Link
                href="/courses"
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-[var(--primary-foreground)]"
              >
                Browse catalog
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((c) => (
              <CourseCard key={c.id} course={c} progress={progressMap.get(c.id) || null} />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Certificate cabinet</h2>
          {certificates.length > 0 && (
            <Badge tone="primary">{certificates.length} earned</Badge>
          )}
        </div>
        {certificates.length === 0 ? (
          <EmptyState
            icon={<Award className="h-6 w-6" />}
            title="No certificates yet"
            description="Complete a course or finish a learning path to earn a verifiable certificate."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <Card key={cert.id} className="card-hover overflow-hidden">
                <div className="relative bg-gradient-to-br from-[color-mix(in_oklab,var(--brand-coral)_24%,transparent)] via-[color-mix(in_oklab,var(--brand-gold)_18%,transparent)] to-transparent p-5">
                  <div className="flex items-start justify-between">
                    <Award className="h-6 w-6 text-[var(--primary)]" />
                    <Badge tone="neutral" className="font-mono text-[10px]">
                      {cert.code.slice(0, 8).toUpperCase()}
                    </Badge>
                  </div>
                  <div className="mt-3 text-xs uppercase tracking-widest text-[var(--muted-foreground)]">
                    {cert.pathId ? "Path certificate" : "Course certificate"}
                  </div>
                  <div className="mt-1 line-clamp-2 text-base font-semibold">{cert.title}</div>
                </div>
                <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-xs text-[var(--muted-foreground)]">
                  <span>Issued {new Date(cert.issuedAt).toLocaleDateString()}</span>
                  <Link
                    href={`/verify?code=${cert.code}`}
                    className="inline-flex items-center gap-1 font-medium text-[var(--primary)] hover:underline"
                  >
                    <ScrollText className="h-3 w-3" /> Verify
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "neutral" | "primary" | "success" | "warning";
}) {
  const tones = {
    neutral: "text-[var(--muted-foreground)]",
    primary: "text-[var(--primary)]",
    success: "text-[var(--success)]",
    warning: "text-[var(--warning)]",
  } as const;
  return (
    <Card className="p-4">
      <div className={cn("flex items-center gap-2", tones[tone])}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
    </Card>
  );
}

function emptyTitle(filter: Filter) {
  switch (filter) {
    case "in-progress":
      return "Nothing in progress";
    case "completed":
      return "Nothing completed yet";
    case "not-started":
      return "You've started everything 🎉";
    case "mandatory":
      return "No mandatory courses for you";
    default:
      return "No courses available";
  }
}
function emptyDesc(filter: Filter) {
  switch (filter) {
    case "in-progress":
      return "Pick a course to start — it'll show up here once you open it.";
    case "completed":
      return "Finish a course and it'll be filed here with its certificate.";
    case "not-started":
      return "Great job! Every course in your catalog has been touched.";
    case "mandatory":
      return "Your manager hasn't assigned any required training right now.";
    default:
      return "Ask your manager or HR to enroll you in a course.";
  }
}

function computeStreakDays(timestamps: Date[]): number {
  if (timestamps.length === 0) return 0;
  const days = new Set(
    timestamps.map((t) => {
      const d = new Date(t);
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    }),
  );
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  while (days.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
