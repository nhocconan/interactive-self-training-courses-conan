# Demo Learning Portal — Design System

> Format: **Google Stitch v1**. This document is the canonical source of truth
> for the visual system; tokens here map 1:1 to CSS variables in
> `app/src/app/globals.css`.

---

## 1 · Brand essence

- **Product**       Demo Learning Portal — internal LMS for 500-person enterprise
- **Brand parent**  Demo Group (demo.com)
- **Voice**         Confident, modern, pragmatic. Speaks Vietnamese & English.
- **Mood words**    Crisp · Energetic · Trusted · Tech-forward
- **One-liner**     “Grow your craft, one course at a time.”

## 2 · Design principles (Stitch)

| # | Principle              | What it means here                                                 |
|---|------------------------|--------------------------------------------------------------------|
| 1 | Content first          | Each course HTML is the hero. Chrome must never compete with it.   |
| 2 | Confident negative space | Generous gutters, large card padding, single-column reading flows. |
| 3 | One bold accent        | Coral-red is reserved for the single most important action.        |
| 4 | Earned motion          | Animate only state changes the user caused; never decorative loops.|
| 5 | System theme by default | Light & dark are equal citizens; never style only one side.        |
| 6 | Inclusive by default   | WCAG AA contrast, 44-px touch targets, focus rings always visible. |

## 3 · Colour palette

### 3.1 Brand swatches (immutable)

| Token              | Hex        | Use                                       |
|--------------------|------------|-------------------------------------------|
| `--brand-coral`    | `#EA403F`  | Brand accents, gradients, primary CTA on dark |
| `--brand-red`      | `#D82827`  | Primary CTA (light), key emphasis         |
| `--brand-gold`     | `#FFE14E`  | Highlights, success ribbons, illustrations|
| `--brand-navy`     | `#0B1020`  | Ink (light mode foreground)               |

### 3.2 Semantic tokens

| Token                       | Light       | Dark        | Usage                              |
|-----------------------------|-------------|-------------|------------------------------------|
| `--background`              | `#FFFFFF`   | `#0A0D18`   | Page background                    |
| `--foreground`              | `#0B1020`   | `#E7E9F1`   | Body text                          |
| `--card`                    | `#FFFFFF`   | `#11141F`   | Card / surface                     |
| `--muted`                   | `#F4F5F8`   | `#161A27`   | Subtle surface, table headers      |
| `--muted-foreground`        | `#5B6478`   | `#9AA3B8`   | Secondary text                     |
| `--border`                  | `#E6E8EE`   | `#232938`   | Hairline borders, dividers         |
| `--primary`                 | `#D82827`   | `#FF4F4D`   | CTA, links, focus ring             |
| `--primary-foreground`      | `#FFFFFF`   | `#0A0D18`   | Text on `--primary`                |
| `--accent`                  | `#FFE14E`   | `#FFE14E`   | Highlights, ribbons                |
| `--success` / `--warning` / `--danger` | `#15A37A / #D97706 / #DC2626` | `#2DD4A8 / #FBBF24 / #F87171` | Status |

### 3.3 Contrast guarantees

- Body text on background: ≥ 7.0 (AAA)
- Muted-foreground on background: ≥ 4.5 (AA)
- Primary-foreground on primary: ≥ 4.5 (AA)

## 4 · Typography

- **Family**     Inter (variable, loaded via `next/font`)
- **Display**    Inter, weight 700, tracking `-0.025em`
- **Body**       Inter, weight 400–500, line-height 1.55
- **Numeric**    `font-variant-numeric: tabular-nums` on metrics

| Role        | Size / Line-height | Weight | Notes                          |
|-------------|--------------------|--------|--------------------------------|
| `display-1` | 48 / 52 px         | 700    | Login hero                     |
| `h1`        | 36 / 40 px         | 700    | Page title                     |
| `h2`        | 18 / 24 px         | 600    | Section headings               |
| `h3`        | 16 / 22 px         | 600    | Card titles                    |
| `body`      | 14 / 22 px         | 400    | Default                        |
| `small`     | 12 / 16 px         | 400    | Meta, captions                 |
| `eyebrow`   | 11 px, +1px tracking | 600  | Uppercase section labels       |

## 5 · Spacing & layout

- Base unit: **4 px**.
- Max content width: **1280 px** (`max-w-7xl`).
- Page horizontal padding: 16 / 24 / 32 px (mobile / tablet / desktop).
- Card padding: 20–28 px. Card radius: **16 px** (`rounded-2xl`).
- Section vertical rhythm: 32 px between sections, 16 px within.

## 6 · Components (the kit)

| Component        | Variants                              | File                                 |
|------------------|---------------------------------------|--------------------------------------|
| Button           | `primary` `outline` `ghost` `subtle` `danger`; sizes `sm` `md` `lg` | `components/ui.tsx`        |
| Input / Textarea / Select | default + focus ring                 | `components/ui.tsx`                  |
| Card             | rounded, soft shadow                  | `components/ui.tsx`                  |
| Badge            | `neutral` `primary` `success` `warning` `danger` | `components/ui.tsx`        |
| ProgressBar      | gradient fill, 6 px height            | `components/ui.tsx`                  |
| ThemeToggle      | radio-pill: light / system / dark     | `components/theme-toggle.tsx`        |
| Nav              | sticky, glassy, role-aware            | `components/nav.tsx`                 |
| CourseCard       | gradient header, progress, badges     | `components/course-card.tsx`         |
| CourseViewer     | iframe + auto-scroll progress         | `app/(app)/courses/[slug]/CourseViewer.tsx` |

## 7 · Motion

- Hover lift on cards: `translateY(-2px)` over 180 ms.
- Progress bar fill: 200 ms ease.
- Theme switch: instant (transitions disabled to prevent flicker).
- No infinite/decorative animation anywhere.

## 8 · Iconography

- **Library:** `lucide-react`
- **Stroke:** 1.75 px, currentColor.
- **Sizes:** 14 px in nav rows, 16 px in body, 20 px in tiles.

## 9 · Imagery & illustration

- No stock photography on internal pages.
- Course thumbnails are **generated gradients** keyed off each category’s colour
  — keeps the catalog visually rich without sourcing art.
- The login screen uses a soft radial-mesh background using brand colours.

## 10 · Tone of voice (copy)

- Direct, action-oriented. (“Mark complete”, not “Click here to mark this course as complete”.)
- Friendly Vietnamese-first context where appropriate (e.g. login tip).
- Never apologise for system limitations; offer the next action instead.

## 11 · Accessibility checklist

- ☑️ All controls reachable by keyboard.
- ☑️ Focus ring uses `--ring` (2 px + 2 px offset).
- ☑️ Forms have `<label>` linked via `htmlFor`.
- ☑️ Tables use `<thead>`/`scope`-correct semantics.
- ☑️ Theme switch is `radiogroup` with `aria-checked`.

## 12 · Files & tokens map

```
DESIGN.md (this file)            ← human-readable system
app/src/app/globals.css          ← CSS variables = tokens
app/src/components/ui.tsx        ← primitives
app/src/components/nav.tsx       ← AppShell
```

## 13 · Change log

- `2026-05-17` v1.0 — initial system (extracted from demo.com,
  consolidated into Stitch format).
