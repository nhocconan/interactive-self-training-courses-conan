# Roadmap & Phase Plan

This is the **execution** view of the PRD. Each phase ships an end-to-end
slice that real users can adopt; nothing here is shelfware.

> Legend: ✅ done in this build · 🚧 in this build · ⏳ planned · 🧊 backlog

---

## P0 — Foundations *(✅ shipped)*

| Task | Status |
|---|---|
| Next.js 16 + Tailwind v4 + Prisma + Postgres scaffold | ✅ |
| Auth.js v5 with local + LDAP/AD chain | ✅ |
| Course catalog with categories, search, filter | ✅ |
| Course viewer with auto-save progress + mark complete | ✅ |
| Admin: users, courses, categories, grants, LDAP config | ✅ |
| HR dashboard: per-employee completion stats | ✅ |
| Docker compose (db + web) — host ports 3940 (app), 3942 (db, loopback only) | ✅ |
| start-dev / stop-dev / start-prod / stop-prod scripts | ✅ |
| Seeded admin (credentials from `app/.env`) | ✅ |
| DESIGN.md (Stitch format) + architecture docs | ✅ |

## P1.5 — Production-grade core *(✅ shipped)*

The bar: a Demo team lead can run their entire onboarding flow on this
without external tools.

| # | Capability | Status |
|---|---|---|
| 1.5.1 | **Quizzes & assessments** | ✅ |
| 1.5.2 | **Certificates of completion** | ✅ |
| 1.5.3 | **Learning paths** | ✅ |
| 1.5.4 | **AI provider config** with live model fetch | ✅ |
| 1.5.5 | **AI learner features** (chat / summarize / explain) | ✅ |
| 1.5.6 | **AI admin tools** (generate quiz, suggest tags) | ✅ |
| 1.5.7 | **Notifications + announcements** | ✅ |
| 1.5.8 | **Audit log** with diff | ✅ |
| 1.5.9 | **Profile + my learning** | ✅ |
| 1.5.10 | **i18n scaffolding** (VN + EN) | ✅ |
| 1.5.11 | **UI polish** — ⌘K palette, toasts, focus states | ✅ |
| 1.5.12 | **Test users + Playwright e2e** | ✅ |

## P1.6 — Admin & content depth *(✅ this build)*

Adds the HR + Administration control panel pieces that turn a "good
internal LMS" into something a People-Ops team can adopt as system of record.

| # | Capability | What shipped |
|---|---|---|
| 1.6.1 | **Multi-format courses** | HTML / VIDEO_FILE / VIDEO_EMBED / PDF / PPTX / PPT / SLIDES_GOOGLE / MARKDOWN; per-kind viewer; auth-gated `/courses-asset/[file]` with HTTP Range |
| 1.6.2 | **Course uploads** | 500 MB drop-zone for video / PDF / PowerPoint; stored under `COURSE_ASSETS_DIR`; access-checked per request |
| 1.6.3 | **LDAP sub-tree picker** | `/admin/ldap/sync` searches selected OUs, provisions individual users (no first-login required), records DN; nightly attribute sync |
| 1.6.4 | **Site Security admin** | `/admin/security` — password policy, lockout thresholds, session lifetime, allowed email domains, admin IP CIDR allowlist, HSTS toggle. Live; takes effect on next sign-in |
| 1.6.5 | **RBAC matrix** | `/admin/roles` — 23 stable permission keys × 3 roles; reset-to-defaults; `hasPermission()` helper |
| 1.6.6 | **Org analytics dashboard** | `/admin/reports` — 90-day KPI band, completion sparkline, mandatory-training compliance, top courses, top learners, headcount by department |
| 1.6.7 | **Mandatory training flag** | Per-course `isMandatory`; surfaced on catalog and reports |
| 1.6.8 | **Site settings singleton** | Site name, logo URL, default locale, support email, self-signup toggle, branding toggle |
| 1.6.9 | **Documentation refresh** | New `SECURITY.md`, `RBAC.md`, `REPORTS.md`; updated `AUTHORING-COURSES.md`, `AUTH-LDAP.md`, `ADMIN-GUIDE.md`, `ARCHITECTURE.md`, `README.md`, `ROADMAP-PHASES.md` |

**Exit criteria:** all items above meet their **Definition of Done** (see
`DEFINITION-OF-DONE.md`). Existing courses and quizzes continue to work
unchanged — the schema additions are additive only.

---

## P2 — Engagement & scale *(⏳ next quarter, Q3 2026)*

| # | Capability | Notes |
|---|---|---|
| 2.1 | **Gamification** — XP, levels, badges, weekly leaderboard | Opt-out per user |
| 2.2 | **Discussion / Q&A per course** | Threaded comments, @-mentions, AI-suggested answer |
| 2.3 | **Skills taxonomy** | Skill ↔ course mapping, learner skill profile, gap analysis |
| 2.4 | **SAML SSO** | For corporate IDPs that aren’t plain LDAP |
| 2.5 | **Email notifications (SMTP / Slack adapter)** | Replaces P1.5 console logger |
| 2.6 | **Webhooks** | Outbound events: enrolment, completion, cert issued |
| 2.7 | **Adaptive recommendation** | “Next best course” model using progress + role + dept |
| 2.8 | **Mandatory training enforcement** | HR can flag courses as mandatory by department/role; nudges & SLA |
| 2.9 | **Bulk CSV import for users + grants** | Bridge to HRIS in lieu of API |
| 2.10 | **Rate-limit + abuse protection** | Per-IP + per-user, edge & app layers |
| 2.11 | **Performance hardening** | Cached RSC for catalog; CDN-front for course HTML |
| 2.12 | **Pino structured logs + OpenTelemetry** | Pipe to Grafana/Datadog |

## P3 — Enterprise stretch *(🧊 backlog, when justified)*

| # | Capability | When to pull forward |
|---|---|---|
| 3.1 | **SCORM 1.2 / 2004 + xAPI ingestion** | When a partner provides pre-baked SCORM content |
| 3.2 | **Native mobile app (React Native / Expo)** | When mobile MAU > 40% |
| 3.3 | **MCP server** — expose LMS data to Claude / Copilot / ChatGPT | When AI agents start automating learning ops |
| 3.4 | **Multi-tenant branches** — sub-orgs for Demo acquisitions | Post acquisition |
| 3.5 | **e-commerce / external customer training** | Strategy decision |
| 3.6 | **Skill-gap heatmap (org chart × skills)** | When HR analytics demand it |
| 3.7 | **WebAuthn / passkey login** | When IT mandates phishing-resistant auth |

---

## Sequencing in P1.5 (this build)

Order optimised for **always-shippable trunk**: each step keeps the app
green for existing users.

```
1. Schema additions (additive only — no breaks)
2. AI adapter library + admin AI config page (no learner-facing change yet)
3. Quiz engine + admin authoring + learner runner (gated to courses that have a quiz)
4. Certificates + verify page (issued on completion)
5. Learning paths
6. Notifications + audit log + announcements
7. AI learner features (course chat, summarize, explain)
8. AI admin features (generate quiz)
9. Profile / my learning page
10. UI polish + command palette
11. i18n hookup
12. Seeded test users + Playwright e2e
13. Run full e2e, fix anything red, sign off
```

## Rollout plan

- **Phase A (internal alpha):** the IT team + a 5-person pilot department,
  live for 2 weeks. Collect issues in `/admin/audit` and a Slack channel.
- **Phase B (company-wide soft launch):** announce in the all-hands;
  mandatory completion of the “Welcome to Demo Learning” onboarding path
  within 30 days.
- **Phase C (deprecate ad-hoc training):** Drive / Slack links route to the
  portal; HR uses portal as system-of-record.

## How we keep this document honest

- Owner re-reviews this file at the **end of every phase**.
- Items move ⏳ → 🚧 → ✅ in commits, never silently.
- Any new ask not on the list either gets queued in P2/P3 or replaces an
  item explicitly.
