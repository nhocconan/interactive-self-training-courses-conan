# Demo Learning Portal

Internal interactive-training portal for **Demo Group** (~500 employees).
Users self-train through interactive HTML courses, mark progress, and HR can
track who has learned what. Admins manage the catalog, grant access, and wire
up LDAP / Active Directory single sign-on.

> Built with **Next.js 16** (App Router), **React 19**, **TypeScript**,
> **Tailwind v4**, **Prisma 6 + PostgreSQL 16**, **Auth.js v5**, **ldapts**.

## Quick start

```bash
# Bring up Postgres + run migrations + seed + start Next dev
bash scripts/start-dev.sh

# Or full containerised stack (db + web)
bash scripts/start-prod.sh

# Stop everything
bash scripts/stop-dev.sh    # or stop-prod.sh
```

| Where         | URL / host                    |
| ------------- | ----------------------------- |
| Portal        | http://localhost:**3940**     |
| Postgres      | `127.0.0.1:`**`3942`** (`lms`/`lms`/`lms`) — loopback only |

> 🔒 All host-port bindings are **127.0.0.1-only** so nothing on your LAN can reach the DB or the portal. There is **no DB web UI** exposed. For prod, put the portal behind nginx / Cloudflare.

## Seeded admin credentials

> ⚠️ **Change this password the first time you log in.** Stored only because
> you asked for it in writing.

```
Email    : REDACTED_EMAIL
Password : REDACTED_PASSWORD
Role     : ADMIN
```

A LOCAL user is created by the seed; you can also enable LDAP/AD via
**Admin → Settings**.

## Project layout

```
.
├── app/                  Next.js 16 application (full stack)
│   ├── src/app/          Route handlers + pages (App Router)
│   ├── src/lib/          prisma client, ldap helper, access control
│   ├── src/components/   Design-system primitives
│   └── prisma/           Schema + seed
├── courses/              Interactive HTML courses (served via signed-in iframe)
│   ├── demo-ai-prompting-course.html
│   ├── rag-information-retrieval-course.html
│   ├── ai-context-engineering-harness-engineering-course-v2.html
│   └── rag-course-diagrams/
├── docs/                 ARCHITECTURE.md, AUTH-LDAP.md, ADMIN-GUIDE.md, …
├── scripts/              start-dev.sh / stop-dev.sh / start-prod.sh / stop-prod.sh
├── docker-compose.yml    Postgres + Web
└── DESIGN.md             Design system (Google Stitch format)
```

## Features

- 🔐 Auth: local credentials **plus** optional LDAP/AD bind (config in UI)
- 👥 **AD user picker**: admins search a configured sub-tree and provision
  users without waiting for first login; nightly attribute sync
- 🗂️ Course catalog, categories with colour tags, search & filter
- 📚 **Flexible content**: HTML, video (file or YouTube/Vimeo/Loom URL),
  PDF, PPT/PPTX (Office Online viewer), Google Slides/Docs, or Markdown —
  pick the kind in `/admin/courses`
- 📈 Per-course progress bar; auto-saves scroll position for HTML, time
  for video, manual **Mark complete** for the rest
- 🧪 Quizzes (SC / MC / TF / fill-blank / short-answer), certificates,
  learning paths
- 🧠 AI features (chat, summarize, explain, generate quiz) — OpenAI /
  Anthropic / Gemini, with **live model list** refresh
- 🛡️ **Site security** admin page: password policy, lockout, allowed
  email domains, admin IP allowlist
- 🔑 **RBAC matrix**: stable permission keys mapped to roles; HR can be
  widened or admins narrowed without touching code
- 📊 **Reports & analytics**: KPIs, 90-day completion trend, mandatory
  compliance, top courses, top learners, department headcount
- 🧑‍💼 **HR reports**: per-employee completion table with CSV export
- 📝 Audit log of every admin/HR mutation (with diff)
- 🌗 Light / Dark / System theme switch, responsive on mobile / tablet / desktop
- 🐳 Single-command Docker compose

## Read next

- [`DESIGN.md`](./DESIGN.md) — design system in Google Stitch format
- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md)
- [`docs/AUTH-LDAP.md`](./docs/AUTH-LDAP.md) — Windows 2019 AD + sub-tree picker
- [`docs/SECURITY.md`](./docs/SECURITY.md) — site security & threat model
- [`docs/RBAC.md`](./docs/RBAC.md) — role / permission matrix
- [`docs/ADMIN-GUIDE.md`](./docs/ADMIN-GUIDE.md)
- [`docs/REPORTS.md`](./docs/REPORTS.md) — analytics dashboard
- [`docs/HR-GUIDE.md`](./docs/HR-GUIDE.md)
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md)
- [`docs/AUTHORING-COURSES.md`](./docs/AUTHORING-COURSES.md) — all content kinds
- [`docs/ROADMAP-PHASES.md`](./docs/ROADMAP-PHASES.md)
