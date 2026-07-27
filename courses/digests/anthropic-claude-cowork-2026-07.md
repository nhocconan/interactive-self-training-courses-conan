# Anthropic · Claude Cowork — source digest

Verified against official Anthropic/Claude sources on 2026-07-26. Cowork is
evolving quickly, including beta surfaces; the course must date capabilities
and avoid claiming that every plan, tenant, or device has the same feature set.

## Key concepts & definitions

- **Chat vs Cowork.** Anthropic describes Cowork as the surface for handing
  Claude a real task across files and tools. The user chooses the folders and
  tools; Claude works end-to-end and returns work for review. Regular Chat is
  conversational and does not directly work in chosen local folders.
  Source: https://claude.com/product/cowork
- **Outcome-to-deliverable loop.** Cowork analyzes the request, creates a plan,
  can break complex work into subtasks and parallel workstreams, then delivers
  outputs for preview/download. This uses Claude Code's agentic architecture
  for knowledge work without requiring a terminal.
  Source: https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
- **Starting Cowork.** Chat and Cowork share the Claude home. On supported
  surfaces, select Cowork near the message box and describe the task. Desktop
  is the fullest experience because it can reach local files and a browser.
  Source: https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
- **Remote sessions.** Cowork sessions run remotely by default in the current
  beta rollout. Work can continue in the background and sessions can move
  between surfaces. Reaching local files, local connectors, browser, or
  computer use still depends on the desktop app being open and the relevant
  permissions.
  Sources:
  - https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
  - https://support.claude.com/en/articles/14479288-claude-cowork-architecture-overview
- **Projects.** Cowork can start from a Project and use Project knowledge as
  context. Projects tied to local folders are desktop-only, and Cowork does not
  automatically write its outputs back into Project contents; the user must add
  what should be retained.
  Source: https://support.claude.com/en/articles/15520349-use-claude-cowork-on-web-desktop-and-mobile
- **Tool preference.** For computer work, Anthropic documents the preference
  order as connector first, browser second, screen interaction third.
  Connectors are faster and more reliable; direct screen interaction is slower
  and more error-prone.
  Source: https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork
- **Read vs write tools.** Read tools expose information; write tools change
  the environment. Write tools have higher downside. The appropriate level of
  human oversight rises with sensitivity and irreversibility.
  Source: https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
- **Prompt injection.** Untrusted websites, email, files, MCPs, and plugins can
  contain instructions crafted to manipulate the agent. Isolation constrains
  where code runs; it does not make everything the agent reads trustworthy or
  make every action safe.
  Source: https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
- **Permissions and deletion.** Cowork provides approval modes. Anthropic
  recommends manual approval for sensitive accounts/sites, unfamiliar tools,
  and actions that are hard to undo. Permanent file deletion always asks for
  explicit permission, but that is not a reason to grant a broad folder.
  Source: https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
- **Current memory/sharing limits.** Chat memory does not automatically carry
  into Cowork; Cowork memory is supported inside Projects. Cowork sessions are
  not shareable; some artifacts/plugins are desktop-only.
  Source: https://support.claude.com/en/articles/13345190-get-started-with-claude-cowork
- **Computer use.** Computer use is a research preview for eligible Pro/Max
  users on desktop. It can click, type, and navigate apps; there is no sandbox
  between the agent and what is visible on screen. The user should begin with
  low-stakes tasks, block sensitive apps, and monitor actions.
  Sources:
  - https://support.claude.com/en/articles/14128542-let-claude-use-your-computer-in-cowork
  - https://support.claude.com/en/articles/13364135-use-claude-cowork-safely
- **Scheduled tasks.** Scheduled Cowork tasks run remotely for paid plans and
  can use configured connectors, skills, and plugins. They cannot be tied to a
  local computer folder. Each run should be reviewed; sensitive data,
  messages, purchases, and hard-to-undo actions are poor unattended tasks.
  Sources:
  - https://support.claude.com/en/articles/13854387-schedule-recurring-tasks-in-claude-cowork
  - https://support.claude.com/en/articles/13364135-use-claude-cowork-safely

## Figures worth recreating

1. **Cowork access map.** Remote sandbox in the center; gated bridges to
   connected services, local folder, browser, and desktop apps. Point:
   isolation and authorization are different controls.
2. **Tool preference ladder.** Connector → browser → computer use, annotated
   with reliability decreasing and manual oversight increasing.
3. **Risk plane.** X-axis sensitivity of what Claude can read; Y-axis
   irreversibility of what Claude can do. Manual approval/close monitoring
   occupies the high-high quadrant.
4. **Folder boundary.** One dedicated working folder with input/working/output
   versus an entire home/company drive. Point: narrow access limits blast
   radius and simplifies review.
5. **Scheduled-task circuit breaker.** Instruction → run → output review →
   keep/edit/pause; hard stops for messages, purchases, credentials, and
   consequential changes.

## Worked examples with real numbers

- The official safety guide recommends a dedicated working folder instead of
  broad access. The course implements this with exactly three illustrative
  subfolders: `00_INPUT`, `10_WORKING`, and `90_OUTPUT`.
- A first computer-use pilot runs **one low-stakes task**, with **manual
  approval**, on **one permitted app**, then records unexpected navigation and
  corrections before allowing a second run. These are course guardrails, not
  Anthropic limits.
- A schedule-graduation lab requires **3 supervised successful runs** before
  converting a workflow to unattended recurrence. This is an instructional
  policy, not a platform guarantee.

## Relevance hooks

- Marketing: gather approved campaign files, draft a deck, and write only into
  the output folder.
- Operations: read a connected tracker, flag overdue items, and produce a
  report without sending messages automatically.
- HR: synthesize onboarding materials from an approved Project; keep candidate
  and medical information out of the accessible folder.
- Finance: format a copied workbook in a working folder; never expose banking
  portals or schedule purchases.
- Executive support: build a briefing from trusted connected sources and list
  conflicts/open questions for the human to resolve.
