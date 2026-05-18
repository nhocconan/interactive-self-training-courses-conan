import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { PERMISSION_CATALOG, invalidatePermissionCache } from "@/lib/rbac";
import { Button, Card } from "@/components/ui";
import type { Role } from "@prisma/client";

const ROLES: Role[] = ["USER", "HR", "ADMIN"];

async function saveMatrix(form: FormData) {
  "use server";
  const s = await requireAdmin();
  // Ensure every catalogue permission exists in DB.
  const all = await prisma.permission.findMany();
  const byKey = new Map(all.map((p) => [p.key, p]));
  for (const def of PERMISSION_CATALOG) {
    if (!byKey.has(def.key)) {
      const p = await prisma.permission.create({
        data: { key: def.key, label: def.label, description: def.description, group: def.group },
      });
      byKey.set(p.key, p);
    }
  }

  const desired: Array<{ role: Role; permissionId: string }> = [];
  for (const role of ROLES) {
    for (const def of PERMISSION_CATALOG) {
      if (form.get(`perm:${role}:${def.key}`) === "on") {
        const pid = byKey.get(def.key)!.id;
        desired.push({ role, permissionId: pid });
      }
    }
  }
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({}),
    prisma.rolePermission.createMany({ data: desired, skipDuplicates: true }),
  ]);
  invalidatePermissionCache();
  await audit({
    actorId: s.user.id,
    action: "rbac.update",
    after: { count: desired.length },
  });
  revalidatePath("/admin/roles");
}

async function resetToDefaults() {
  "use server";
  const s = await requireAdmin();
  // Wipe and reseed defaults.
  await prisma.rolePermission.deleteMany({});
  const all = await prisma.permission.findMany();
  const byKey = new Map(all.map((p) => [p.key, p]));
  const desired: Array<{ role: Role; permissionId: string }> = [];
  for (const def of PERMISSION_CATALOG) {
    const p = byKey.get(def.key);
    if (!p) continue;
    for (const r of def.defaults) {
      desired.push({ role: r, permissionId: p.id });
    }
  }
  await prisma.rolePermission.createMany({ data: desired, skipDuplicates: true });
  invalidatePermissionCache();
  await audit({ actorId: s.user.id, action: "rbac.reset_defaults" });
  revalidatePath("/admin/roles");
}

export default async function AdminRolesPage() {
  await requireAdmin();
  const [perms, mappings] = await Promise.all([
    prisma.permission.findMany({ orderBy: [{ group: "asc" }, { key: "asc" }] }),
    prisma.rolePermission.findMany(),
  ]);
  const granted = new Set(mappings.map((m) => `${m.role}:${m.permissionId}`));

  // If empty, show catalog rows even before first save.
  const rows =
    perms.length > 0
      ? perms.map((p) => ({ id: p.id, key: p.key, label: p.label, group: p.group }))
      : PERMISSION_CATALOG.map((p) => ({ id: "", key: p.key, label: p.label, group: p.group }));

  const groups = Array.from(new Set(rows.map((r) => r.group)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Roles &amp; permissions</h1>
          <p className="mt-1 text-sm text-[var(--muted-foreground)]">
            Fine-grained capabilities per role. Route guards still apply — these widen or restrict the actions within each section.
          </p>
        </div>
        <form action={resetToDefaults}>
          <Button variant="outline" type="submit">Reset to defaults</Button>
        </form>
      </div>

      <form action={saveMatrix} className="space-y-6">
        {groups.map((group) => (
          <Card key={group} className="overflow-hidden p-0">
            <div className="border-b border-[var(--border)] bg-[var(--muted)] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
              {group}
            </div>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-[var(--muted-foreground)]">
                <tr>
                  <th className="px-4 py-2">Capability</th>
                  {ROLES.map((r) => (
                    <th key={r} className="px-4 py-2 text-center w-24">{r}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows
                  .filter((r) => r.group === group)
                  .map((r) => (
                    <tr key={r.key} className="border-t">
                      <td className="px-4 py-2">
                        <div className="font-medium">{r.label}</div>
                        <div className="font-mono text-[11px] text-[var(--muted-foreground)]">{r.key}</div>
                      </td>
                      {ROLES.map((role) => {
                        const defaults =
                          PERMISSION_CATALOG.find((d) => d.key === r.key)?.defaults ?? [];
                        const checked = r.id
                          ? granted.has(`${role}:${r.id}`)
                          : defaults.includes(role);
                        return (
                          <td key={role} className="px-4 py-2 text-center">
                            <input
                              type="checkbox"
                              name={`perm:${role}:${r.key}`}
                              defaultChecked={checked}
                              className="h-4 w-4 accent-[var(--primary)]"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </tbody>
            </table>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button type="submit">Save permissions</Button>
        </div>
      </form>
    </div>
  );
}
