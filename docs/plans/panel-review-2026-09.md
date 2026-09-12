# Expert-panel review — all courses, bar dated 2026-09-05

Goal: every course in `courses/` (12 courses, 17 files incl. 5 EN siblings) reviewed by an
expert panel (industrial AI expert · AI professor · world-class learner · end user), facts
current to 2026-09-05, prose easy to grasp, content and presentation at the state of the
art, sufficient for self-study, not redundant across the family — and the findings applied.

Deliverable: verified change (in-place edits to course HTML + catalog/registry rows).
Risk: low — public repo prose/HTML, no schema/money/prod. No plan gate. No commit (not asked).
Cost disclosure: ~36 helper runs (12 panel reviewers → 12 fixers → 12 fresh-context
verifiers), same class as the 2026-08-29 run (`sota-review-2026-08.md`).

## Acceptance (exact commands; green = marker shown)
1. `python3 /root/.conan-agent-skills/interactive-course-builder/scripts/validate_course.py courses/<f>` → `RESULT: 0 errors` on all 17; warning count per file ≤ the **committed version's count under the same validator**.
   **Restated 2026-09-12 (validator drift).** The validator was upgraded that day and added prose checks (em-dash density vs a 6.4/1k house reference, soft-slop lexicon, negative parallelism, tagline-restates-heading, definition-openings). The old absolute baselines (agent-rel 19 · agentic en 2 / vi 4 · ops 23/23 · playbook 27/27 · cowork 4 · ctx 19/19 · DI 0 · dss 21 · llm-ft 18 · loop 12 · mcp 24 · rag 19/19) are no longer comparable: every file now scores higher, including the untouched committed ones. The only valid gate is HEAD-vs-working under the current validator (`git show HEAD:<f>` → validate → compare). Measured: 12 of 17 unchanged · cowork 6→5 (improved) · +1 on loop (new lesson's chip), playbook EN (new lesson's chip), agentic EN and ctx EN (lesson-length, accepted for VI/EN parity), rag EN (added prose crossed the em-dash gate → sent back). **Do not "fix" the drift warnings** — they are pre-existing prose in the shipped courses, and rewriting them is scope creep.
2. `python3 scripts/audit-svg-arrows.py` → `0 issue(s)`.
3. `bash scripts/verify.sh` → `verify: all green`.
4. Headless Playwright over 17 files → 0 console/page errors, dark toggle works, 0 horizontal overflow @375px.
5. Per course: `scratchpad/findings-<slug>.md` with every fact checked against a live source (URL + date) and every H/M finding either applied or declined with a reason.
6. Cross-course redundancy map (`scratchpad/redundancy.md`): each overlap → keep (standalone foundation) / trim / pointer, with the decision applied.
7. EN/VI siblings: every content change lands in both files; `LAST_SYNCED` markers set to 2026-09-05 where content changed.
8. `courses/index.html` + `docs/INTERACTIVE-COURSE-STANDARD.md` registry rows reflect the new lesson counts/dates.

## Assumptions (logged, reversible)
- "Perfect" = the §9 bar of `reference.md` + facts verified live as of 2026-09-05; not a rebuild.
- Exercise data with deliberately invalid/future dates (ops-training `32/03/2026`, cowork CSV contract end dates) is intentional and stays.
- Legacy-shaped courses (none found — all 17 are template-native) would get content-only fixes.
- Redundancy across courses is acceptable when it is the minimal standalone foundation (`reference.md §11`); only true duplication gets trimmed.

## DAG
W1 review (parallel ×12, Opus, read-only): panel findings per course, facts verified live.
W2 fix (parallel ×12, Opus, disjoint files): apply findings, keep VI/EN in sync, validator 0 errors.
W3 verify: fresh-context verifier per course diff (never sees the findings' verdicts) + lead gates (1–4) + redundancy map + catalog/registry.

Hard rules for every helper: absolute paths, no `cd`; never `git stash/checkout/restore/reset/commit`; only touch the files in scope.

## Ledger
| node | owner | state | evidence |
|---|---|---|---|
| kickoff | lead | done | validator 0 errors ×17; svg audit 0/18; odd dates = exercise data |
| W1 reviewers ×12 | Opus | running | → scratchpad/findings-<slug>.md; brief = scratchpad/brief-review.md |
| tooling | lead | done | app deps absent on this machine → `npm ci --legacy-peer-deps` (plain `npm ci` hits ERESOLVE); Playwright QA script scratchpad/qa-courses.mjs: 3/3 clean smoke (nav=LESSONS, dark toggle, quiz feedback, 0 overflow @375) |
| baseline gates | lead | done | Playwright QA 17/17 clean (needs the Playwright build matching chromium-1234, i.e. another project's node_modules; app's own needed `npx playwright install chromium`, done) · verify.sh green (tsc, eslint, vitest 20/20, svg audit) |
| W1 reviewers | Opus ×12 | 11/12 done | findings-*.md: agent-rel H3/M22 · playbook H6/M13 · dss H7/M11 · ops H5/M11 · mcp H5/M14 · llm-ft H5/M14 · rag H7/M18 · ctx H6/M21 · DI H4/M13 · agentic H5/M16 · loop H6/M22 · cowork running. Two reviewers (rag, loop) were blocked by the harness from writing report files → lead saved their inline reports. Canonical Claude facts (models/pricing 2026-09-05) captured in brief-fix.md |
| INCIDENT ~00:50 UTC | session rate limit (Opus) killed all 11 fixers + 2 helper agents mid-edit | contained | disk state inspected: 12 files partially edited, validator 0 errors on all, svg audit 0; no reverts; every fixer resumed from its own transcript via SendMessage after the reset with "re-read before each edit, do not redo applied findings"; cowork reviewer had finished (H7/M17) → cowork fixer launched |
| W2 fixers first pass | Opus ×12 | done | all 12 reported; validator 0 errors on all 17 files; warnings at baseline except ctx EN +1 and agentic EN +1 (m5-l1/m5-l2 crossed 1900 words from mandated additions — lead accepts: content parity beats a length warning); lesson counts: playbook 25→26 (m4-l5 recap), loop 11→12 (m5-l2 lab) |
| W3 verifiers (fresh context, diff + criteria only) | Opus ×12 | running | verdicts so far: mcp fix-needed(3) → fixed, re-gated · agent-ops BLOCK (fixer had used third-party OSWorld leaderboards; official xlang.ai data differs) → sent back · DI fix-needed(4) → sent back · agent-rel BLOCK (venue ICML→NeurIPS) + 4 fixes → sent back · playbook BLOCK (SynthID survives re-encode) → sent back · dss BLOCK (ozone date; 8 prose fixes) → sent back · rag, llm-ft, ctx, agentic, cowork, loop pending |
| W3 → fix-up rounds | Opus | done for 8 | mcp · agent-ops (official OSWorld xlang.ai data) · DI (Hình 4.1 redrawn on seed 555) · agent-rel · playbook (SynthID) · dss (ozone 1984, Fleig) · rag (stop-list, AWS link) · llm-ft (Bedrock RFT paths) — all re-gated at validator 0 errors, warnings ≤ baseline (+1 accepted on ctx EN, agentic EN, playbook EN new-lesson chip) |
| lead | lead | done | courses/index.html cards (26/12 bài, edition badges 05/09/2026, Loop rel line) · docs/INTERACTIVE-COURSE-STANDARD.md rows + "Panel pass 2026-09-05" note |
| PAUSE 2026-09-05 (operator: "not enough credit") | lead | checkpoint | 4 verifiers stopped (ctx, agentic, loop killed mid-run; cowork had finished → its BLOCK/FIX list saved to scratchpad/verify-cowork-pending.md, NOT applied). Gate state at pause: validator 0 errors ×17, svg audit 0/18, 21 files modified (+2317/−1100), nothing committed |

| browser QA after edits | lead | done | `qa-after-edits.log`: **17/17 clean** — 0 console/page errors, dark toggle OK, 0 overflow @375px, quiz feedback fires, nav count = LESSONS on every file (playbook 26, loop 12) |
| loop verify → fix-up | Opus | done · CLOSED | verifier BLOCK: the new m4-l1 "oracle" box inverted the C-compiler post (its verifier WAS hand-written suites; GCC-as-oracle was a later kernel-only split-build) — re-sourced and now agrees with m6-l1; + changelog release-count line, missing visual in m5-l2 (Hình 5.2 added, markers m5l2-a/g), "verifier's law"→"rule", widget/prose number format, 3 notes. Gate: 0 errors, **14 warnings = HEAD's 14** (new lesson's chip offset by a negative-parallelism warning clearing); arrows 0/18, clip 0 |
| cowork fix-up | Opus | done · CLOSED | verifier BLOCK fixed (Company Knowledge is a plugin and its apps CAN write); PDPL Điều 20 khoản 2 + 60-day detail restored from the signed PDF; Teams write tools; Work availability written as the source words it ("eligible paid plans" — the page does not enumerate plans, so the course no longer does either); contract.json moduleIntros/completion/glossary synced; 3.3 answer table rebuilt to all 6 columns. Gate: 0 errors, **4 warnings vs HEAD's 6**; --sensitive clean; arrows 0/18, clip 0. Lead additionally authorized the fixer's own find: the plugin definition ("mẫu app") matches no live page |
| agentic verify → fix-up | Opus | done · CLOSED | verifier confirmed every source (arXiv 2512.08296, DORA ROI, METR 11/05/2026, Stack Overflow, Bun + Bun 1.4, OpenClaw stars, routines/`/goal`/permission-modes, 47/47 mirror regions, no residue of the deleted outage sentence) and BLOCKED one miss: the 5.2 quiz explanation still credited the model-tiering quote to Anthropic while the accordion 27 lines above had been rewritten to "this course's rule". Fixed, plus the still-quoted line at 4208 and the Faros title's extra "The"; paddo.dev row downgraded in place rather than orphaning the prose that cites it. VI 7 = HEAD 7, EN 5 = HEAD 4 + the accepted m5-l2 length warning |
| ctx verify → fix-up | Opus | done · CLOSED | verifier confirmed every high-stakes fact (cache multipliers incl. 0.025×, `[features.network_proxy]`, both flag value sets, `untrusted` retired, `danger-full-access` vs `--yolo`, AGENTS.md concatenation, AAIF 12/2025) and returned 5 FIX: VI/EN parity break in 4.1, the "harness = name of the job" overclaim, the Context-Rot 18-model framing, the auto-memory row label + restored `#` hotkey, and the tokenizer scope now using the docs' own string (incl. Mythos). All applied; 3 of 4 notes too. VI 21 (HEAD 22), EN 20 (HEAD 20) |
| CROSS-COURSE CATCH | lead | fix sent | The ctx fixer declined a note because it could not verify a `mid-conversation-tool-changes-2026-07-01` beta — but the MCP course asserts that beta as fact. I checked both official caching pages myself: no such beta exists, and both state "Modifying tool definitions → Entire cache". The documented mechanism is `defer_loading` + tool search (`tool_reference` blocks, prefix untouched). MCP sentence sent back for rewrite; ctx's own wording was already correct, so it stays. Two courses disagreeing is what surfaced it |
| FINAL GATES | lead | green | `scripts/verify.sh`: **all green** (tsc, eslint, vitest 20/20, svg arrow audit 0/18) · browser QA **17/17 clean** · validator **0 errors ×17**, and vs the committed files under the same validator: 13 unchanged · cowork −2 and ctx VI −1 (better than shipped) · agentic EN +1 (accepted m5-l2 length) and playbook EN +1 (the new lesson's reading-time chip). Loop holds 14 = 14 despite gaining a lesson |
| rag em-dash regression | Opus | done · CLOSED | only this run's own added/rewritten passages de-dashed (30 dashes per file, asides → plain sentences; en-dash ranges left as notation); no fact, number, citation or structure touched. VI 21 = HEAD 21, EN 21 = HEAD 21; paragraphs holding ≥2 dashes 3/106 → 0/106 in both. Fixer also corrected my read: EN was *under* the gate when committed and my prose newly crossed it, while VI was already over — so "back to 21" meant a different warning set per file |
| cowork · lead-authorized extra | Opus | done · fixer overruled the lead, correctly | I authorized rewriting "plugin = skill + app + mẫu app" on a reviewer's note; the fixer checked the dedicated page (help.openai.com/…/20001256-plugins-in-chatgpt-and-codex) and showed "App templates" is verbatim in the definition — so the course was right and my instruction would have made it worse. It kept the definition, sourced it, and instead removed the unsupported half beside it ("App Directory nay là Plugin Directory" — no page states that rename). Gate unchanged: 0 errors, 4 warnings; --sensitive clean; contract.json parses |
| ctx fix-up | Opus | done | all 6 pending Codex/date corrections applied VI+EN (domains → `[features.network_proxy]`; the two flags' value sets; `danger-full-access` removes the sandbox not approvals; AGENTS.md concatenates root-down; AAIF + Agent Skills → 12/2025). Fixer's own live re-read went further than the pending list: `untrusted` is no longer a supported `approval_policy` at all → written as retired, Hình 6.2 grid 3×3→3×2. Gate: VI 21 (HEAD 22), EN 20 (HEAD 20) — both at or below committed |
| RESUMED 2026-09-12 | lead (Opus 5 — Fable unavailable) | running | wave 1 parallel ×4: cowork fix-up (verify-cowork-pending) · ctx fix-up (verify-ctx-pending) · agentic verifier · loop verifier; plus lead re-running the 17-file browser QA after edits |

## RESUME (next session)
1. Apply `scratchpad/verify-cowork-pending.md` to `chatgpt-work-claude-cowork-practical-guide.html` (+ contract.json/curriculum.md), re-gate (validator + `--sensitive`, arrow + clip audits).
1b. Apply `scratchpad/verify-ctx-pending.md` to context-harness (VI+EN): four Codex facts written by the fixer are wrong (domain allowlist table, flag value sets, danger-full-access, AGENTS.md concatenation) + two dates; and the loop-course `agents.max_depth` citation note.
2. Run fresh-context verifiers (brief-verify.md) for the three courses never verified: context-harness (VI+EN), agentic-software-development (VI+EN), loop-engineering; apply their BLOCK/FIX items.
3. Family gates: validator ×17, `python3 scripts/audit-svg-arrows.py`, `node scripts/audit-svg-clip.mjs`, `node scratchpad/qa-courses.mjs /home/comic-sub-multiligual-comic-reading/node_modules/playwright courses/*.html` (17/17 clean expected), `bash scripts/verify.sh`.
4. Exit report + trust line; operator reviews the diff and commits.
Scratchpad copy (gitignored, survives the session): `course-sources/panel-review-2026-09/` — findings-*.md, verify-*-pending.md, brief-review/fix/verify.md, redundancy.md, lesson-map.md, qa-courses.mjs. Original session scratchpad:

## Exit (run complete, 2026-09-12)
RESULT: done — all 12 courses (17 files) reviewed by a 4-lens panel, fixed, independently verified by a fresh-context agent that never saw the findings, and re-fixed. Not committed (no commit was requested).

EVIDENCE
- `bash scripts/verify.sh` → `verify: all green ✔` (tsc, eslint, vitest 20/20, svg arrow audit)
- `validate_course.py` → **0 errors on all 17**; `python3 scripts/audit-svg-arrows.py` → `0 issue(s) across 18 file(s)`; clip audit clean per touched file
- headless Playwright over all 17 → **17/17 clean**: 0 console/page errors, dark toggle persists, 0 horizontal overflow @375px, quiz feedback fires, nav count = `LESSONS` everywhere
- warnings vs the committed file under the *same* validator: 13 unchanged · cowork −2 and ctx VI −1 (better than shipped) · agentic EN +1 (accepted m5-l2 length, kept for VI/EN parity) and playbook EN +1 (the new lesson's reading-time chip)
- `git diff --stat` → 21 files, +2416 / −1160, plus this untracked plan file

DID
- 12 panel reviews (industrial expert · professor · world-class learner · end user), every dated claim re-verified against a live primary source
- 12 fix rounds, then 12 independent verifications, then 11 fix-up rounds
- Facts corrected that a single pass would have shipped: OSWorld figures taken from third-party leaderboards (official xlang.ai data differs), a SynthID claim that inverted Google's own robustness statement, an ozone-history date and team attribution, an ICML/NeurIPS venue, a token-overlap worked example that was arithmetically impossible, Bedrock RFT paths and an EOL written in past tense before the date, a Thompson-sampling figure that contradicted its own lab, a C-compiler verifier story that inverted the source, Codex config facts (`domains` table, flag value sets, `danger-full-access`, AGENTS.md concatenation), and a `mid-conversation-tool-changes` beta that does not exist
- Structure: 2 lessons added where the learner lens found a real gap (Playbook 4.5 recap → 26 bài; Loop 5.2 lab → 12 bài). No lesson deleted; cross-course overlaps kept with one-line pointers, since each course must stand alone
- Catalog cards, registry rows and the contract/curriculum sidecars brought back in step with the shipped HTML

DECIDED (all reversible)
- Opus fleet throughout (Fable unavailable); overlaps = keep + pointer, never trim; VI/EN content parity beats a length warning; exercise data with deliberately odd dates left alone; edition stamps held at 05/09/2026 even for facts re-read on 12/09
- Gate restated mid-run after discovering validator drift: compare against `git show HEAD:<file>`, never against stale absolute counts, and do not "fix" the new prose warnings

SKIPPED / NOT DONE
- A second verify pass on the fix-ups themselves (each fix-up was gated, not re-verified end-to-end)
- Two facts no bot could reach: the Alex Finn X link in Operating AI Agents 1.4, and the Hoffer "13th ed. © 2019" bibliographic detail in DSS
- Three courses still carry unlinked or unlocatable secondary sources, flagged in place rather than deleted (paddo.dev in Agentic 5.4; Hamel Husain / Confident AI in Agent Reliability)

NEEDS YOU
1. Review and commit the 21 modified files (+ the plan file). Nothing is staged; no git command was run beyond status/diff/show.
2. Check the two by-hand items above if you want them sourced rather than hedged.
3. Decide whether to authorize a separate de-slop pass for the validator's new prose checks — every course is over the new em-dash/soft-slop thresholds, including untouched ones, so it is a family-wide editorial job, not this run's regression.

trust: course-review-fleet · run 2 of this class · clean yes (rate-limit crash mid-run was contained with no lost work; operator pause and resume handled from the plan file) · lesson: the verify step is the whole value — 11 of 12 courses came back with a BLOCK or FIX, three of them on facts a previous round had just "corrected", and one error surfaced only because two courses contradicted each other. Budget W3 up front and never trade it away for speed. brief-fix.md + per-course lead decisions (structural adds approved: playbook m4-l5 recap lesson → 26 bài; loop m5-l2 lab lesson → 12 bài; all cross-course overlaps KEEP + one-line pointers; SVG font floors raised in dss/llm-ft/loop) |

## Needs operator (≤3)
- (filled at exit)

trust: course-review-fleet · run 2 of this class · clean — · (filled at exit)
