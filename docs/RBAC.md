# Roles & permissions (RBAC)

The portal layers two checks:

1. **Coarse role gates** — every protected route uses `requireAdmin()` or
   `requireHR()`. These haven't changed; they are the front door.
2. **Fine-grained permissions** — each meaningful action has a stable key
   (e.g. `users.create`, `reports.export`). Roles are mapped to keys in
   the `RolePermission` table, edited live in `/admin/roles`.

Use `hasPermission(role, key)` from `@/lib/rbac` in business logic to gate
within a page (e.g. an Admin-only button that HR can see if granted).

## Permission catalog

The catalog lives in `src/lib/rbac.ts` and is seeded into the
`Permission` table by `prisma/seed.ts`. Keep them in sync when you add a
new capability.

| Group        | Key                      | Default roles    |
|--------------|--------------------------|------------------|
| Users        | `users.view`             | ADMIN, HR        |
|              | `users.create`           | ADMIN            |
|              | `users.update`           | ADMIN            |
|              | `users.reset_password`   | ADMIN            |
|              | `users.delete`           | ADMIN            |
| Courses      | `courses.view`           | ADMIN, HR, USER  |
|              | `courses.create`         | ADMIN            |
|              | `courses.publish`        | ADMIN            |
|              | `courses.delete`         | ADMIN            |
| Categories   | `categories.manage`      | ADMIN            |
| Paths        | `paths.manage`           | ADMIN            |
| Quizzes      | `quizzes.manage`         | ADMIN            |
| Access       | `grants.manage`          | ADMIN            |
| Reports      | `reports.hr`             | ADMIN, HR        |
|              | `reports.org`            | ADMIN, HR        |
|              | `reports.export`         | ADMIN, HR        |
| Security     | `audit.view`             | ADMIN            |
|              | `security.manage`        | ADMIN            |
|              | `ldap.configure`         | ADMIN            |
|              | `ldap.sync`              | ADMIN            |
| AI           | `ai.configure`           | ADMIN            |
|              | `ai.use`                 | ADMIN, HR, USER  |
| Comms        | `announcements.create`   | ADMIN            |

## Editing the matrix

1. Sign in as Admin → **Roles & permissions** (`/admin/roles`).
2. The page renders a grouped matrix: rows are capabilities, columns are
   the three roles. Tick / untick boxes and click **Save permissions**.
3. The action wipes and re-creates `RolePermission` rows in a transaction,
   then invalidates the in-process cache so the change takes effect within
   one cache window.
4. **Reset to defaults** restores the seeded mapping above.

## Adding a new permission

1. Append it to `PERMISSION_CATALOG` in `src/lib/rbac.ts` with a sensible
   `defaults: Role[]` array.
2. Add it to the same list in `prisma/seed.ts` (idempotent upsert).
3. Run `npm run db:seed` or call **Reset to defaults**.
4. Call `await hasPermission(role, "your.new.key")` at the gate.

## Why both role gates and permissions?

Role gates are fast and stable — they live in route handlers. Permissions
are *adjustments*: they let an admin grant HR access to one new capability
without rewriting the route gate, and let you remove a capability cleanly
when a team change happens.
