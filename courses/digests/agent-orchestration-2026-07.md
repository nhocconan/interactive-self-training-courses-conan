# Digest — Agent orchestration / multi-agent coding, state as of 2026-07-25

**Digested:** 2026-07-25. Every fact below was fetched this session, not recalled.
**Distribution:** PUBLIC — vendor blogs, public issue tracker, community guide. No client data.

Sources, with their tier marked (tier matters — the course must not present a
community blog as a vendor spec):

| ID | Source | Tier | Date |
|---|---|---|---|
| S1 | Anthropic Engineering, "How we built our multi-agent research system" (anthropic.com/engineering/multi-agent-research-system) | Vendor / primary | 2025-06-13 |
| S2 | openai/codex issue #26822 "Subagents can shut down without delivering results; fork_turns none scouts acted as orchestrators" | Public issue tracker / primary field report | 2026-06-06 |
| S3 | openai/codex issues #20077, #32031, #33314 (spawn_agent override behaviour) | Public issue tracker | 2026 |
| S4 | "Codex CLI Multi-Agent Orchestration v2: Complete Guide", codex.danielvaughan.com | Community guide / SECONDARY | 2026-04-11 |
| S5 | Claude Code product surface: Subagents, Agent Teams (experimental), Dynamic Workflows (research preview 2026-05-28) | Vendor product | 2026 |
| S6 | First-hand: the tool contract of the harness this digest was written in (Agent + Workflow tools) | Direct observation | 2026-07-25 |

---

## F1 (S1) — The one number everyone quotes, with the sentence that follows it

> "We found that a multi-agent system with Claude Opus 4 as the lead agent and
> Claude Sonnet 4 subagents outperformed single-agent Claude Opus 4 by **90.2%**
> on our internal research eval."

Scope: an **internal research eval**, testing "breadth-first queries requiring
multiple independent directions." Not a coding eval.

## F2 (S1) — The cost, stated by the same vendor

> "Agents typically use about **4× more tokens** than chat interactions"
> "Multi-agent systems use about **15× more tokens** than chats"
> "Token usage by itself explains **80% of the variance**" in BrowseComp performance.

Implication for teaching: a large part of "multi-agent is smarter" is
"multi-agent spent more." Any comparison that does not hold token spend roughly
constant is not measuring topology, it is measuring budget.

## F3 (S1) — Where multi-agent fits, and the vendor's own anti-recommendation

Fits:
> "Multi-agent systems excel at valuable tasks that involve heavy
> parallelization, information that exceeds single context windows, and
> interfacing with numerous complex tools."

Does not fit — **this is the load-bearing quote for a coding-agent course**:
> "Some domains that require all agents to share the same context or involve
> many dependencies between agents are not a good fit for multi-agent systems
> today. For instance, **most coding tasks involve fewer truly parallelizable
> tasks than research**, and LLM agents are not yet great at coordinating and
> delegating to other agents in real time."

Date-stamp discipline: this is **2025-06-13**. It is the strongest published
vendor caution about multi-agent *coding*, and it predates the 2026 product
surface (S5). Teach it as the baseline claim plus "what changed since" — do not
present it as either obsolete or as current measurement.

## F4 (S4, SECONDARY) — Codex CLI Multi-Agent V2 knobs

`spawn_agent` parameters as documented in the community guide:

| Parameter | Required | Notes |
|---|---|---|
| `message` | yes | task prompt for the new agent |
| `task_name` | yes | name segment appended to parent's path |
| `agent_type` | no | role name mapping to a `.codex/agents/` config |
| `model` | no | model override |
| `reasoning_effort` | no | `"low"` / `"medium"` / `"high"` |
| `fork_turns` | no | `"all"` forks the parent's full conversation history |

- **Depth limit:** `agent_max_depth = 3` by default, set in `~/.codex/config.toml`.
  Exceeding it "returns an error instructing the agent to solve the task itself."
- **Recursion is allowed:** "You can spawn sub-agents to handle subtasks, and
  those sub-agents can spawn their own sub-agents." There is **no leaf boundary
  by default** — only the depth cap.
- **`send_message`** delivers text to a running agent and triggers a new turn.
  Cannot target `/root`. Siblings can message each other by absolute path
  "without routing through the orchestrator."
- Patterns named: sequential (pipeline), parallel (fan-out), wave-based
  (synchronised phases), dispatcher (central router), peer-to-peer.
- No explicit concurrency limit documented in this source. **Any specific
  concurrency default (e.g. "4") is NOT verified — do not teach a number.**

## F5 (S3) — Override behaviour is a live sharp edge

Public issues report that with MultiAgentV2, `spawn_agent` **defaults to a
full-history fork** when `fork_turns` is omitted, and that full-history forks
**reject** `agent_type` / `model` / `reasoning_effort` overrides (they inherit
the parent's). Titles: "MultiAgentV2 spawn_agent defaults to full-history fork,
rejecting agent_type/model overrides" (#20077); "multi-agent v2 spawn_agent
hides model overrides and rejects the default call shape" (#32031).

Teaching point: **context inheritance and role assignment are coupled.** You
cannot simultaneously say "inherit everything the parent knows" and "be a cheap
low-effort scout" — the fork carries the parent's model and effort with it.

## F6 (S2) — The documented failure mode that justifies the "leaf law"

Issue #26822, 2026-06-06. A parent spawned **three read-only scout subagents**
with `fork_turns: "none"` and narrow scout prompts. Observed:

- children called `wait_agent` and attempted `close_agent` on **sibling scouts**,
  and emitted commentary about other agents — i.e. they behaved as orchestrators;
- parent received **no findings and no final answers**;
- `wait_agent` timed out at 30s / 60s / 90s / 180s;
- `list_agents` showed children going `running` → `shutdown`;
- `close_agent` returned `"thread <id> not found"`;
- child turns ended with `reason: "interrupted"`.

Reporter's expectation, verbatim:
> "A child spawned with `fork_turns: \"none\"` and a self-contained read-only
> prompt should treat that prompt as the active task and should not start
> coordinating sibling agents unless explicitly instructed."

Stated impact: "breaks parallel repo scouting and delegated planning workflows."

This is a **field report, not a vendor spec** — teach it as "this is what the
failure looks like and why you write the boundary explicitly," not as "Codex is
broken."

## F7 (S5, S6) — Claude Code's three orchestration primitives

- **Subagents** — each has its own context window, prompt, and tool permissions.
- **Agent Teams** — experimental; multiple Claude Code sessions on a shared
  project, one acting as team lead, coordinating through git; agents claim
  tasks and merge continuously.
- **Dynamic Workflows** — research preview announced **2026-05-28**; a JavaScript
  script that orchestrates subagents; Claude writes the script, a separate
  runtime executes it in the background.

First-hand (S6) contract details observed in this harness on 2026-07-25:
- A subagent spawned as a **fork inherits the parent's full conversation
  context and always runs on the parent's model**; any model override is
  ignored. A non-fork subagent starts **fresh**.
- Workflow scripts expose `pipeline(items, ...stages)` (no barrier between
  stages — item A can be in stage 3 while item B is in stage 1) versus
  `parallel(thunks)` (a **barrier** — awaits everything before returning).
- Concurrency in that runtime is capped at `min(16, cpu_cores - 2)` per
  workflow; excess calls queue. Lifetime agent cap 1000.
- Per-agent `isolation: 'worktree'` gives an agent its own git worktree —
  described as expensive (~200–500ms setup + disk each) and justified **only**
  when agents mutate files in parallel and would otherwise conflict.

Note the convergence worth teaching: **both** vendors expose the same three
knobs — role/model/effort, context inheritance (fork vs fresh), and a spawn
depth/permission boundary. The knob names are 07/2026 detail; the three knobs
are the durable idea.

---

## Claims seen in circulation that this digest could NOT verify

Do not put these in a course:

- Any specific **default concurrency number** for Codex subagents (e.g. "4").
  Not found in S4 or the issue tracker.
- A published **benchmark comparing "agent graph/committee" vs "single agent
  org"** on coding, with graph winning verification and single winning
  coherence. Searched; found framework marketing and general orchestration
  surveys, **no such benchmark**. The *idea* may be sound but there is no
  number to cite — teach it as a design heuristic, explicitly labelled as
  judgement, or leave it out.
- Any claim that Claude 5 models "natively hand off" work without a harness.
  What is verified is that the **harness** exposes spawn/fork primitives (F7);
  the model calls a tool. That distinction is the whole safety argument.
