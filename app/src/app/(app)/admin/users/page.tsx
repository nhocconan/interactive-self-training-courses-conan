import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Badge, Card } from "@/components/ui";
import { initials } from "@/lib/utils";
import NewUserForm from "./NewUserForm";
import UserRoleSelect from "./UserRoleSelect";

export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { email: { contains: q, mode: "insensitive" } },
            { name: { contains: q, mode: "insensitive" } },
            { username: { contains: q, mode: "insensitive" } },
            { department: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-[var(--muted-foreground)]">{users.length} accounts</p>
        </div>
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="Search name / email / dept"
            className="h-9 w-64 rounded-lg border border-[var(--border)] bg-[var(--input)] px-3 text-sm"
          />
        </form>
      </div>

      <NewUserForm />

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--muted)] text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last login</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-[var(--border)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-full bg-[var(--brand-coral)] text-[10px] font-bold text-white">
                        {initials(u.name)}
                      </span>
                      <div>
                        <div className="font-medium">{u.name}</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={u.source === "LDAP" ? "primary" : "neutral"}>{u.source}</Badge>
                  </td>
                  <td className="px-4 py-3 text-[var(--muted-foreground)]">{u.department || "—"}</td>
                  <td className="px-4 py-3">
                    <UserRoleSelect userId={u.id} role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Disabled</Badge>}
                  </td>
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "Never"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="text-xs font-semibold text-[var(--primary)] hover:underline"
                    >
                      Manage →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
