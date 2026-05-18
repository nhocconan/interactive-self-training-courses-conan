import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { Card, Badge } from "@/components/ui";
import LdapPicker from "./LdapPicker";
import LdapSyncButton from "./LdapSyncButton";

export default async function LdapSyncPage() {
  await requireAdmin();
  const cfg = await prisma.ldapConfig.findUnique({ where: { id: 1 } });
  const ldapUsers = await prisma.user.findMany({
    where: { source: "LDAP" },
    orderBy: { ldapSyncedAt: "desc" },
    take: 100,
  });

  if (!cfg?.enabled) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">LDAP / AD users</h1>
        <Card className="p-6 text-sm">
          LDAP is not enabled. <Link href="/admin/ldap" className="font-semibold text-[var(--primary)]">Configure it first →</Link>
        </Card>
      </div>
    );
  }

  const subtrees = (cfg.subtreeOUs ?? "").split(/\r?\n/).filter(Boolean);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">LDAP / AD users</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Search the configured sub-tree(s) and add directory users into the portal. They sign in with their AD password — no local password is set.
          </p>
        </div>
        <LdapSyncButton />
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold">Searching in</h2>
        <ul className="mt-2 space-y-1 text-xs font-mono text-[var(--muted-foreground)]">
          {subtrees.length === 0 ? (
            <li>{cfg.baseDN ?? "(base DN not set)"}</li>
          ) : (
            subtrees.map((o) => <li key={o}>{o}</li>)
          )}
        </ul>
        <p className="mt-2 text-xs text-[var(--muted-foreground)]">
          Edit on <Link href="/admin/ldap" className="font-semibold text-[var(--primary)]">LDAP settings</Link>.
        </p>
      </Card>

      <LdapPicker />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
          Already provisioned ({ldapUsers.length})
        </div>
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
            <tr>
              <th className="px-4 py-2">User</th>
              <th className="px-4 py-2">Dept</th>
              <th className="px-4 py-2">DN</th>
              <th className="px-4 py-2">Last sync</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {ldapUsers.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-[var(--muted-foreground)]">No LDAP users yet — search above to add some.</td></tr>
            ) : ldapUsers.map((u) => (
              <tr key={u.id} className="border-t">
                <td className="px-4 py-2">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-[var(--muted-foreground)]">{u.email}</div>
                </td>
                <td className="px-4 py-2">{u.department ?? "—"}</td>
                <td className="px-4 py-2 font-mono text-[11px] text-[var(--muted-foreground)]">{u.ldapDn ?? "—"}</td>
                <td className="px-4 py-2 text-xs">{u.ldapSyncedAt ? new Date(u.ldapSyncedAt).toLocaleString() : "—"}</td>
                <td className="px-4 py-2">{u.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Disabled</Badge>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
