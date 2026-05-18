# Admin guide

Everything an Admin can do from the UI.

## 1 · Sign in

- URL: `http://<host>:3940/login`
- Seeded admin: **REDACTED_EMAIL / REDACTED_PASSWORD** (change immediately).

## 2 · Console overview (`/admin`)

A landing page with quick stats and the full tile grid:

- **Users** — create local accounts; toggle roles.
- **AD user picker** — search a configured sub-tree and add LDAP users in bulk.
- **Courses** — multi-format catalog (HTML, video, PDF, slides, markdown).
- **Categories** — group courses.
- **Quizzes** — author assessments, AI-generate questions.
- **Learning paths** — sequence courses, issue a path certificate.
- **AI providers** — connect OpenAI / Anthropic / Gemini.
- **Announcements** — broadcast to roles or everyone.
- **Reports & analytics** — org-wide stats, mandatory compliance.
- **HR reports** — per-employee completion table.
- **Audit log** — every mutation with diff.
- **Roles & permissions** — RBAC matrix.
- **Site security** — password policy, lockout, allowed domains.
- **LDAP / AD config** — server, bind, sub-tree(s), nightly sync.

## 3 · Managing users (`/admin/users`)

- 🔎 Search by name / email / username / department.
- ➕ **Create local user** — for accounts that don't live in AD (e.g. interns,
  contractors). Set email, full name, password, optional department, role.
  Email must satisfy **Site Security → Allowed email domains** if set.
- 🛡️ Inline **Role** select (USER / HR / ADMIN).
- 🔁 In a user's detail page (`/admin/users/<id>`):
  - **Category grants** — toggle access to entire categories.
  - **Per-course grants** — fine-grain a single course.
  - **Account controls** — reset password, enable, disable.

> Access rule: a user sees a course if (a) they have a direct grant OR
> (b) they have a category grant covering its category.

## 4 · Adding AD users without waiting for first login

Open **Admin → AD user picker** (`/admin/ldap/sync`). See
[`AUTH-LDAP.md`](./AUTH-LDAP.md) §2 for details.

## 5 · Categories (`/admin/categories`)

- Slug-based, optional colour. Sort order controls position in the
  catalog filter pills.
- Deleting a category does **not** delete its courses; they fall back to
  "General".

## 6 · Courses (`/admin/courses`)

Pick a **Content type** — HTML, Video (file or URL), PDF, PPTX/PPT,
Google Slides, or Markdown. The form reveals the right inputs for each.

- **HTML file path** is the file name *under `./courses/`* — e.g.
  `demo-ai-prompting-course.html`. The path is resolved server-side and
  cannot escape the courses directory.
- **Upload** kinds save the file to `COURSE_ASSETS_DIR` and write the
  generated URL into `contentUrl`. Files are gated by the same access
  rules as the rest of the course.
- **URL** kinds normalise common YouTube/Vimeo/Loom/Google URLs into their
  embed forms automatically.
- Toggle **Published** to hide from the catalog without deleting progress.
- Toggle **Mandatory** to surface the course in the compliance dashboard.

See [`AUTHORING-COURSES.md`](./AUTHORING-COURSES.md) for the full guide.

## 7 · LDAP (`/admin/ldap`)

See [`AUTH-LDAP.md`](./AUTH-LDAP.md).

## 8 · Site security (`/admin/security`)

See [`SECURITY.md`](./SECURITY.md). Configures:
- password policy (length, classes, age),
- brute-force lockout (max failures, cooldown),
- session and admin re-auth windows,
- allowed email domains,
- admin IP allowlist (CIDR).

Changes take effect on the next sign-in.

## 9 · Roles & permissions (`/admin/roles`)

See [`RBAC.md`](./RBAC.md). Toggle the matrix to widen / restrict any role.
**Reset to defaults** brings everything back to the seed state.

## 10 · Reports & analytics (`/admin/reports`)

See [`REPORTS.md`](./REPORTS.md). 90-day window with KPIs, trends, top
courses, top learners, department headcount, and mandatory compliance.

## 11 · Routine ops

| Task                          | Where                                                |
|-------------------------------|------------------------------------------------------|
| Lock out a leaving employee   | `/admin/users/<id>` → **Disable**                    |
| Reset a forgotten password    | `/admin/users/<id>` → set new password               |
| Promote someone to HR         | `/admin/users` → change role                         |
| Hide a deprecated course      | `/admin/courses` → uncheck Published, save           |
| Upload a new training video   | `/admin/courses` → Content type = VIDEO_FILE         |
| Add an org-wide announcement  | `/admin/announcements`                               |
| Tighten password policy       | `/admin/security`                                    |
| Add an AD user                | `/admin/ldap/sync`                                   |
| Inspect DB                    | `psql -h 127.0.0.1 -p 3942 -U lms lms`               |
