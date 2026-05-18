import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireHR } from "@/lib/guards";
import { Badge, Card, ProgressBar } from "@/components/ui";
import { Download } from "lucide-react";

type Row = {
  id: string;
  name: string;
  email: string;
  department: string | null;
  assigned: number;
  inProgress: number;
  completed: number;
  lastSeen: Date | null;
};

async function loadRows(dept?: string): Promise<{ rows: Row[]; depts: string[] }> {
  // Aggregate counts in SQL to avoid N+1 over 500 users.
  // 1. base users
  const users = await prisma.user.findMany({
    where: { isActive: true, ...(dept ? { department: dept } : {}) },
    select: { id: true, name: true, email: true, department: true },
    orderBy: [{ department: "asc" }, { name: "asc" }],
  });
  if (users.length === 0) return { rows: [], depts: [] };

  const ids = users.map((u) => u.id);
  // 2. aggregate progress
  const progAgg = await prisma.courseProgress.groupBy({
    by: ["userId"],
    where: { userId: { in: ids } },
    _count: { _all: true },
    _max: { lastSeenAt: true },
  });
  const completedAgg = await prisma.courseProgress.groupBy({
    by: ["userId"],
    where: { userId: { in: ids }, completedAt: { not: null } },
    _count: { _all: true },
  });
  // 3. aggregate access (direct + via category)
  const directAgg = await prisma.enrollment.groupBy({
    by: ["userId"],
    where: { userId: { in: ids } },
    _count: { _all: true },
  });
  const catGrants = await prisma.categoryGrant.findMany({
    where: { userId: { in: ids } },
    select: { userId: true, categoryId: true },
  });
  const catIds = [...new Set(catGrants.map((g) => g.categoryId))];
  const coursesByCat = catIds.length
    ? await prisma.course.groupBy({
        by: ["categoryId"],
        where: { categoryId: { in: catIds }, isPublished: true },
        _count: { _all: true },
      })
    : [];
  const catCoursesMap = new Map(coursesByCat.map((g) => [g.categoryId!, g._count._all]));

  const directMap = new Map(directAgg.map((g) => [g.userId, g._count._all]));
  const progMap = new Map(progAgg.map((g) => [g.userId, { total: g._count._all, last: g._max.lastSeenAt }]));
  const doneMap = new Map(completedAgg.map((g) => [g.userId, g._count._all]));
  const grantsByUser = new Map<string, number>();
  for (const g of catGrants) {
    const inc = catCoursesMap.get(g.categoryId) ?? 0;
    grantsByUser.set(g.userId, (grantsByUser.get(g.userId) ?? 0) + inc);
  }

  const rows: Row[] = users.map((u) => {
    const total = progMap.get(u.id);
    const done = doneMap.get(u.id) ?? 0;
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department,
      assigned: (directMap.get(u.id) ?? 0) + (grantsByUser.get(u.id) ?? 0),
      inProgress: Math.max(0, (total?.total ?? 0) - done),
      completed: done,
      lastSeen: total?.last ?? null,
    };
  });

  const depts = [...new Set(rows.map((r) => r.department).filter(Boolean) as string[])];
  return { rows, depts };
}

export default async function HrReports({
  searchParams,
}: {
  searchParams: Promise<{ dept?: string }>;
}) {
  await requireHR();
  const { dept } = await searchParams;
  const { rows, depts } = await loadRows(dept);

  const totalCompletions = rows.reduce((n, r) => n + r.completed, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR reports</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Track learning across Demo Group.</p>
        </div>
        <Link
          href={`/api/hr/export${dept ? `?dept=${encodeURIComponent(dept)}` : ""}`}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[var(--border)] bg-transparent px-3 text-xs font-medium text-[var(--foreground)] hover:bg-[var(--muted)]"
        >
          <Download className="h-3.5 w-3.5" /> Export CSV
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="p-4"><div className="text-xs text-[var(--muted-foreground)]">Active employees</div><div className="mt-1 text-2xl font-bold">{rows.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-[var(--muted-foreground)]">Departments</div><div className="mt-1 text-2xl font-bold">{depts.length}</div></Card>
        <Card className="p-4"><div className="text-xs text-[var(--muted-foreground)]">Total completions</div><div className="mt-1 text-2xl font-bold">{totalCompletions}</div></Card>
        <Card className="p-4"><div className="text-xs text-[var(--muted-foreground)]">In progress</div><div className="mt-1 text-2xl font-bold">{rows.reduce((n, r) => n + r.inProgress, 0)}</div></Card>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-2 px-2 py-1 text-xs">
          <span className="text-[var(--muted-foreground)]">Department:</span>
          <Link className={`rounded-full border px-3 py-1 ${!dept ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : ""}`} href="/hr">All</Link>
          {depts.map((d) => (
            <Link key={d} className={`rounded-full border px-3 py-1 ${dept === d ? "bg-[var(--primary)] text-[var(--primary-foreground)]" : ""}`} href={`/hr?dept=${encodeURIComponent(d)}`}>{d}</Link>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">Employee</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Assigned</th>
                <th className="px-4 py-3">Completed</th>
                <th className="px-4 py-3">In progress</th>
                <th className="px-4 py-3 w-48">Completion rate</th>
                <th className="px-4 py-3">Last activity</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No active employees match this filter.</td></tr>
              ) : rows.map((r) => {
                const denom = Math.max(r.assigned, r.completed, 1);
                const rate = Math.round((r.completed / denom) * 100);
                return (
                  <tr key={r.id} className="border-t">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-[var(--muted-foreground)]">{r.email}</div>
                    </td>
                    <td className="px-4 py-3">{r.department || <Badge>—</Badge>}</td>
                    <td className="px-4 py-3">{r.assigned}</td>
                    <td className="px-4 py-3 text-[var(--success)] font-medium">{r.completed}</td>
                    <td className="px-4 py-3">{r.inProgress}</td>
                    <td className="px-4 py-3"><ProgressBar value={rate} /><div className="mt-1 text-[11px] text-[var(--muted-foreground)]">{rate}%</div></td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{r.lastSeen ? new Date(r.lastSeen).toLocaleDateString() : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
