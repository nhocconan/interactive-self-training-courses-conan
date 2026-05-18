import { prisma } from "@/lib/prisma";
import { requireHR } from "@/lib/guards";
import { Card, Badge, ProgressBar } from "@/components/ui";
import {
  Users2,
  BookOpenCheck,
  Award,
  Sparkles,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

/**
 * Org analytics dashboard. SSR-only, no charting library — sparklines are
 * rendered as inline SVG so the page is fast and printable.
 *
 * Reference designs we drew from:
 *   • Cornerstone OnDemand "Reports & Analytics" home
 *   • Docebo "Pulse" dashboard
 *   • LinkedIn Learning "Insights"
 *   • Moodle Workplace "Reports Builder"
 */
export default async function ReportsPage() {
  await requireHR();

  // 90-day window for trends.
  const now = new Date();
  const since = new Date(now.getTime() - 90 * 86_400_000);

  const [
    totalUsers,
    activeUsers,
    totalCourses,
    publishedCourses,
    completedAll,
    completedRecent,
    certs,
    quizAttempts,
    quizPassed,
    progressLast90,
    completionsByCourse,
    departmentStats,
    topLearners,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isActive: true } }),
    prisma.course.count(),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.courseProgress.count({ where: { completedAt: { not: null } } }),
    prisma.courseProgress.count({ where: { completedAt: { gte: since } } }),
    prisma.certificate.count(),
    prisma.quizAttempt.count({ where: { submittedAt: { not: null } } }),
    prisma.quizAttempt.count({ where: { submittedAt: { not: null }, passed: true } }),
    prisma.courseProgress.findMany({
      where: { completedAt: { gte: since, not: null } },
      select: { completedAt: true },
    }),
    prisma.courseProgress.groupBy({
      by: ["courseId"],
      where: { completedAt: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { courseId: "desc" } },
      take: 8,
    }),
    prisma.user.groupBy({
      by: ["department"],
      where: { isActive: true, department: { not: null } },
      _count: { _all: true },
    }),
    prisma.courseProgress.groupBy({
      by: ["userId"],
      where: { completedAt: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
  ]);

  // Hydrate the top-courses / top-learners with names.
  const courseIds = completionsByCourse.map((c) => c.courseId);
  const courses = courseIds.length
    ? await prisma.course.findMany({
        where: { id: { in: courseIds } },
        select: { id: true, title: true, slug: true, kind: true, isMandatory: true },
      })
    : [];
  const courseById = new Map(courses.map((c) => [c.id, c]));

  const learnerIds = topLearners.map((l) => l.userId);
  const learners = learnerIds.length
    ? await prisma.user.findMany({
        where: { id: { in: learnerIds } },
        select: { id: true, name: true, department: true },
      })
    : [];
  const learnerById = new Map(learners.map((u) => [u.id, u]));

  // Build a 90-day sparkline (1 bucket per day).
  const bucket: number[] = Array(90).fill(0);
  for (const p of progressLast90) {
    if (!p.completedAt) continue;
    const d = Math.floor((now.getTime() - p.completedAt.getTime()) / 86_400_000);
    if (d >= 0 && d < 90) bucket[89 - d]++;
  }
  const maxBucket = Math.max(1, ...bucket);
  const passRate = quizAttempts > 0 ? Math.round((quizPassed / quizAttempts) * 100) : 0;

  // Mandatory compliance: how many active users have completed each mandatory course?
  const mandatory = await prisma.course.findMany({
    where: { isMandatory: true, isPublished: true },
    select: { id: true, title: true, slug: true },
  });
  const mandatoryRows = await Promise.all(
    mandatory.map(async (c) => {
      const done = await prisma.courseProgress.count({
        where: { courseId: c.id, completedAt: { not: null } },
      });
      const rate = activeUsers > 0 ? Math.round((done / activeUsers) * 100) : 0;
      return { ...c, done, rate };
    }),
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports &amp; analytics</h1>
        <p className="mt-1 text-sm text-[var(--muted-foreground)]">
          Org-wide learning health · 90-day window.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Kpi icon={<Users2 className="h-4 w-4" />} label="Active users" value={activeUsers} sub={`${totalUsers} total`} />
        <Kpi icon={<BookOpenCheck className="h-4 w-4" />} label="Published courses" value={publishedCourses} sub={`${totalCourses} total`} />
        <Kpi icon={<Award className="h-4 w-4" />} label="Certificates issued" value={certs} />
        <Kpi icon={<Sparkles className="h-4 w-4" />} label="Quiz pass rate" value={`${passRate}%`} sub={`${quizPassed} / ${quizAttempts}`} />
      </div>

      <Card className="p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-[var(--muted-foreground)]">
              <TrendingUp className="h-4 w-4" /> Course completions · last 90 days
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums">{completedRecent}</div>
            <div className="text-xs text-[var(--muted-foreground)]">{completedAll} all-time</div>
          </div>
          <Sparkline data={bucket} max={maxBucket} />
        </div>
      </Card>

      {mandatoryRows.length > 0 && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[var(--warning)]" />
            <h2 className="text-sm font-semibold">Mandatory training compliance</h2>
          </div>
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="py-2">Course</th>
                <th className="py-2">Completed</th>
                <th className="w-64 py-2">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {mandatoryRows.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="py-2">{c.title}</td>
                  <td className="py-2">{c.done} / {activeUsers}</td>
                  <td className="py-2">
                    <ProgressBar value={c.rate} />
                    <div className="mt-1 text-[11px] tabular-nums text-[var(--muted-foreground)]">{c.rate}%</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold">Top courses by completion</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {completionsByCourse.length === 0 ? (
              <li className="text-[var(--muted-foreground)]">No completions yet.</li>
            ) : completionsByCourse.map((row, i) => {
              const c = courseById.get(row.courseId);
              return (
                <li key={row.courseId} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--muted)] text-[10px] font-bold">{i + 1}</span>
                    <span className="truncate">{c?.title ?? "—"}</span>
                    {c?.isMandatory && <Badge tone="warning">M</Badge>}
                  </span>
                  <span className="tabular-nums text-[var(--muted-foreground)]">{row._count._all}</span>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold">Top learners</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {topLearners.length === 0 ? (
              <li className="text-[var(--muted-foreground)]">Not enough data yet.</li>
            ) : topLearners.map((row, i) => {
              const u = learnerById.get(row.userId);
              return (
                <li key={row.userId} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-[var(--muted)] text-[10px] font-bold">{i + 1}</span>
                    <span className="truncate">{u?.name ?? "—"}</span>
                    <span className="text-xs text-[var(--muted-foreground)]">{u?.department ?? ""}</span>
                  </span>
                  <span className="tabular-nums text-[var(--muted-foreground)]">{row._count._all}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-sm font-semibold">Headcount by department</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {departmentStats.length === 0 ? (
            <li className="text-[var(--muted-foreground)]">No department data yet.</li>
          ) : departmentStats
            .sort((a, b) => b._count._all - a._count._all)
            .map((d) => {
              const w = Math.max(4, Math.round((d._count._all / Math.max(1, activeUsers)) * 100));
              return (
                <li key={d.department ?? "unknown"} className="grid grid-cols-[160px_1fr_60px] items-center gap-3">
                  <span className="truncate">{d.department ?? "—"}</span>
                  <span className="h-2 rounded-full bg-[var(--muted)]">
                    <span className="block h-full rounded-full bg-[var(--primary)]" style={{ width: `${w}%` }} />
                  </span>
                  <span className="tabular-nums text-right text-[var(--muted-foreground)]">{d._count._all}</span>
                </li>
              );
            })}
        </ul>
      </Card>
    </div>
  );
}

function Kpi({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: number | string; sub?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-[var(--muted-foreground)]">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums">{value}</div>
      {sub && <div className="text-xs text-[var(--muted-foreground)]">{sub}</div>}
    </Card>
  );
}

function Sparkline({ data, max }: { data: number[]; max: number }) {
  const W = 280;
  const H = 64;
  const step = W / Math.max(1, data.length - 1);
  const points = data
    .map((v, i) => `${(i * step).toFixed(1)},${(H - (v / max) * (H - 8) - 2).toFixed(1)}`)
    .join(" ");
  const area = `0,${H} ${points} ${W},${H}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} className="text-[var(--primary)]">
      <polygon points={area} fill="currentColor" fillOpacity={0.12} />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}
