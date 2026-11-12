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
- Color only via semantic tokens; light mode by default, dark mode through the persisted topbar toggle.
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

The public catalog is [`courses/index.html`](../courses/index.html). There are
**13 base courses and five English mirrors**. Counts below include recap lessons
and come from each course's `LESSONS` array. Choose a branch for the task at hand;
completing every course is not a prerequisite for building an agent.

| Course | Lessons | Suggested preparation | Practice outcome |
|---|---:|---|---|
| [Practical AI](../courses/ai-practical-playbook.html) · [EN](../courses/ai-practical-playbook.en.html) | 19 | None | A brief, checked sources and a reconciled calculation |
| [AI Work Agents](../courses/ai-work-agents-practical-guide.html) | 14 | Practical AI | A delegated office task with a permission boundary and result receipt |
| [Agent Operations](../courses/ai-agent-operational-training.html) · [EN](../courses/ai-agent-operational-training.en.html) | 23 | Work Agents | A staging workflow with accepted/rejected rows and recovery |
| [Context & Harness](../courses/context-harness-engineering.html) · [EN](../courses/context-harness-engineering.en.html) | 17 | Programming basics | A runtime with scoped context, tools and protected side effects |
| [Reliability & Evaluation](../courses/agent-reliability-evaluation.html) | 19 | A task to evaluate | A held-out eval set, failure cases and a rollout gate |
| [Loop Engineering](../courses/loop-engineering.html) | 12 | Context & Harness; Reliability foundations | A bounded loop with an independent verifier and resume state |
| [MCP & Tool Layer](../courses/mcp-tool-layer.html) | 18 | Context & Harness | A versioned tool contract with authorization and failure checks |
| [Agentic Software Development](../courses/agentic-software-development.html) · [EN](../courses/agentic-software-development.en.html) | 23 | Context & Harness; software development | A repo playbook with ownership, acceptance checks and review capacity |
| [RAG](../courses/rag-information-retrieval-course.html) · [EN](../courses/rag-information-retrieval-course.en.html) | 19 | Retrieval basics; Reliability foundations | A query/qrels baseline, ablation and tenant/ACL negative test |
| [Fine-tuning](../courses/llm-finetuning.html) | 17 | Prompt/context baseline; Python | Leakage-safe data splits and a paired comparison with the baseline |
| [DSS & Data Warehouse](../courses/dss-datawarehouse-idss-course.html) | 21 | Data and programming basics | A decision/data design with explicit uncertainty and evidence limits |
| [Agentic Decision Systems](../courses/decision-intelligence-agentic-systems.html) | 20 | DSS; Reliability statistics sections | A decision contract, estimand, evidence record and abstention path |
| [Typed Decisions / Jev](../courses/typed-decision-systems-jev.html) | 18 | Decision Systems; API programming | A typed selector with policy checks, calibration, shadow eval and recovery |

Keep repeated foundations short so each HTML file works independently. Operations
owns user-side execution; Context owns runtime and memory lifecycle; Reliability
owns measurement; Loop owns repeated execution; Decision Systems owns intervention
and action policy. Fine-tuning is optional for agent development, and DSS is not a
prerequisite for ordinary RAG.

### November 2026 edition

Knowledge cutoff: **12 November 2026**; source and browser checks: **13 November
2026 (ICT)**. The review covers all 240 base lessons and 101 English mirror
lessons across the 18 HTML files. Separate author and reviewer passes use four
lenses: scientific validity, operational engineering, programmer comprehension,
and concise teaching. This is an AI-assisted review, not external accreditation.

Mutable product documentation is linked and dated where used; access on
13 November does not establish an immutable 12 November snapshot. Published
studies retain their population, task and measurement limits. Worked examples
and executable acceptance fixtures are labelled as exercises, not production
benchmarks. Course labs do not certify a live vendor integration. Price, model,
permission and preview status still need checking against the deployed version.

The registry preserves standalone files and lesson IDs. Diagrams retain readable
native scale with local scrolling where needed; quiz, copy, navigation, theme
and progress behavior are checked in a real browser. Automated geometry checks
complement manual inspection of labels, arrows and meaning.
Practical AI and its English mirror inherit the portal theme when embedded and
the operating-system preference when standalone; they have no local theme
toggle. The other course files provide an in-course theme control.

### Historical review — September 2026

The following records the September snapshot; its counts, provider details and approval status do not describe the current registry above.

Every course was reviewed by a four-lens panel (industrial AI expert · AI professor · world-class learner · end user) with facts re-verified live to 05/09/2026, then fixed and re-checked by a fresh-context verifier per course. Family-wide: Claude roster/prices as of 2026-09-01 (Fable 5.1 / Mythos 5.1, cache-read 0.025×, Sonnet 5 price permanent, 1M context standard), MCP spec 2026-07-28 details, OTel GenAI still Development, edition stamps → 05/09/2026. Cross-course overlaps were kept (each course stands alone) with one-line pointers; two lessons added (Playbook 4.5, Loop 5.2).

**Verification closed 2026-09-12.** All 12 courses went review → fix → independent fresh-context verify → fix-up. The verify step earned its cost: 11 of 12 courses came back with at least one BLOCK or FIX that the fixer had missed or got wrong, including three courses where a corrected "fact" was itself wrong (OSWorld figures taken from third-party leaderboards, a SynthID robustness claim, a Bedrock EOL written in past tense before the date). One error surfaced only because two courses disagreed with each other: a `mid-conversation-tool-changes` beta asserted in MCP & Tool Layer does not exist — the documented mechanism is `defer_loading` + tool search. **Gate note:** `validate_course.py` was upgraded on 2026-09-12 and added file-wide prose checks (em-dash density against a 6.4/1k reference, soft-slop lexicon, negative parallelism, tagline-restates-heading). Every course now scores higher than before, *including the untouched committed ones*, so absolute warning counts from earlier rounds are not comparable — compare a working file against `git show HEAD:<file>` under the same validator. Run log: `docs/plans/panel-review-2026-09.md`.

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

## Diagram regression gate

`node scripts/audit-svg-clip.mjs` measures actual SVG text bounds and rendered
font size at 1440px and 375px. The local regression floor is 8 CSS px; this is
not a WCAG font-size certification. Dense diagrams can retain their native scale
inside a labelled, focusable horizontal scroll region; captions stay at page
width. Manual inspection still checks meaning, contrast, labels and arrows.
The audit runs in `scripts/verify.sh` and the versioned pre-push hook. Enable the
hook on a fresh clone with `git config core.hooksPath .githooks`; it needs the
app's Playwright dependency and an installed Chromium or macOS Google Chrome.
