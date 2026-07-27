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
| `chatgpt-work-claude-cowork-practical-guide.html` | teal | **Standard-conformant** (VI, L1→L5, 6 module / 18 bài, recap + capstone + glossary; new 2026-07-26: product-specific practical guide for non-coders, two optional lanes ChatGPT Work / Claude Cowork, Brief 6 ô, research/file/spreadsheet/browser workflows, least privilege, prompt-injection handling, receipt verification, supervised-3-run gate before scheduling; facts dated to official OpenAI/Anthropic sources). Complements the platform-agnostic `ai-agent-operational-training.html`. |
| `ai-practical-playbook.html` (+ `.en`) | navy | Reference implementation the standard was extracted from. SOTA round 2026-07-25: prompt-injection cho non-dev (Bài 2.3), back-check citation 3 bước (1.4), 3 worked example input→output→critique đầu tiên, +3 SVG (3→6), tone de-absolutize, EN sync marker sửa (`LOCALE: en`) + re-sync. |
| `ai-agent-operational-training.html` | midnight | **Standard-conformant** (VI, L1→L5, 8 phần / 22 bài (gồm 2 lab), recap + glossary — mới 2026-07-21: khoá vận hành agent cho non-engineer, đứng sau Playbook trước Context & Harness trong lộ trình; round-2 2026-07-21: +3 bài SOTA (verify deliverable nghiên cứu, agent memory, credential governance cho connector); round-3 2026-07-25: 4 SVG cho Module 2 spine, benchmark≠reality (OSWorld 2.0), CISA/Five Eyes callout, upgrade-day golden set, 5.2 run-through, recap 22 ý, fix mâu thuẫn "100%"). EN sibling. |
| `context-harness-engineering.html` | midnight | **Standard-conformant** (VI, L1→L5, 14 chương / 16 bài, recap + glossary + keyboard nav — round-3 2026-07-21: terminology de-slop, Bài 3.2 lifecycle/governance, threat model, post-run learning, Harness→Loop→Graph bridge; round-4 2026-07-25: fix mâu thuẫn diff-attention, tool-shape rule, tool-loadout/compaction-as-infra/1M-pricing dated callouts, containment-before-alignment + Hình 4.2, CLAUDE.md/SKILL.md annotated, Codex 2-dial sandbox + Hình 6.2, "nhiều agent đọc một agent viết"; round-5 2026-07-25: **14 chương / 17 bài** — thêm Bài 5.2 "Cắt bớt · Context theo đời model" (chi phí phân xử khi nguồn mâu thuẫn, bảng 6 chuyển dịch Then→Now theo Anthropic 24/07/2026, rà CLAUDE.md/Skill theo 5 nhãn, ranh giới authorization không cắt, Hình 5.3), Pattern 6 tách few-shot định-dạng vs few-shot tool-use, nguồn +1). EN sibling: `context-harness-engineering.en.html`. Supersedes the v2 file below. |
| `loop-engineering.html` | loop (slate/cyan) | **Standard-conformant** (VI, L1→L5, 10 bài, cost-calculator widget + recap + glossary — round-2 2026-07; round-3 2026-07-25: durable execution + progress.md artifact, verifier reward-hacking, classifier-gated approval, case 16-agent C-compiler, worked examples m1/m2, Fig 9.1 → SVG, de-absolutize "định luật/lý do #1/nhân đôi"; round-4 2026-07-25: **11 bài** — thêm Bài 6.2 "Hợp đồng của một đội agent" (cổng chặn trước fan-out dựa trên 90,2% ↔ 15× token, role card 5 trường, ba núm vai·context·biên spawn, leaf boundary theo openai/codex #26822, Hình 6.2)). Sequel: autonomous/agentic loops. |
| ~~`ai-context-engineering-harness-engineering-course-v2.html`~~ | — | **Removed 2026-07-10** — superseded by `context-harness-engineering.html`; LMS catalog repointed (`app/prisma/seed.ts`). Recoverable from git history. |
| `rag-information-retrieval-course.html` | (editorial) | Pre-standard; candidate for future alignment. De-branded 2026-07-10 (generic production platform, no product names). |
| `dss-datawarehouse-idss-course.html` | — | Pre-standard-ish. De-branded 2026-07-10 (case-study genericized). |
| `decision-intelligence-agentic-systems.html` | agentic (ink/coral) | **Clean-room, standard-conformant** (VI, L1→L5, 13 bài, 10 interactive labs, 15 figures, 13 quizzes; four-plane reference architecture + nested learning loops — refreshed 2026-07-17; round-2 2026-07-25: +4 SVG (grid L×A, evidence ladder, overlap/ESS, action state machine → 10/13 bài có SVG), số minh hoạ cho 4 bài, shadow-accuracy gate + peeking caution, EU AI Act Art.50/Art.14 dated callout, SUTVA/interference ở capstone, approval-fatigue human factors). Self-improving means governed policy promotion, never unconstrained self-editing. |
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
