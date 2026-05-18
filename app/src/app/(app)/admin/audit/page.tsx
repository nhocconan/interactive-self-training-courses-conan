import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Card, Input } from "@/components/ui";

export default async function AdminAudit({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const items = await prisma.auditLog.findMany({
    where: q ? { OR: [{ action: { contains: q, mode: "insensitive" } }, { target: { contains: q } }] } : undefined,
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audit log</h1>
          <p className="text-sm text-[var(--muted-foreground)]">Last {items.length} events.</p>
        </div>
        <form className="w-72"><Input name="q" defaultValue={q} placeholder="Filter by action / target" /></form>
      </div>
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            <tr><th className="px-4 py-3">When</th><th>Actor</th><th>Action</th><th>Target</th><th>IP</th></tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">Nothing yet.</td></tr>
            ) : items.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{new Date(a.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3">{a.actor?.name ?? "—"}<div className="text-xs text-[var(--muted-foreground)]">{a.actor?.email}</div></td>
                <td className="px-4 py-3 font-mono text-xs">{a.action}</td>
                <td className="px-4 py-3 font-mono text-xs text-[var(--muted-foreground)]">{a.target || "—"}</td>
                <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{a.ip || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
