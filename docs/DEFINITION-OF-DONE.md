# Definition of Done

A feature is **Done** when **all** of these are true. No checkbox is
optional. If a box stays unchecked, the work goes back to in-progress.

## 1 · Functional

- [ ] Feature meets every acceptance bullet in the PRD or task.
- [ ] Works for **every supported role** that can encounter it
      (USER / HR / ADMIN). Role gates explicit; no privilege leak.
- [ ] Works for **LOCAL** and **LDAP** users (where auth-relevant).
- [ ] Works on **mobile** (≤ 375 px), **tablet** (768 px) and **desktop**
      (1280+ px) — no horizontal scroll, no clipped controls.
- [ ] Works in **light** and **dark** theme.
- [ ] Existing flows still work — at minimum, the 3 legacy HTML courses
      remain reachable & playable.

## 2 · Quality bar

- [ ] Type-checks (`npx tsc --noEmit`) clean.
- [ ] Lint clean (no warnings).
- [ ] `npm run build` succeeds.
- [ ] Unit tests for any non-trivial logic. Coverage of the new code
      ≥ 70%.
- [ ] Integration test for any new API endpoint.
- [ ] Playwright e2e step covering the **golden path** of the feature.
- [ ] Removed every `console.log` / debugger / commented-out block.

## 3 · Security

- [ ] All inputs validated with Zod or equivalent at the boundary.
- [ ] All mutating actions call `requireAdmin` / `requireHR` / `auth()`
      explicitly. Proxy is not the only gate.
- [ ] No secrets in logs, in URLs, or in error messages returned to
      the client.
- [ ] AI calls go through the adapter; cap on prompt size respected.
- [ ] If touching a file path, traversal blocked.

## 4 · UX

- [ ] Loading state (skeleton or progress) for anything > 200 ms.
- [ ] Empty state has an action that moves the user forward.
- [ ] Error state has a recovery path.
- [ ] Keyboard reachable end-to-end; focus rings visible.
- [ ] All interactive icons have an `aria-label` or accompanying text.
- [ ] Copy matches the voice guide — direct, action-oriented.

## 5 · Observability

- [ ] Server-side errors emit a structured log line.
- [ ] Audit-relevant admin/HR actions write to `AuditLog`.
- [ ] AI calls write to `AiUsage`.

## 6 · Documentation

- [ ] PRD updated if scope changed.
- [ ] ROADMAP item moved to ✅.
- [ ] If the schema changed, `TECH-ARCHITECTURE.md` model list updated.
- [ ] If the API surface changed, route map updated.
- [ ] Changelog / commit message names the change in user terms
      (not implementation terms).

## 7 · Self-testing (the dev signs this)

Before opening a PR, the implementer manually runs the
[`SELF-TESTING.md`](./SELF-TESTING.md) checklist relevant to the area
they touched. The PR description includes a one-line summary of what
they exercised.

## 8 · Reviewer checklist

A reviewer asks themselves:

- Could this break in a way I’d miss? Add a test for that case.
- Is the code obvious to someone seeing it cold?
- Did the change introduce any concept not in `DESIGN.md` or
  `TECH-ARCHITECTURE.md`? If yes, those docs are updated in the same PR.
- Is there any **dead code** (unreachable branches, unused vars, leftover
  scaffolding)?

## 9 · Don’t-merge red flags

- Schema change without a migration plan.
- New external dependency added without justification in the PR
  description.
- A `// TODO` without an owner + date.
- A failing or skipped test introduced by this PR.
- A `--no-verify` commit on a shared branch.

> When in doubt, the answer is **No, send it back**.
