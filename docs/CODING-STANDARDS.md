# Coding Standards

These rules apply to every file we ship. They are not aspirational —
the CI gate enforces what it can; reviewers enforce the rest.

## 0 · Philosophy

- **Boring is good.** Pick the obvious solution; save cleverness for actual
  hard problems.
- **Delete > extend.** Removing complexity is the highest-leverage commit.
- **Type the boundary, trust the inside.** Validate at the edge; let the
  internal modules assume their inputs.
- **No half-finished implementations.** Either ship it or don’t merge it.

## 1 · TypeScript

- `strict: true` is non-negotiable.
- Prefer **`type`** for unions and primitives, **`interface`** for object
  shapes you expect to extend.
- Avoid `any`. If unavoidable, comment **why**.
- Public exports get an explicit return type.
- No `enum` — use string literal unions or Prisma enums.
- Imports: absolute via `@/`; never deep-relative (`../../..`).

```ts
// good
type Role = "USER" | "HR" | "ADMIN";

export async function canAccessCourse(
  userId: string,
  role: Role,
  courseId: string,
): Promise<boolean> { … }
```

## 2 · React / Next.js

- Default is a **Server Component**. Add `"use client"` only when you need
  state, event handlers, or browser APIs.
- A client component must not export server-only objects (DB clients, env
  reads, secrets).
- Data fetching: Server Components call `prisma.*` directly. Client
  components call route handlers via `fetch`.
- Mutations: prefer **Server Actions** for form submissions. Use route
  handlers for non-form JSON APIs (iframes, third-party callbacks).
- `params` and `searchParams` are **Promises** in Next 16 — always
  `await` them.
- Never block on `fetch()` in `layout.tsx`; cache or split into a child.

## 3 · Tailwind v4

- Use the **CSS-variable tokens** defined in `globals.css`
  (`var(--primary)`, `--card`, …) — never raw hex outside that file.
- Compose with `cn()` (`@/lib/utils`); don’t string-concatenate classes.
- Spacing: stick to Tailwind’s scale; don’t introduce arbitrary
  `mt-[13px]` unless you have a reason.
- Mobile-first. Always start with the small breakpoint and `sm:` /
  `md:` / `lg:` up.

## 4 · Naming

| Thing                   | Convention                            |
|-------------------------|---------------------------------------|
| Files (React)           | `kebab-case.tsx` for components       |
| Component identifiers   | `PascalCase`                          |
| Hooks                   | `useThing`                            |
| Server actions          | `verbObject` (`upsertCourse`)         |
| Route segments          | `lowercase-with-dashes`               |
| Constants               | `SCREAMING_SNAKE_CASE`                |
| Database tables         | `PascalCase` singular (`User`)        |
| Boolean fields          | `is…` / `has…` (`isActive`, `hasQuiz`)|

## 5 · Comments

- Default: **no comments**. Names should explain *what*.
- Only comment **why** when the code itself can’t tell you (hidden
  constraint, workaround, subtle invariant).
- Never reference the task / PR / issue number — that belongs in the
  commit message.

## 6 · Error handling

- Validate at every system boundary (HTTP, file, env) with Zod or a
  manual check.
- **Throw** inside library code; **return Response** in route handlers;
  **redirect** in pages.
- Never swallow errors silently. If you catch, you either log + rethrow
  or transform the error into a typed result.
- Avoid speculative `try/catch` around code that can’t fail.

## 7 · Database

- Schema changes are additive when possible. Renames go through:
  add new column → backfill → cut over → drop old.
- All queries route through `@/lib/prisma`. No standalone clients.
- Server actions wrap multi-step mutations in `prisma.$transaction`.
- N+1 is a bug. Use `include` / `select`, not loops.
- Soft-delete is opt-in per table. The default is hard delete; we have
  the audit log for accountability.

## 8 · Security

- **Never** log secrets, passwords, tokens, full LDAP bind strings.
- All authenticated routes must call `auth()` server-side and verify
  role at the page level — proxy is **defense in depth, not the gate**.
- Sanitise any path you load from the filesystem
  (`path.resolve` + `startsWith(BASE)` check).
- Set CSP on anything that renders user-controlled HTML (course
  iframes).
- Trust no `Origin` / `Referer` for state-changing operations — rely on
  same-site cookies + double-submit when needed.

## 9 · Performance

- Avoid client-side data fetching on first paint — push to Server
  Components.
- Don’t bundle big libraries client-side; if you must, dynamic-import
  with `ssr: false`.
- Images: `next/image` only; explicit `width`/`height`.
- Skeletons over spinners for any view that loads in > 200 ms.

## 10 · AI calls

- Always go through `@/lib/ai/registry.ts` — never call provider SDKs
  directly from a page.
- Always record an `AiUsage` row on success or failure.
- Cap the prompt size to a per-feature constant; truncate course HTML
  before sending.
- Stream when the UX benefits (chat); buffer when it doesn’t (summary).

## 11 · Tests

- Unit-test pure logic (`access.ts`, `quiz.ts`, `certificate.ts`,
  `ai/*.ts`).
- Integration-test API routes with a real DB (Docker `lms-db`).
- E2E with Playwright at the user-flow level (login → take quiz →
  see certificate).
- No `console.log` in tests; use `expect`.

## 12 · Git workflow

- One PR = one logical change. Aim for ≤ 400 changed lines.
- Conventional commit messages:
  - `feat:` user-visible change
  - `fix:` bug
  - `refactor:` no user-visible change
  - `docs:` doc only
  - `test:` test only
  - `chore:` tooling / deps
- Squash on merge; keep `main` linear.
- Never force-push to `main` or shared branches.

## 13 · Lint & format

- ESLint with `eslint-config-next` is the floor.
- Prettier — default settings, 100-column line width.
- CI fails on lint warnings (treat warnings as errors).

## 14 · Definition of Done

Every change must satisfy the **DoD** before merge — see
[`DEFINITION-OF-DONE.md`](./DEFINITION-OF-DONE.md).
