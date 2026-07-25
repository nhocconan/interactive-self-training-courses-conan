# Digest — "The new rules of context engineering for Claude 5 generation models"

**Source:** https://claude.com/blog/the-new-rules-of-context-engineering-for-claude-5-generation-models
**Author:** Thariq Shihipar, Member of Technical Staff, Anthropic
**Published:** 2026-07-24 · Categories: Claude Code, Agents
**Digested:** 2026-07-25 · Verified by fetching the article (not paraphrase)
**Distribution:** PUBLIC — official vendor blog, no client data.

---

## F1 — The headline number (quote-level fidelity)

> Anthropic "removed over 80% of Claude Code's system prompt for models like
> Claude Opus 5 and Claude Fable 5 with no measurable loss on our coding
> evaluations."

Scope limits that MUST travel with the number when taught:
- It is **Anthropic's own internal coding evaluations**, not a public benchmark.
- It is about **Claude Code's system prompt**, i.e. a product-level system prompt
  written by the model vendor — not about a user's CLAUDE.md.
- "No measurable loss" ≠ "improvement". The claim is *neutral eval delta*.

## F2 — The framing: "unhobbling"

Anthropic found they were **overconstraining** Claude Code "both through our
system prompt and in our CLAUDE.md files and skills."

Named mechanism of harm — **conflicting overlapping guidance**. Their own example:
"leave documentation as appropriate" vs "DO NOT add comments" appearing
simultaneously in system prompt, skills, and the user request. Consequence:
"Claude must think more carefully about these overlapping and conflicting
messages before deciding what to do."

→ The cost of extra context is not only tokens; it is **adjudication load**.

## F3 — Five Then → Now transitions (verbatim structure)

| # | Then | Now |
|---|---|---|
| 1 | Give Claude rules | Let Claude use judgement |
| 2 | Give Claude examples | Design interfaces |
| 3 | Put it all upfront | Use progressive disclosure |
| 4 | Repeat yourself | Simple tool descriptions |
| 5 | Memory in CLAUDE.md files | Auto-memory |

Per-transition detail:

**1. Rules → judgement.** Old text quoted in the article: "In code: default to
writing no comments. Never write multi-paragraph docstrings or multi-line
comment blocks — one short line max." New text: "Write code that reads like the
surrounding code: match its comment density, naming, and idiom." Rationale given:
newer models have superior judgement and don't need guardrails older models did.

**2. Examples → interfaces.** Finding quoted: "giving examples actually
constrains them to a certain exploration space." New strategy: invest in tool
design — parameter expressiveness and interface clarity — instead of usage
examples. Article's example: the Todo tool, where a status **enumeration**
(pending / in_progress / completed) "hints to Claude about how to use it."

**3. Upfront → progressive disclosure.** Old: code-review and verification detail
loaded into the system prompt immediately. New: move them into **separate skills**
Claude selectively calls. Related technique named: **deferred loading** of tools —
the agent searches for full tool definitions (ToolSearch) before using them,
preventing unnecessary context consumption.

**4. Repeat yourself → simple tool descriptions.** Earlier models sometimes needed
repeated instructions / responded better to end-of-context guidance. Change:
delete redundant examples; consolidate tool-usage instructions **into the tool
description** rather than the system prompt.

**5. CLAUDE.md memory → auto-memory.** Old practice: users manually saved memories
with the `#` hotkey into CLAUDE.md. New: "Claude now automatically saves memories
that are relevant to the work and to you."

## F4 — Specs are becoming richer than markdown

Then: "simple markdown files with plans", specs stored in the codebase.
Now: Claude can reference "increasingly more complicated references" including
**HTML artifacts** created by the artifacts feature, and code-based
specifications — a **test suite**, or a **function to port**.
New concept named: **rubrics** — enabling Claude to verify quality standards by
"using dynamic workflows and spinning up verifier agents with those rubrics."

## F5 — The four-layer application framework (article's own layering)

- **System prompt** — product-context specific; heavily tied to what product
  Claude operates in.
- **CLAUDE.md** — keep "lightweight and briefly describe what your repo is for";
  spend tokens on **"gotchas inside of the codebase."** Avoid stating obvious
  information Claude can derive from the file structure. Use progressive
  disclosure heavily.
- **Skills** — "lightweight guides to let Claude find information when needed."
  Avoid overconstruction except in critical areas. For long skills, "divide it
  into many files and split them out." Best when skills "encode particular
  opinions, knowledge, or best practices that are particular to you, your team,
  or product."
- **References** — use `@` mentions for in-depth information; "generally you
  should prefer files that are in code" because they give "clear, high-fidelity
  instructions to Claude in a language it knows very well."

## F6 — Tooling

`claude doctor` (in Claude Code: `/doctor`) — introduced to "help you do this
automatically" when simplifying context engineering.

---

## What the article does NOT say (guard rails for the course)

These are absences verified by reading the article, and they are where the
course must add its own delta rather than paraphrase:

- It does **not** say to remove authorization, approval gates, or hard safety
  bounds. The judgement-over-rules argument is made about **style/craft**
  guidance (comments, idiom), not about permissions or irreversible actions.
- It gives **no method for deciding what to cut** beyond "avoid the obvious" —
  no ablation protocol, no eval-before-and-after procedure. The "80%" was
  validated by Anthropic's evals; a reader with no eval has no equivalent
  safety net.
- It gives **no cost/latency numbers** (cache, tokens, registry size).
- It does **not** cover multi-source conflict auditing as a procedure — it names
  the conflict problem (F2) but not how to find conflicts in your own stack.
