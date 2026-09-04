# SOTA review — courses + interactive-course-builder skill (2026-08-29)

Goal: every course in `courses/` + the `interactive-course-builder` / `anti-slop-review` skills
hold to a top-tier bar; zero AI-slop terms (EN + VI calques); `decision-intelligence-agentic-systems.html`
upgraded to SOTA as the base for the MSO Platform project.

Deliverable: verified change (prose/skill edits). Risk: low (no schema/money/prod). No commit unless asked.
Pre-existing uncommitted work (agentic-swdev +4 lessons, 27/08) is left as-is and reviewed, not reverted.

## Acceptance
1. `scripts/slop-scan.py` (new, in scratch → maybe repo) reports 0 hits on the hard-ban list across all 17 courses.
2. `validate_course.py` = 0 errors on all courses (was 0 before; must stay 0).
3. `python3 scripts/audit-svg-arrows.py` clean.
4. Decision-intelligence course: SOTA gap list closed (each gap → lesson edit or explicit "out of scope"), validator 0 errors, browser check light/dark/375px.
5. Skill: lexicon + validator + reference updated; validator self-test on template.html still 0 errors.
6. Each fact touched cites a dated source in the digest or is marked as illustration.

## DAG
W1 (parallel, investigate): N1 slop-scan (lead) · N2 skill SOTA review (Opus) · N3 DI-course SOTA review (Fable fork) · N4a–d per-course prose/fact review (Sonnet ×N) · N5 MSO context (Explore)
W2 (build): fixers per course (disjoint files) · skill patch · DI upgrade
W3 (verify): validator + slop-scan + svg audit + browser walk + fresh-context verifier on DI course

## Ledger
| node | owner | state | evidence |
|---|---|---|---|
| N1 slop-scan | lead | done | scratch/slop-scan.py: 40 hard hits / 17 files; em-dash 18–19/1k in 5 newest courses |
| N5 MSO context | Explore (sonnet) | done | MSO = Marketing Systems OS in UCIP; roadmap docs/MSO-UCIP-Roadmap (→2026-08-27); removed internal courses purged from history; outline recovered from memory; forwarded to N3 |
| N2 skill SOTA | Opus | running | → scratch/findings-skill.md |
| N3 DI course SOTA | Fable fork | running | → scratch/findings-decision-intelligence.md |
| N4 ×11 course reviews | Sonnet | running | → scratch/findings-<slug>.md |
| N4 llm-finetuning | Sonnet review → lead fix | done | 15/15 facts verified live; 4 slop edits applied; validator 0 errors |
| N4 agent-reliability | Sonnet review → lead fix | done | 15 facts checked; reviewer's H "30%→80%" was a reviewer error (verbatim in Anthropic multi-agent article, lead re-fetched) — attribution made explicit; 1 slop edit; validator 0 errors |
| N4 ai-practical-playbook (vi+en) | Sonnet review → lead fix | done | 12 facts verified; 10/13 scanner hits were the in-lesson banned-word list (teaching against them) → validator must exempt those; fixed 1 calque, 1 heading, 5 redirected URLs (both files); validator 0 errors. Owner: openai.com/business-data 403 to bots — open by hand |
| N3 DI course | Fable fork | done | findings-decision-intelligence.md: 0 fact wrong, 0 slop; governance-only; DECISION (lead): rebuild on template via PLAYBOOK fan-out, 21 lessons, ids + COURSE_SLUG kept, capstone = weekly lever decision (vendor-neutral) |
| N4 chatgpt-cowork | Sonnet review | done | 15/15 facts verified live; 0 H/M findings; no edits |
| W1 done (all 11 course reviews + skill + DI) | — | done | lead applied mechanical fixes: 6 courses; facts corrected: agentic 17→21 bài, loop `agents.max_depth` default 1 (verified in openai/codex source), verifier's-law attribution, DSS Inmon non-volatile + NASA ozone framing, RAG Opus cache minima (verified platform.claude.com), playbook 5 redirected URLs |
| Skill patch | lead | done | validate_course.py: EN/VI hard+soft lexicon, calque warn, em-dash warn≥8/error≥13 per 1k (min 1500 words), not-just + intensifier density, opening/tagline heuristics, data-slop-exempt / slop-allow; template scroll-padding-top (2.4.11) + theme `agentic`; PLAYBOOK 3 failure rows + builder prose rule; reference §5 WCAG 2.2 note; anti-slop SKILL.md +4 sections. NOT done: quizPick second-attempt feedback, `predict` component, cmi5 events (design changes → owner) |
| W2 fixers ×11 (Opus) | running | — | openings scenario-first (loop 9, ops 6, ctx 9) + em-dash ≤12/1k on 8 courses over 13/1k |
| DI rebuild | lead | in progress | curriculum.md (20 lessons, ids renumbered sequentially — lead decision over "keep ids": visible Bài N.K order beats invisible progress continuity) + contract.json + legacy-v1.html; digests ×5 running (Opus); next: 6 module builders → assemble → validate → review → browser |
| INCIDENT 09:24 | RAG-VI fixer ran `git stash` repo-wide; loop fixer saw `git reset --hard` ×2 (reflog) | contained | stash@{0} kept (DO NOT DROP); 10 files restored by that agent; lead re-applied fact fixes on loop/agent-rel/ctx-en/playbook; agentic VI restored from stash (4 owner lessons m5-l4..7 were missing from working copy); VI fixer halted and will redo on restored file; dss/llm-ft re-apply pending fixer completion. New hard rule broadcast: no stash/checkout/restore/reset for any agent |
| W2 fixers done: loop 9.9/1k · ops VI 10.9/EN 11.2 · ctx VI 9.8/EN 10.9 · rag VI 10.0/EN 8.9 · llm-ft 8.5 · dss 9.5 · agent-rel 6.8 | Opus | done | all validator 0 errors; lead re-applied wiped fact fixes; remaining: agentic VI (restart on restored file), agentic EN, mcp |
| Digests ×5 | Opus | done | course-sources/decision-intelligence/digests/: measurement 672 lines/13 src · causal 1016/25 · bandits 961/17 · uncertainty 1138/16 · governance 885/28. Corrections folded into curriculum.md: TS cite 1111.1797/1209.3353; credibility → Loss Data Analytics ch.9; CUPED 18–40% variance; drop Gartner 50%, tianpan, 2512.20184; OTel all Development; pass^k τ-bench |
| DI builders ×6 | Opus | running | fragments/module-1..6 |
| W3 verify (15 courses, excl. agentic VI + DI) | lead | done | validator 0 errors ×15; svg audit 0; headless Playwright (chromium 1234): 0 console/page errors, dark toggle OK, 0 horizontal overflow @375px, quiz clickable; fixed playbook `#mobile-toggle` 38×38 → 44×44; 4 definition-openings rewritten (rag m3-l4 vi+en, playbook m1-l5 vi+en); mcp cliché callout title replaced |
| DI rebuild | lead + 6 Opus builders | done | assembled 20 lessons (385 KB) · validator 0 errors incl. --sensitive · svg audit 0 · Playwright: 0 errors, 20 nav = LESSONS, 3 labs interactive, quiz feedback, dark, 375px 0 overflow, 0 SVG text clipped · recap table reconciled to real takeaways · labs merged into engine script (validator's node --check regex needs one script) · index card + registry row updated · fragments/digests/contract under course-sources/decision-intelligence/ (gitignored, local) |
| Final gates | lead | done | scripts/verify.sh green (tsc, eslint, vitest 20/20, svg audit) · 17/17 courses validator 0 errors with --sensitive · Playwright 17/17: 0 console errors, dark OK, 0 overflow, 44px targets (fixed playbook mobile-toggle + template copy-btn) · em-dash: 17.4–19.4 → 6.8–11.3 per 1k on the 8 courses that were over the 13 gate |

## Exit
RESULT: done — not committed (no commit requested). stash@{0} (09:24 incident snapshot) intentionally kept; safe to `git stash drop` after the owner confirms the working tree.
NEEDS OWNER: (1) review + commit 19 repo files and the skills repo (~/.conan-agent-skills: validator, template, PLAYBOOK, reference, anti-slop SKILL.md); (2) open https://openai.com/business-data/ by hand (403 to bots); (3) decide on 3 skill design changes not applied: quizPick second-attempt feedback, `predict` component, cmi5 events.
trust: course-review-fleet · run 1 of this class · clean no (concurrency incident, contained) · lesson: brief must forbid git stash/checkout/reset for every worker
