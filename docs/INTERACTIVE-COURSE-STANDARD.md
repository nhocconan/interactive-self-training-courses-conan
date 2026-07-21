# Interactive Course Standard (Conan Learning Portal)

Every interactive HTML course under [`courses/`](../courses/) follows one shared
design system. **The canonical, versioned spec lives in the
`interactive-course-builder` skill**, not here — this file is the in-repo pointer
+ registry so the repo is self-describing.

## Where the standard lives

```
~/.claude/skills/interactive-course-builder/
├── SKILL.md        loader — when/how to use, non-negotiables
├── reference.md    full spec — tokens, components, pedagogy, a11y, LMS contract, ship checklist
└── template.html   the executable standard — copy this to start a new course
```

Invoke with `/interactive-course-builder`, or it auto-triggers on course work.

**Philosophy:** *unify the system, theme the surface.* One structure, one
component kit, one engine, one accessibility bar — a per-course `data-theme`
accent is the only thing that changes, so each course **stands alone** yet
belongs to the family.

## What "to the standard" means (quick gate)

- Started from `template.html`; **no external JS libs**; one self-contained file.
- Color only via semantic tokens; dark mode automatic via `prefers-color-scheme`.
- Nav/progress/pagination derive from the single `LESSONS` array.
- Parts = level bands **L1→L5**; every lesson has a level badge, objectives, a
  **Takeaway**, and a **Quiz**; ≥1 inline-SVG figure/comparison/table per lesson.
- WCAG 2.2 AA (skip-link, focus rings, keyboard, 44px targets, reduced-motion).
- Emits `postMessage({type:'lms:progress', percent, …})` — see LMS contract below.

## LMS integration contract (verified against the app)

The portal renders each course in a signed-in iframe
(`app/src/app/(app)/(learner)/courses/[slug]/CourseContent.tsx`). It:
- **Consumes** `window.postMessage({type:'lms:progress', percent})` from the
  course to record progress (takes the max; caps at 99 until "mark complete").
- Falls back to **iframe scroll position** when a course sends no message.
- Exposes a `window.storage` bridge the engine prefers over `localStorage`.

Keep the `lms:progress` message shape stable. `lms:lesson-change` is emitted by
the engine but not yet consumed (forward-compatible).

## Course registry

| Course file | Theme | Status vs standard |
|---|---|---|
| `ai-practical-playbook.html` (+ `.en`) | navy | Reference implementation the standard was extracted from. |
| `context-harness-engineering.html` | midnight | **Standard-conformant** (VI, L1→L5, 14 chương / 16 bài, recap + glossary + keyboard nav — round-3 2026-07-21: terminology de-slop, Bài 3.2 lifecycle/governance, threat model, post-run learning, Harness→Loop→Graph bridge). EN sibling: `context-harness-engineering.en.html`. Supersedes the v2 file below. |
| `loop-engineering.html` | loop (slate/cyan) | **Standard-conformant** (VI, L1→L5, 10 bài, cost-calculator widget + recap + glossary — round-2 2026-07). Sequel: autonomous/agentic loops. |
| ~~`ai-context-engineering-harness-engineering-course-v2.html`~~ | — | **Removed 2026-07-10** — superseded by `context-harness-engineering.html`; LMS catalog repointed (`app/prisma/seed.ts`). Recoverable from git history. |
| `rag-information-retrieval-course.html` | (editorial) | Pre-standard; candidate for future alignment. De-branded 2026-07-10 (generic production platform, no product names). |
| `dss-datawarehouse-idss-course.html` | — | Pre-standard-ish. De-branded 2026-07-10 (case-study genericized). |
| `decision-intelligence-agentic-systems.html` | agentic (ink/coral) | **Clean-room, standard-conformant** (VI, L1→L5, 13 bài, 10 interactive labs, 15 figures, 13 quizzes; four-plane reference architecture + nested learning loops — refreshed 2026-07-17). Self-improving means governed policy promotion, never unconstrained self-editing. |
| ~~`decision-intelligence-mastery-course.html`~~ | — | **Removed from public repo 2026-07-10** — anchored end-to-end to an internal production codebase (constants, table/function names); not publishable without a clean-room rewrite. In git history. |
| ~~`mso-decision-memory-systems-course.html`~~ | — | **Removed from public repo 2026-07-10** — internal implementation roadmap for an internal platform; not publishable. In git history. |

When you bring a pre-standard course into line, update its row here.

### Decision log — Context vs Harness split (2026-07)

Evaluated splitting `context-harness-engineering.html` into two standalone
courses. **Decided: keep it integrated.** Only 3 of 13 chapters are
single-discipline (M2, M3 = context; M4 = harness); the other 10 (three-
disciplines framing, tool mastery, SDLC application, team adoption) apply to
both and are the course's backbone. Its core thesis — context and harness are
complementary layers of *one stack, diagnosed together* — is exactly what a
split would destroy. A split would duplicate 10 chapters or yield two thin
courses failing the "stands alone" bar. The course is built with clean
Part/level boundaries, so a future split remains cheap if a genuine two-audience
need appears (see `reference.md §11`).

## Related skills

- `anti-slop-review` — fact-check & de-slop course prose before shipping.
- `a11y-audit` — deep WCAG pass on the rendered course.
- `codebase-to-course` — a *different* tool: turns a codebase into an explainer;
  not the house training-course system.
