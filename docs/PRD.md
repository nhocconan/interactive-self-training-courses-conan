# Product Requirements Document — Demo Learning Portal

| Field        | Value                                                                |
|--------------|----------------------------------------------------------------------|
| Product      | **Demo Learning Portal** (internal LMS)                            |
| Owner        | Demo Group — People Ops + IT Platform                              |
| Audience     | ~500 employees across Vietnam offices, expanding to APAC             |
| First release| 2026-Q2                                                              |
| Status       | Living document — v1.0 covers P1 (this build); P2 / P3 are roadmapped|

---

## 1 · Problem & opportunity

Demo has accumulated rich interactive HTML training material (AI prompting,
RAG, harness engineering, more in the pipeline). Today the content is
distributed ad-hoc: Slack links, Google Drive, internal wikis. There is no
single place where an employee can:

- discover what training is available to them,
- pick a course and resume where they left off,
- prove they completed it,
- have HR & their manager see their growth.

We need a portal that delivers a **Bitrix24 / Google Workspace / Atlassian-level**
experience — modern, fast, reliable, beautiful — and that scales from today’s
3 courses to hundreds, from 500 employees to many thousands.

## 2 · Goals

| # | Goal                                                                 | Success metric (12 months)          |
|---|----------------------------------------------------------------------|-------------------------------------|
| 1 | Every Demo employee can self-enroll in role-appropriate training   | ≥ 80% MAU                          |
| 2 | HR & managers can see who learned what, in real time                 | < 5 s for any HR report             |
| 3 | Onboarding for new hires happens entirely in the portal              | 100% of new hires complete onboarding path within 30 days |
| 4 | Courses are easy to author and publish without dev help              | < 1 day from authored HTML → live  |
| 5 | AD/LDAP single sign-on for all corporate employees                   | 0 net-new local passwords for AD users |
| 6 | AI assistance accelerates both learners and content creators         | Course completion +20% with AI help|

## 3 · Non-goals (this scope)

- **Selling courses to external customers.** Internal use only.
- **Synchronous classroom / video conferencing.** Use Google Meet / Zoom.
- **Authoring rich SCORM packages.** Our content is interactive HTML; SCORM
  ingestion is a P3 stretch.
- **HR performance reviews.** Bitrix24/HRIS remain authoritative.

## 4 · Personas

### 4.1 Demo Marketing — Marketing executive (Learner)
- Wants curated, byte-sized training relevant to her role.
- Logs in via AD; expects mobile-friendly UI on her commute.
- Cares about: progress saved, badges, clear next-step.

### 4.2 Demo Engineering — Engineering lead (Power learner + course author)
- Builds and updates technical courses.
- Needs to push a course to a category & grant it to his team in minutes.
- Cares about: quizzes that validate understanding; analytics on his cohort.

### 4.3 Demo HR — HR Business Partner
- Tracks compliance training, onboarding, skills development.
- Needs department-level dashboards, exportable to CSV.
- Cares about: certifications with verifiable codes; mandatory training
  enforcement; renewal reminders.

### 4.4 Demo IT — IT Admin (Platform owner)
- Runs the portal end-to-end: AD config, users, AI keys, backups.
- Cares about: security posture, audit trails, uptime, scaling.

## 5 · Competitive landscape (research-driven)

Decisions below are informed by what top enterprise LMSs ship today
(TalentLMS, Docebo, 360Learning, Cornerstone, Litmos):

| Capability                      | TalentLMS | Docebo | Demo Portal (this build) | P2 / P3 |
|---------------------------------|-----------|--------|----------------------------|---------|
| Course catalog + categories     | ✓         | ✓      | ✓                          |         |
| Interactive HTML content        | ✓         | ✓      | ✓ (native)                 |         |
| Video (file upload + URL embed) | ✓         | ✓      | ✓ (mp4/YouTube/Vimeo/Loom) |         |
| PDF / PPTX / Google Slides      | ✓         | ✓      | ✓ (Office Online + Slides) |         |
| SCORM / xAPI                    | ✓         | ✓      | —                          | P3      |
| Quizzes & assessments           | ✓         | ✓      | ✓                          |         |
| Certificates (verifiable)       | ✓         | ✓      | ✓                          |         |
| Learning paths / curricula      | ✓         | ✓      | ✓                          |         |
| AD / LDAP / SSO + sub-tree picker | ✓       | ✓      | ✓                          | P2: SAML|
| AI content creation             | ✓ (TalentCraft) | ✓ (AgentHub) | ✓ (configurable providers) |  |
| Fine-grained RBAC               | partial   | ✓      | ✓ (admin-editable matrix)  |         |
| Site security policy UI         | ✓         | ✓      | ✓ (`/admin/security`)      |         |
| Adaptive learning paths (AI)    | partial   | ✓      | —                          | P2      |
| Skills mapping & gaps           | partial   | ✓      | basic tags                 | P2      |
| Gamification                    | ✓         | ✓      | basic (badges)             | P2: leaderboards |
| Discussion / social learning    | ✓         | ✓      | —                          | P2      |
| Compliance retraining & renewal | ✓         | ✓      | ✓ (cert expiry + mandatory) |        |
| Reporting & analytics           | ✓         | ✓      | ✓ (HR + org dashboards)    | P2: BI export |
| White-label / brand             | ✓         | ✓      | ✓ (Demo)                 |         |
| Mobile app                      | ✓         | ✓      | responsive web             | P3      |
| Marketplace / e-commerce        | ✓         | partial| —                          | out of scope |

Demo doesn’t need to match every Docebo feature to ship value: the bar is
“better than ad-hoc Slack links” on day one, and a clear runway to enterprise
maturity within 12 months.

## 6 · Functional requirements (P1)

### 6.1 Authentication & accounts
- Login by email or AD username + password.
- LDAP/AD bind, configured entirely in Admin UI (Windows Server 2019+).
- **Two LDAP provisioning paths**:
  - JIT-provision on first login (existing).
  - **Admin sub-tree picker** (`/admin/ldap/sync`) — search a configured OU,
    add selected users without requiring them to log in first.
- Optional **nightly attribute sync** keeps name/dept/title fresh.
- Role: USER, HR, ADMIN, with a **fine-grained permission matrix** layered
  on top (`/admin/roles`, see `RBAC.md`).
- Account lifecycle: enable / disable, force password reset.
- Allowed-email-domain allowlist enforced at sign-up + LDAP login.

### 6.2 Courses & content
- Course = metadata + content of any of seven **kinds**:
  - **HTML** — single self-contained file under `./courses/` (legacy unchanged).
  - **VIDEO_FILE** — uploaded mp4 / webm / mov, streamed via auth-gated route
    with HTTP Range support.
  - **VIDEO_EMBED** — YouTube / Vimeo / Loom URL, normalised to embed form.
  - **PDF** — uploaded document, rendered in the browser's PDF viewer.
  - **PPTX / PPT** — uploaded slide deck, rendered via Office Online viewer.
  - **SLIDES_GOOGLE** — Google Slides / Docs share URL.
  - **MARKDOWN** — inline content for short primers.
- Drag-and-drop upload (≤ 500 MB) for upload kinds; files stored under
  `COURSE_ASSETS_DIR`.
- Categories with colour, sort order, description.
- Tags, level (beginner/intermediate/advanced), duration.
- Publish toggle (hide without deletion).
- `isMandatory` flag surfaced in the analytics dashboard.
- Browse, search, filter; recently added; recommended for you.

### 6.3 Progress
- Auto-save scroll-based progress every 2 s, debounced 1.2 s before persist.
- `postMessage({type:"lms:progress", percent})` for richer signals from
  course HTML.
- “Mark complete” explicit action.
- `completedAt` is immutable once set; subsequent activity updates
  `lastSeenAt` only.

### 6.4 Quizzes & assessments
- Question bank per course (or shared).
- Question types: **single-choice**, **multiple-choice**, **true/false**,
  **fill-in-blank**, **short-answer**.
- Per-quiz config: pass score %, max attempts, shuffle questions, time limit.
- Each attempt records answers + score + duration.
- Pass triggers certificate (if course has one configured).

### 6.5 Certificates
- Auto-issued on pass (or course completion if no quiz).
- Verifiable public code (`/verify/<code>`) — anyone with the URL can
  confirm authenticity without authentication.
- Printable HTML certificate styled to Demo brand.
- Optional `expiresAt` for compliance training; HR sees expiry warnings.

### 6.6 Learning paths
- Ordered sequence of courses; optional prerequisites.
- Path completion = every step completed.
- Path certificate (meta-credential).

### 6.7 Access control
- USER sees only courses they’re granted (direct or via CategoryGrant).
- HR sees everything (read-only on user data, full reports).
- ADMIN sees everything + mutates.

### 6.8 AI integration
- Admin can register one or more AI providers:
  - **OpenAI** (`/v1/models`, `/v1/chat/completions`)
  - **Anthropic** (`/v1/models`, `/v1/messages`)
  - **Google Gemini** (`/v1beta/models`, `/v1beta/models/*:generateContent`)
  - **Custom OpenAI-compatible** (Azure OpenAI, Together, Mistral, etc.)
- “Fetch latest models” pulls live list from provider; admin picks the
  active model per use case.
- Learner-facing features:
  - **Ask the course** chat (RAG over current course HTML).
  - **Explain this concept** (selected text → plain-English explanation).
  - **Summarize for me** (returns 5-bullet summary).
- Admin-facing features:
  - **Generate quiz** from course content (10 Qs default).
  - **Suggest categories / tags** for new courses.
- All AI calls produce an `AiUsage` record (provider, model, tokens, cost
  estimate, latency).
- Per-user daily token budget (configurable, defaults sane).

### 6.9 Notifications
- In-app bell with unread count; list with mark-as-read.
- Triggers (P1): course assigned, certificate earned, announcement, quiz
  graded, cert about to expire.
- Email delivery is **opt-in** & **adapter-pluggable** (P1 ships console
  logger; SMTP adapter in P2).

### 6.10 Audit log
- Every admin or HR mutation is recorded: actor, action, target,
  before/after diff (JSON), timestamp, IP, user-agent.
- Filterable view in Admin.

### 6.11 HR reports
- Active employees, by department.
- Course / category completion rates.
- Mandatory training compliance (% completed + expiring).
- Per-employee learning history (timeline of completions).
- CSV export.

### 6.11a Org analytics dashboard
- KPI band: active users, published courses, certificates, quiz pass rate.
- 90-day completion sparkline + total.
- Mandatory training compliance per course.
- Top courses by completion, top learners, department headcount.
- Drawn from how Cornerstone, Docebo, LinkedIn Learning, and Moodle
  Workplace organise their "pulse" view. See `REPORTS.md`.

### 6.11b Site security
- Admin-configurable: password policy (length + classes + age),
  brute-force lockout (max failures + cooldown), session idle timeout,
  admin re-auth window, allowed email domains, admin IP CIDR allowlist,
  HSTS toggle.
- Settings cached 60 s; live changes take effect on next sign-in.
- See `SECURITY.md`.

### 6.11c RBAC matrix
- Admin can grant any of 23 stable permission keys to any of the three
  roles. Defaults match the seed; **Reset to defaults** restores them.
- `hasPermission(role, key)` helper for in-page gates.
- See `RBAC.md`.

### 6.12 Internationalization (P1 minimum)
- All UI strings ready for translation (VN + EN).
- Default locale follows browser; user can override in profile.
- Course content is whatever locale the author wrote it in.

## 7 · Non-functional requirements

| Area              | Requirement                                                                                     |
|-------------------|-------------------------------------------------------------------------------------------------|
| Performance       | TTFB p95 ≤ 250 ms, route navigation p95 ≤ 600 ms on cable broadband                            |
| Scalability       | Stateless app, run 4+ replicas behind LB; DB primary + read replica supports 10k MAU           |
| Availability      | 99.5% (internal SLA)                                                                            |
| Security          | OWASP top 10 mitigated; secrets encrypted at rest; CSP on iframes; audit log immutable in DB    |
| Privacy           | GDPR-aligned; user data export & deletion endpoints (P2)                                       |
| Accessibility     | WCAG 2.2 AA on all chrome; course HTML compliance is the author’s responsibility               |
| i18n              | Strings externalised; right-to-left ready (no hard-coded `left/right` flexbox)                 |
| Browser support   | Chrome / Edge / Firefox / Safari, last 2 versions; mobile Safari / Chrome                       |
| Telemetry         | Server-side request log + structured app log; opt-out analytics for learners                   |

## 8 · UX principles

1. **Content-first.** Course content fills the viewport; chrome shrinks.
2. **Earned motion.** Animate state changes, never decoration.
3. **One bold accent.** Demo coral-red is reserved for the single most
   important CTA on each screen.
4. **System theme by default.** Light & dark are equal citizens.
5. **Keyboard-first power user.** Command palette (`⌘K`) reachable on every
   page; tab order makes sense everywhere.
6. **Trust signals.** Always show a status pill (saved / saving / offline) on
   anything that auto-persists.

See `DESIGN.md` and [`UI-UX-GUIDELINES.md`](./UI-UX-GUIDELINES.md).

## 9 · Risks & mitigations

| Risk                                                            | Mitigation                                                                                |
|-----------------------------------------------------------------|-------------------------------------------------------------------------------------------|
| HTML course breaks portal chrome (sets `document.title`, etc.)  | Sandboxed iframe; CSP forbids navigation; portal owns chrome outside the frame            |
| LDAP misconfiguration locks everyone out                        | Local admin account always works; “test connection” gated behind admin role               |
| AI cost runaway                                                 | Per-user token budget; cost estimate logged; admin can pause provider in 1 click          |
| Compliance audit needs proof of training                        | Audit log + verifiable certificate URLs cover this from day one                           |
| Stale roadmap (we miss what enterprise LMSs actually do)        | Re-survey competitors every 6 months; document gaps in this PRD                           |

## 10 · Release plan

See [`ROADMAP-PHASES.md`](./ROADMAP-PHASES.md).
