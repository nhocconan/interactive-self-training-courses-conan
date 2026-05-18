# Self-testing checklist

You **must** run the relevant section below **before** opening a PR.
Paste the section into the PR description and tick what you exercised.

The seeded test users (see `seed.ts`) cover every role:

| Email                          | Password       | Role  | Notes                           |
|--------------------------------|----------------|-------|---------------------------------|
| `REDACTED_EMAIL`                    | `REDACTED_PASSWORD`  | ADMIN | Platform owner                  |
| `hr@demo.com`           | `REDACTED_PASSWORD`  | HR    | Sees all reports, no mutations  |
| `demo.marketing@demo.com` | `REDACTED_PASSWORD` | USER  | AI course grant                 |
| `demo.engineering@demo.com` | `REDACTED_PASSWORD` | USER | Tooling category grant          |
| `demo.it@demo.com`       | `REDACTED_PASSWORD`  | USER  | No grants — for empty-state QA  |

---

## A · Smoke (always run, 2 min)

- [ ] `bash scripts/start-dev.sh` boots without errors.
- [ ] http://localhost:3940/login renders without console errors.
- [ ] Log in as `REDACTED_EMAIL` → land on `/dashboard`.
- [ ] All nav links navigate (Dashboard, Courses, HR, Users, Catalog, Settings).
- [ ] Light → Dark → System toggle works; no flash of unstyled content.
- [ ] Log out → cookie cleared → `/login`.

## B · Auth & access (run for any auth/role change)

- [ ] Local login works.
- [ ] Wrong password → friendly error, no 500.
- [ ] Disabled user cannot log in.
- [ ] `demo.it` (no grants) sees “No courses match.”
- [ ] `demo.marketing` sees only AI-engineering courses.
- [ ] `demo.marketing` directly hitting `/admin` is redirected.
- [ ] `hr@…` can open `/hr` but not `/admin/users`.
- [ ] LDAP test connection without config returns `Missing URL`.

## C · Courses & progress (run for course / viewer changes)

- [ ] All 3 legacy courses load in iframe (`/courses-html/<slug>` returns 200).
- [ ] Scrolling the iframe updates the progress bar.
- [ ] Closing & re-opening the course resumes from saved %.
- [ ] **Mark complete** persists; the badge turns green.
- [ ] Category filter pill narrows the catalog; search box works.

## D · Quiz engine (run for quiz changes)

- [ ] Admin creates a quiz with 1 of every supported type.
- [ ] Learner sees “Take quiz” after course completion (or as configured).
- [ ] Submitting correct answers passes; wrong fails; partial credit on
      multi-choice if configured.
- [ ] Max attempts enforced.
- [ ] Time limit auto-submits.
- [ ] Pass triggers a certificate.

## E · Certificates (run for cert changes)

- [ ] Certificate page renders with learner name + course title + date.
- [ ] Verification code resolves at `/verify/<code>` **without** login.
- [ ] Tampered code → friendly “Not found.”
- [ ] Cert with `expiresAt` shows expiry pill on profile.

## F · Learning paths

- [ ] Admin creates a 3-course path.
- [ ] Learner sees gated steps; can’t skip ahead.
- [ ] Completing all steps issues path certificate.

## G · AI provider config

- [ ] Admin adds an OpenAI provider with API key.
- [ ] “Fetch latest models” populates the model list.
- [ ] Mapping `ai.chat → gpt-4o-mini` saves.
- [ ] Ask-the-course chat in a learner view returns a response.
- [ ] `AiUsage` row recorded with token counts.
- [ ] Disabling provider stops new calls; existing logs preserved.

## H · Notifications + announcements + audit

- [ ] Admin posts an announcement → all users see it on next page load.
- [ ] Bell shows unread count; click marks read.
- [ ] Editing a user’s role writes an `AuditLog` row visible in
      `/admin/audit`.

## I · HR reports (run for HR changes)

- [ ] Per-employee row totals match underlying DB counts.
- [ ] Department filter narrows the list.
- [ ] CSV export downloads with the same data shown.

## J · Mobile / accessibility (run for UI changes)

- [ ] Chrome DevTools → device toolbar → iPhone 14: no horizontal scroll,
      nav usable, course iframe scrolls.
- [ ] Tab through the page: focus ring visible on every interactive element.
- [ ] Theme: dark mode legible on every page touched.

## K · Production build (always run before PR)

- [ ] `cd app && npm run build` succeeds.
- [ ] No TypeScript warnings.
- [ ] `bash scripts/stop-dev.sh` cleans up.

---

> If anything fails, **stop**, fix it, re-run from the top of the
> affected section. Don’t ship red.
