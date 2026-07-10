# Change Checklist

Run this before declaring **any** change "done". Items here are grounded in real
mistakes made in this repo — not a generic template. If a step doesn't apply,
say so explicitly; never skip silently.

> Where to find things: `CLAUDE.md` (behavioral rules), `DESIGN.md` (visual
> system), `docs/UI-UX-GUIDELINES.md`, `scripts/start-dev.sh` / `stop-dev.sh`.

---

## 1 · Before touching code

- [ ] **Know what's running.** Don't assume the dev server is off:
  ```bash
  lsof -iTCP:3940 -sTCP:LISTEN
  ps -ef | grep -E "next|node" | grep -v grep
  ```
  Identify each process by its `cwd` — multiple projects may have dev sessions
  open at once. Never kill a process whose path you can't trace to this repo.
- [ ] **State the assumption.** If interpretation is ambiguous, say it before
  coding (per `CLAUDE.md §1`).
- [ ] **Plan in plain words.** For multi-file changes, list the files and the
  purpose of each, then get a thumbs-up.
- [ ] **Match existing patterns.** Read 1–2 sibling files first (`DESIGN.md`,
  `globals.css`, `components/ui.tsx`). Don't introduce a 3rd font, a 4th button
  variant, or a private mini-design-system on the side.

## 2 · While coding

- [ ] **Surgical scope.** Every changed line traces to the user's ask
  (`CLAUDE.md §3`). No drive-by refactors, no comment cleanup of code you
  didn't touch.
- [ ] **No setState in `useEffect`** that doesn't sync to an external system
  (lint rule `react-hooks/set-state-in-effect`). The legit exceptions
  (e.g. next-themes mount guard) get an inline disable comment **with a reason**.
- [ ] **Query budget.** A server component should make ≤ 5 Prisma calls. If
  you need more, use `Promise.all` and combine `findMany` where possible.
- [ ] **Don't ship dead imports.** Strip unused symbols as you go; lint will
  catch them but it's noise.
- [ ] **Accessibility minimums.** Every button has a discernible name (text or
  `aria-label`), focus rings stay visible, keyboard nav works on dialogs
  (`Esc` closes, arrow keys navigate).

## 3 · DO-NOT-DO list (specific landmines)

- [ ] **NEVER `rm -rf .next` while the dev server is running.** Turbopack
  reads SST cache files lazily; deleting them mid-run panics the runtime and
  leaves the site spinning forever. Order is always: **stop → clean → start**.
  ```bash
  bash scripts/stop-dev.sh
  rm -rf app/.next
  bash scripts/start-dev.sh   # uses port 3940
  ```
- [ ] **NEVER kill a process whose cwd you haven't verified.** Multiple
  projects share this machine — `next-server (v16.2.6)` alone is ambiguous.
  Use `ps -ef` with the parent chain to confirm.
- [ ] **NEVER `git mv` files Git doesn't track yet.** It fails silently with
  "source directory is empty"; use plain `mv` (or stage first, then `git mv`).
- [ ] **NEVER skip the browser walk-through for UI work.** Type-check passing
  ≠ feature works. See §5 below.

## 4 · Pre-commit verification

Run **all** of these. Don't claim "done" if any fails:

- [ ] `npx tsc --noEmit` — TypeScript clean.
- [ ] `npx eslint <changed files> --max-warnings 0` — no lint regressions
  from your changes. Pre-existing lint errors in other files are out of scope
  unless the task explicitly says otherwise.
- [ ] `npm test` (if you touched lib code with vitest coverage).
- [ ] Dev server restarts cleanly: `tail -30 logs/dev.log` shows
  `✓ Ready in <Nms>` and **zero** lines matching `error|panic|fail`.

## 5 · Browser walk-through (UI changes only)

Per `CLAUDE.md`: *"For UI or frontend changes, start the dev server and use the
feature in a browser before reporting the task as complete."*

- [ ] Touched the live app at `http://localhost:3940` (not just `curl`).
- [ ] Tested at minimum:
  - [ ] The golden path of the changed feature.
  - [ ] One edge case (empty state, error state, slow network).
  - [ ] Each user role that sees the change (`USER`, `HR`, `ADMIN`). Test
    accounts come from the seed; credentials live in `app/.env`
    (`SEED_ADMIN_EMAIL` / `SEED_PASSWORD`, see `app/.env.example`).
  - [ ] Mobile width (Chrome DevTools at 375px).
  - [ ] Dark mode (theme toggle).
- [ ] **If I can't test the UI** (no browser available, etc.), say so
  explicitly in the report — don't claim success on type-check alone.

## 6 · Performance budget

Per server-render, target:

- [ ] ≤ 5 Prisma queries (parallelized when independent).
- [ ] No `findMany` without a `take:` limit on user-controlled lists.
- [ ] No `include:` chain deeper than 2 levels (lift to a separate query).
- [ ] No client-side filter over arrays > 500 items — push the filter to SQL.

For client components:
- [ ] No `useEffect` that doesn't have a deps array.
- [ ] No `setInterval`/polling without cleanup.
- [ ] No 3rd-party script larger than ~30 KB without a justification.

## 7 · Definition of done (per `docs/DEFINITION-OF-DONE.md`)

- [ ] Code passes §4 (typecheck + lint + tests).
- [ ] Browser walked per §5.
- [ ] Performance reviewed per §6.
- [ ] No new tech debt introduced; if any, noted in PR / report.
- [ ] Files affected by structural moves (route groups, renames) verified — no
  stale references in `components`, `lib`, `api`, or `tests`.

## 8 · If something's wrong, report honestly

- Don't claim a step was done when it wasn't.
- Mistakes get fixed faster when surfaced early. The cost of "I broke the cache"
  is a 30-second restart; the cost of hiding it is the user's whole afternoon.
- When in doubt, leave a TODO comment **with date + reason** and call it out
  in the change summary.

---

*Last updated: 2026-05-18. Add new landmines here as you find them; date them
and explain the trigger so future readers can avoid repeating the failure.*
