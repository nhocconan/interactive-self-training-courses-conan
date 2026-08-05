# OpenAI · ChatGPT Work — source digest

Verified against official OpenAI sources on 2026-07-26; refreshed 2026-08-05
(help pages for Sites, Work & Codex, file creation, company knowledge, and MCP
apps were all updated by OpenAI between Jul 30 and Aug 2, 2026). Product
availability, labels, plan limits, and workspace controls can change; the
course must date these claims and tell learners to check their own account.

## Key concepts & definitions

- **Chat vs Work vs Codex.** OpenAI describes Chat as the fast conversational
  surface; Work as an agent for longer, multi-step work and finished
  deliverables; Codex as the dedicated software-development surface.
  Source: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- **Typical Work outputs.** Official examples include research, analysis,
  documents, spreadsheets, presentations, reports, and Sites. A useful task
  brief supplies the desired outcome, source material, constraints, and review
  criteria, then reviews and revises the result.
  Sources:
  - https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
  - https://openai.com/academy/how-to-use-chatgpt-work-for-everyday-tasks/
- **Deep Research is a separate research surface.** It plans and synthesizes
  a complex question into a documented report, lets the user choose/restrict
  sources, and returns citations/source links. Connected apps are read-only
  during Deep Research. Use it when the desired deliverable is an evidence-rich
  research report; use Work when the job continues into broader file/app work
  or multiple deliverables.
  Source: https://help.openai.com/en/articles/10500283-deep-research-in-chatgpt
- **Creating editable files.** Work can create/edit documents, spreadsheets,
  presentations, reports, and analyses from instructions, source material, or
  a reference/template. Native Google Docs/Sheets/Slides require the relevant
  Google Workspace app. Direct control of an open Microsoft Excel workbook is
  documented through Codex with the ChatGPT for Excel add-in; PowerPoint is
  not part of that direct Work desktop flow, but a separate ChatGPT for
  PowerPoint add-in is GA for Business workspaces (since 2026-07-06).
  Source: https://help.openai.com/en/articles/20001278-creating-and-editing-documents-spreadsheets-and-presentations-with-chatgpt-work
- **Surfaces and file access.** Work launched 2026-07-09 on web/mobile for all
  paid plans except Free and Go; since 2026-07-23 it is ON by default for
  Enterprise/Edu workspace members unless an admin disables it. Admin toggles
  are granular (separate Work Cloud / Work Local / Codex Local; workspace
  Models settings for starting model, reasoning level, Fast Mode). Desktop Work
  can use a local folder and desktop apps when permission is granted. Web/mobile
  cannot directly read local computer files. Cloud Work chats sync across
  web/mobile/desktop; local chats remain on the computer. The desktop app has a
  global ChatGPT↔Codex switcher, a Chat/Work toggle, unified Recents, and
  Projects (since 2026-07-16). ChatGPT Classic does not get Work or Codex.
  Source: https://help.openai.com/en/articles/20001275-chatgpt-work-and-codex
- **Sites.** Work can create, preview, publish, and manage interactive websites
  and lightweight apps ("Sites") — hosting, access controls, storage, and
  database support included. Create from Work on ChatGPT web, or Work/Codex in
  the desktop app; say "website" in the prompt or mention `@Sites`. The flow:
  describe → private preview → iterate → deploy → Site URL. Every deployment
  URL is a production URL — save a version first, review, then deploy. A new
  Site is visible only to its owner and workspace admins until sharing is
  changed; tiers go selected users/groups → anyone in workspace → anyone on
  the internet (only where public publishing is enabled). Public beta for
  ChatGPT workspaces, Plus, and Pro; Business on by default; Enterprise
  requires admin enablement via RBAC with public publishing off by default;
  not on Free/Go and not in the EEA, Switzerland, or the UK at launch.
  Plan-specific usage limits are not published numerically. Deletion is
  irreversible. No PHI or payment-card data; selling only via a third-party
  payment processor.
  Sources:
  - https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites
  - https://learn.chatgpt.com/docs/sites
- **Skills and plugins.** The App Directory was replaced by the Plugin
  Directory on 2026-07-09. A plugin packages skills, apps, and app templates;
  a skill is a reusable packaged workflow invoked with `@` in ChatGPT (`$` in
  Codex). Skills are GA for Enterprise/Edu.
  Source: https://learn.chatgpt.com/docs/skills-and-plugins
- **Voice in Work.** ChatGPT Voice works inside Work and Codex on desktop only
  (macOS/Windows, with paired iOS remote access); standalone Voice in Work is
  not available on web or mobile. Voice uses the tools and permissions of the
  selected experience.
  Source: https://help.openai.com/en/articles/11391654-chatgpt-business-release-notes
- **Projects.** A Project keeps related chats, files, and project instructions
  together. Project instructions override global custom instructions inside
  that project. Projects can hold uploaded files and, where supported, links
  from apps such as Google Drive and Slack.
  Source: https://help.openai.com/en/articles/10169521-projects-in-chatgpt
- **Connected company knowledge.** On Business, Enterprise, and Edu, company
  knowledge can search across approved connected apps while respecting the
  user's existing permissions. Answers include citations to the source items.
  It is web-only (not supported in the desktop or mobile apps), and when
  explicitly selected it suppresses write actions — to use a write action,
  select the app directly. Custom MCP apps contribute search/fetch only.
  Sources:
  - https://openai.com/index/introducing-company-knowledge/
  - https://help.openai.com/en/articles/12628342-company-knowledge-in-chatgpt-business-enterprise-and-edu
- **Scheduled work.** Scheduled Tasks can run once, recur, or monitor for a
  meaningful change (notify only on change). A dedicated Scheduled page in the
  sidebar lists tasks with next-run times and supports pause/resume/edit/
  delete. Rolling out to Plus, Pro, Business, Enterprise; active-task limits
  vary by tier; tasks cannot run more than once per hour; unattended tasks may
  auto-pause after inactivity. Tasks can use uploaded files, connected tools,
  skills, and plugins available to that chat; web tasks have no local-folder
  access, desktop tasks can use local projects. Verify what a scheduled task
  can reach with a non-sensitive copy in the learner's own UI before relying
  on it.
  Sources:
  - https://help.openai.com/en/articles/10291617-tasks-in-chatgpt
  - https://learn.chatgpt.com/docs/automations
- **Cloud browser.** ChatGPT Work can use a remote cloud browser for supported
  public websites when an app cannot complete the task. At the documented
  launch state it cannot accept credentials, sign in, use autofill/password
  managers, or complete payments. It pauses for confirmation or stops at an
  unsupported step.
  Source: https://help.openai.com/en/articles/20001280-using-cloud-browser-in-chatgpt
- **Desktop built-in browser.** In the desktop app, the built-in browser can
  share a visible page with the user, work across tabs, and support richer
  signed-in browser tasks. Credentials belong in the browser, never in chat;
  the active account and site should be checked before allowing work.
  Source: https://help.openai.com/en/articles/20001277-using-the-built-in-browser-in-the-chatgpt-desktop-app
- **Apps and write actions vary.** Connected app capabilities depend on plan,
  workspace configuration, and the app. Full MCP write/modify support is in
  beta for Business and Enterprise/Edu, is web-only, and admins control
  publishing, access, and permitted actions. OpenAI-built apps were documented
  as search-only in the cited help page, so the course must not promise that
  every connector can edit.
  Source: https://help.openai.com/en/articles/12584461-developer-mode-and-mcp-apps-in-chatgpt

## Figures worth recreating

1. **Surface chooser.** Three columns: Chat (answer now), Work (multi-step
   deliverable), Codex (software). Rows: duration, tools/files, output, human
   review. Point: choose by work shape, not by which button looks advanced.
2. **Work task loop.** Outcome + sources + constraints + review bar → plan →
   work across tools → evidence/output → human review → revise/approve. Point:
   the deliverable and review criteria define "done."
3. **Context boundary.** Project context, connected apps, local folder, public
   web as separate rings with explicit access gates. Point: available context
   is not universal and permissions do not make a source trustworthy.
4. **Browser choice.** Connected app first; cloud browser for supported public
   pages; desktop built-in browser for visible/sign-in workflows; human takes
   over for credentials, payments, or consequential commitments.
5. **Schedule loop.** Fixed instruction → timed/triggered run → notification →
   evidence review → keep/edit/pause. Highlight the need to verify source
   availability in the learner's current account before scheduling.

## Worked examples with real numbers

- Project/file availability in Scheduled Tasks is a binary capability check
  before scheduling, not a prompt-quality problem. Test with a non-sensitive
  copy in the current account instead of relying on an older feature list.
- A practical non-sensitive pilot can use **3 runs** of the same weekly status
  task and log: minutes saved, number of factual corrections, number of format
  corrections, and whether every claim has a source. These are course-designed
  evaluation counts, not OpenAI performance claims.
- A folder-access lab uses exactly three folders: `00_INPUT`,
  `10_WORKING`, `90_OUTPUT`. These are illustrative course values, not product
  requirements.

## Relevance hooks

- Marketing: turn launch notes, approved claims, and a campaign sheet into a
  review-ready launch brief and deck.
- Operations: merge weekly tracker updates into an exception report with
  owners, due dates, and open questions.
- HR: produce an onboarding pack from approved policies while flagging
  conflicts instead of resolving them silently.
- Finance: analyze a copied, non-sensitive workbook and produce a variance
  memo; never schedule transfers or share credentials.
- Sales: compile a meeting brief from approved CRM/email sources, with every
  customer-specific claim linked back to evidence.
