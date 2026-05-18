# UI/UX Guidelines

Companion to `DESIGN.md`. `DESIGN.md` defines **what** the system is;
this file defines **how** to apply it. Bar is Atlassian / Google
Workspace / Bitrix24 — products people pay enterprise money for.

## 1 · Information density

- **Dashboard / catalog** — medium-dense; reveal action on hover, never
  hide it behind a menu the user has to discover.
- **Admin tables** — high-dense; one row per record, inline edits where
  safe.
- **Course viewer** — low-dense; the content is the product.
- Never display more than **7 ± 2** primary actions on one screen.

## 2 · Hierarchy

1. **Hero element** — one per screen. Page title or primary CTA.
2. **Section headings** — `h2`, 18 px, semibold.
3. **Card titles** — `h3`, 16 px.
4. **Body / meta** — 14 px / 12 px respectively.

Don’t use colour as the *only* signal; pair with weight, size, or icon.

## 3 · Motion

- Page transitions: instant (no fade).
- Card hover: 180 ms `translateY(-2px)` + shadow.
- Toast: 220 ms slide-in from bottom-right.
- Skeleton shimmer: 1.2 s loop while loading; never indefinite.
- Reduced-motion users: zero motion.

## 4 · Microcopy

- **Verb-first** buttons: “Mark complete”, “Generate quiz”, “Save changes”.
- Error messages: state **what happened**, then **what to do**. Never
  technical jargon to end users.
- Empty states: name **why** it’s empty, give **the next action**.
- Inline status: `Saved 12:42 PM` is better than `Auto-save active`.

## 5 · Status surfaces

Every async surface has one of these states:

| State        | Treatment                                                  |
|--------------|------------------------------------------------------------|
| Empty        | Illustrated card + primary CTA                              |
| Loading      | Skeleton blocks matching final layout, not a spinner        |
| Loaded       | The content                                                 |
| Error        | Inline alert with retry button                              |
| Saving       | Pill in the corner: `Saving…` / `Saved` / `Offline — will retry` |

## 6 · Forms

- Labels above inputs (never placeholder-as-label).
- Inline validation **on blur**; aggregate on submit.
- Submit button: primary; secondary always available (“Cancel”).
- Destructive submit: red, plus a confirm dialog with the exact name of
  the object to delete typed back.
- Keyboard: `⌘+Enter` submits any single-form page.

## 7 · Tables

- Sticky header.
- Sortable columns get a tiny arrow icon, default sort indicated.
- One **bulk-action row** appears when ≥ 1 row selected.
- Empty rows: 8 placeholders, not “No data” centred.
- Long values truncate with `title` tooltip.

## 8 · Modals / drawers

- Reserve modals for **decisions that can’t happen elsewhere**
  (destructive confirm, single-step input).
- Prefer **slide-in drawers** for forms with > 3 fields — content
  underneath stays in context.
- Close on Esc, click outside, and an explicit X.

## 9 · Command palette

- ⌘K opens it globally.
- Surfaces: courses, users (admin only), categories, navigation,
  actions (“Generate quiz from selected course”, “Create user”).
- First letter of any nav item is a keyboard shortcut hint
  (e.g. **D** → Dashboard) shown after the label.

## 10 · Accessibility

- All controls reachable by keyboard. Tab order follows the visual order.
- Focus ring: 2 px solid `var(--ring)` + 2 px offset.
- Colour contrast: AA minimum, AAA for body text.
- Icon-only buttons: `aria-label`.
- `prefers-reduced-motion: reduce` is respected globally.
- Forms always have a programmatically associated `<label>`.

## 11 · Internationalization

- All user-facing strings come from `@/lib/i18n` — never hard-coded.
- Use full sentences, not concatenated phrases — Vietnamese word order
  differs from English.
- Date/number formatting via `Intl.*` with the active locale.
- Truncation budget: 1.5× the EN length to absorb VN expansion.

## 12 · “Looks AI-generated” traps to avoid

We pay attention to these because they are the visual tells of cheap
work, and Demo’s bar is higher:

| Avoid | Do instead |
|---|---|
| Generic stock-photo hero | Brand-token gradient or sparse illustration |
| Identical card grids everywhere | Vary rhythm: hero card, then 3-up, then list |
| Centered hero text on every page | Left-aligned, content-led layouts |
| Random emoji as accent | Lucide icons, consistent stroke |
| “Lorem ipsum” copy or filler bullets | Real, role-specific copy in VN+EN |
| Endless purple/blue gradients | Demo coral-red, used sparingly |
| Heavy drop shadows everywhere | Soft layered shadow only on cards |
| Floating buttons everywhere | One primary action per surface |

## 13 · Component dos and don’ts

| Component | Do | Don’t |
|---|---|---|
| Button | Verb-first label, icon left | Sentence-case label, icon right of a 1-word verb |
| Card | Rounded 16 px, soft shadow, 20 px padding | Sharp corners or zero padding |
| Badge | Compact, rounded-full, colour-coded by tone | Multi-line, bordered, primary-colour by default |
| Input | Label above, helper below | Placeholder-as-label, helper inside the field |
| Toast | Bottom-right, 5 s auto-dismiss, dismiss button | Top-center, indefinite, no dismiss |
| Avatar | Initials in coral if no image, circle | Random pastel background |

## 14 · QA before merging UI

Run the relevant sections of `SELF-TESTING.md` (J — mobile / a11y).
Take **before / after** screenshots on **light + dark + mobile** and
attach to the PR.
