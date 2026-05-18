import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

/**
 * Catalog of permission keys grouped by area. The seed script writes each
 * key to the Permission table; admins map them to roles in /admin/roles.
 *
 * Permissions are *additive* — granting `audit.view` to HR widens what HR
 * can do, but the existing role-based route guards (requireAdmin / requireHR)
 * still apply at the page level. Use `hasPermission()` in business logic
 * for fine-grained gates.
 */
export const PERMISSION_CATALOG: Array<{
  key: string;
  label: string;
  group: string;
  description?: string;
  defaults: Role[];
}> = [
  // Users
  { key: "users.view", label: "View users", group: "Users", defaults: ["ADMIN", "HR"] },
  { key: "users.create", label: "Create users", group: "Users", defaults: ["ADMIN"] },
  { key: "users.update", label: "Update user role / status", group: "Users", defaults: ["ADMIN"] },
  { key: "users.reset_password", label: "Reset user password", group: "Users", defaults: ["ADMIN"] },
  { key: "users.delete", label: "Delete users", group: "Users", defaults: ["ADMIN"] },
  // Courses
  { key: "courses.view", label: "View course catalog", group: "Courses", defaults: ["ADMIN", "HR", "USER"] },
  { key: "courses.create", label: "Create courses", group: "Courses", defaults: ["ADMIN"] },
  { key: "courses.publish", label: "Publish / unpublish courses", group: "Courses", defaults: ["ADMIN"] },
  { key: "courses.delete", label: "Delete courses", group: "Courses", defaults: ["ADMIN"] },
  // Categories
  { key: "categories.manage", label: "Manage categories", group: "Categories", defaults: ["ADMIN"] },
  // Paths
  { key: "paths.manage", label: "Manage learning paths", group: "Paths", defaults: ["ADMIN"] },
  // Quizzes
  { key: "quizzes.manage", label: "Author quizzes", group: "Quizzes", defaults: ["ADMIN"] },
  // Grants / enrolments
  { key: "grants.manage", label: "Grant / revoke course access", group: "Access", defaults: ["ADMIN"] },
  // Reports
  { key: "reports.hr", label: "View HR reports", group: "Reports", defaults: ["ADMIN", "HR"] },
  { key: "reports.org", label: "View org analytics dashboard", group: "Reports", defaults: ["ADMIN", "HR"] },
  { key: "reports.export", label: "Export reports as CSV", group: "Reports", defaults: ["ADMIN", "HR"] },
  // Security / audit
  { key: "audit.view", label: "View audit log", group: "Security", defaults: ["ADMIN"] },
  { key: "security.manage", label: "Edit site security", group: "Security", defaults: ["ADMIN"] },
  // LDAP
  { key: "ldap.configure", label: "Configure LDAP / AD", group: "Security", defaults: ["ADMIN"] },
  { key: "ldap.sync", label: "Run LDAP user sync", group: "Security", defaults: ["ADMIN"] },
  // AI providers
  { key: "ai.configure", label: "Configure AI providers", group: "AI", defaults: ["ADMIN"] },
  { key: "ai.use", label: "Use AI features in courses", group: "AI", defaults: ["ADMIN", "HR", "USER"] },
  // Announcements
  { key: "announcements.create", label: "Post announcements", group: "Comms", defaults: ["ADMIN"] },
];

const cache = new Map<Role, Set<string>>();
let cacheAt = 0;
const TTL_MS = 60_000;

/** True if the role has the given permission key. */
export async function hasPermission(role: Role, key: string): Promise<boolean> {
  if (Date.now() - cacheAt > TTL_MS) cache.clear();
  if (!cache.has(role)) {
    const rows = await prisma.rolePermission.findMany({
      where: { role },
      include: { permission: { select: { key: true } } },
    });
    cache.set(role, new Set(rows.map((r) => r.permission.key)));
    cacheAt = Date.now();
  }
  return cache.get(role)!.has(key);
}

export function invalidatePermissionCache() {
  cache.clear();
}
