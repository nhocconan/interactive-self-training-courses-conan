"use server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { ldapSearchUsers, ldapFetchByDn, type LdapPickerUser } from "@/lib/ldap";

/** Search LDAP for users matching `q`. Returns at most 50. */
export async function searchLdapUsers(q: string): Promise<LdapPickerUser[]> {
  await requireAdmin();
  const cfg = await prisma.ldapConfig.findUnique({ where: { id: 1 } });
  if (!cfg) return [];
  return ldapSearchUsers(cfg, q, 50);
}

/** Provision a single LDAP user without requiring them to log in first. */
export async function addLdapUser(formData: FormData) {
  const s = await requireAdmin();
  const dn = String(formData.get("dn") || "").trim();
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const name = String(formData.get("name") || "").trim();
  const department = String(formData.get("department") || "").trim() || null;
  const jobTitle = String(formData.get("jobTitle") || "").trim() || null;
  const role = String(formData.get("role") || "USER") as "USER" | "HR" | "ADMIN";
  if (!email || !username || !name || !dn) throw new Error("Missing fields.");

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      username,
      department,
      jobTitle,
      source: "LDAP",
      ldapDn: dn,
      ldapSyncedAt: new Date(),
      isActive: true,
    },
    create: {
      email,
      username,
      name,
      department,
      jobTitle,
      source: "LDAP",
      role,
      ldapDn: dn,
      ldapSyncedAt: new Date(),
    },
  });
  await audit({
    actorId: s.user.id,
    action: "user.ldap.add",
    target: user.id,
    after: { dn, email, name, role },
  });
  revalidatePath("/admin/users");
  revalidatePath("/admin/ldap/sync");
}

/** Re-fetch directory attributes for every LDAP-sourced user. */
export async function runLdapSync(): Promise<{ refreshed: number; failed: number }> {
  const s = await requireAdmin();
  const cfg = await prisma.ldapConfig.findUnique({ where: { id: 1 } });
  if (!cfg?.enabled) throw new Error("LDAP is not enabled.");
  const users = await prisma.user.findMany({
    where: { source: "LDAP", isActive: true, ldapDn: { not: null } },
    select: { id: true, ldapDn: true },
  });
  let refreshed = 0;
  let failed = 0;
  for (const u of users) {
    if (!u.ldapDn) continue;
    const d = await ldapFetchByDn(cfg, u.ldapDn);
    if (!d) {
      failed++;
      continue;
    }
    await prisma.user.update({
      where: { id: u.id },
      data: {
        name: d.name,
        department: d.department ?? null,
        jobTitle: d.jobTitle ?? null,
        ldapSyncedAt: new Date(),
      },
    });
    refreshed++;
  }
  await audit({
    actorId: s.user.id,
    action: "ldap.sync.run",
    after: { refreshed, failed, total: users.length },
  });
  revalidatePath("/admin/ldap/sync");
  return { refreshed, failed };
}
