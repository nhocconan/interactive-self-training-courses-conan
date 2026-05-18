# Tech Architecture

## 0 · Tenets

1. **One framework, end-to-end.** Next.js 16 App Router serves UI + API +
   background work. No microservices until they’re actually justified.
2. **Type the boundary.** Anything crossing process/network gets Zod schemas.
3. **DB is the source of truth.** App is stateless; horizontal scale is free.
4. **Boring stack, deep mastery.** Postgres + Prisma + Tailwind + Auth.js.
5. **Pluggable seams.** Auth providers, AI providers, notification channels —
   all behind small adapter interfaces so swapping is trivial.

## 1 · Component diagram

```
                    ┌───────────────────────────┐
                    │      Reverse proxy        │
                    │   (NGINX / Cloudflare)    │
                    └──────────────┬────────────┘
                                   │ HTTPS
                                   ▼
                    ┌───────────────────────────┐
                    │   Next.js 16 App (3940)   │
                    │                           │
                    │ ┌───────────────────────┐ │
                    │ │  Proxy (auth gate)    │ │
                    │ └─────────┬─────────────┘ │
                    │           ▼               │
                    │ ┌─────────┴─────────────┐ │
                    │ │  RSC pages + actions  │ │
                    │ │  /dashboard /courses  │ │
                    │ │  /admin/* /hr         │ │
                    │ └──┬───────┬────────────┘ │
                    │    │       │              │
                    │    │       └─ Route handlers (REST)
                    │    │            /api/*    │
                    │    ▼                      │
                    │ ┌────────────────────┐    │
                    │ │  service layer     │    │ ◀─── unit test boundary
                    │ │  access, ldap, ai, │    │
                    │ │  quiz, cert, audit │    │
                    │ └─────────┬──────────┘    │
                    │           ▼               │
                    │ ┌────────────────────┐    │
                    │ │   Prisma client    │    │
                    │ └─────────┬──────────┘    │
                    └───────────┼───────────────┘
                                ▼
                  ┌──────────────────────────────┐
                  │ Postgres 16 (3942, loopback) │
                  └──────────────────────────────┘
                                ▲
        ┌───────────────────────┼──────────────────────┐
        │                       │                      │
   AD / LDAP DC          AI providers           SMTP / Slack (P2)
  Windows 2019         OpenAI / Anthropic
                       / Gemini / custom
```

## 2 · Folder layout (where things live)

```
app/src/
├── auth.ts                Auth.js v5 instance, credentials + LDAP chain
├── proxy.ts               Edge gate (was middleware in pre-Next-16)
├── auth-route.ts          Handlers exported for /api/auth/[...nextauth]
├── lib/
│   ├── prisma.ts          DB client singleton
│   ├── ldap.ts            ldapts wrapper, JIT user provisioning
│   ├── access.ts          canAccessCourse, accessibleCourseIds, …
│   ├── guards.ts          requireAdmin / requireHR helpers
│   ├── audit.ts           audit log writer (single entry point)
│   ├── ai/
│   │   ├── adapter.ts     Provider-agnostic ChatCompletion interface
│   │   ├── openai.ts      OpenAI adapter (+model list)
│   │   ├── anthropic.ts   Anthropic adapter
│   │   ├── gemini.ts      Google adapter
│   │   ├── registry.ts    Picks the active provider for a feature
│   │   └── usage.ts       AiUsage logger
│   ├── quiz.ts            Pure scoring + validation
│   ├── certificate.ts     Generate + verify codes
│   ├── notifications.ts   In-app notification publisher
│   ├── i18n.ts            String table loader
│   └── utils.ts           Small generic helpers
├── components/            UI primitives + design system
├── components/learning/   Course viewer, quiz runner, cert preview, AI chat
└── app/
    ├── (public)/
    │   ├── login/
    │   └── verify/[code]/         ← certificate verification (no auth)
    ├── (app)/                     Authenticated shell
    │   ├── dashboard/
    │   ├── courses/[slug]/
    │   ├── paths/[slug]/
    │   ├── profile/
    │   ├── admin/
    │   │   ├── users/[id]/
    │   │   ├── courses/[id]?/
    │   │   ├── categories/
    │   │   ├── paths/
    │   │   ├── quizzes/
    │   │   ├── ai/                ← AI provider config
    │   │   ├── announcements/
    │   │   ├── audit/
    │   │   └── ldap/
    │   └── hr/
    ├── api/
    │   ├── auth/[...nextauth]/route.ts
    │   ├── progress/route.ts
    │   ├── quiz/[id]/route.ts
    │   ├── ai/chat/route.ts
    │   ├── ai/models/route.ts     ← lists models per provider
    │   ├── notifications/route.ts
    │   └── admin/                 ← ops endpoints (ldap/test, ai/test, …)
    └── courses-html/[slug]/route.ts  ← auth-gated static file server
```

## 3 · Auth pipeline

```
HTTP request ─▶ proxy.ts
                  │
                  ├─ public path? → next()
                  │
                  ├─ no session?  → redirect /login
                  │
                  ├─ /admin/*     → require role ADMIN, else /dashboard
                  ├─ /hr          → require HR|ADMIN, else /dashboard
                  │
                  └─ next()
```

Login flow:

```
POST /api/auth/callback/credentials
   ├─ authorize()
   │    ├─ local: prisma.user.findFirst + bcrypt.compare
   │    └─ if no match & LdapConfig.enabled:
   │         ldapAuthenticate() → JIT-upsert User
   ├─ jwt callback: { uid, role, source } → JWT
   └─ session cookie (HTTP-only, SameSite=Lax)
```

## 4 · AI adapter interface

```ts
// lib/ai/adapter.ts
export interface AiAdapter {
  id: string;                       // unique, e.g. provider+key fingerprint
  listModels(): Promise<AiModelInfo[]>;
  chat(req: ChatRequest): Promise<ChatResponse>;
}

export interface AiModelInfo { id: string; family: string; contextK?: number; }
export interface ChatRequest {
  model: string;
  messages: { role: "system"|"user"|"assistant"; content: string }[];
  temperature?: number;
  maxTokens?: number;
}
export interface ChatResponse {
  content: string;
  inputTokens?: number;
  outputTokens?: number;
  latencyMs: number;
}
```

Each concrete adapter (`openai.ts`, `anthropic.ts`, `gemini.ts`) implements
the interface, hits the provider’s `/models` endpoint for live list, and
records to `AiUsage` via `usage.ts`.

`registry.ts` returns the right adapter for a *feature key*
(`ai.chat`, `ai.quiz-generation`, `ai.summary`) — admins map features to
provider+model in `/admin/ai`.

## 5 · Data model (additions for P1.5)

Already present (P1.0): `User`, `Category`, `Course`, `Enrollment`,
`CategoryGrant`, `CourseProgress`, `LdapConfig`.

New for P1.5 (this build):

```
Quiz ─< Question
QuizAttempt ─< AnswerSnapshot
Certificate
LearningPath ─< LearningPathStep
AIProvider ─< AIModelChoice          (admin chooses model per feature)
AiUsage
Notification
Announcement
AuditLog
Skill ─< CourseSkill                  (P1 stub for tags-as-skills, full taxonomy P2)
```

(see `app/prisma/schema.prisma`.)

## 6 · Server actions vs route handlers

- **Server actions** — preferred for any mutation triggered from a form or
  button on the same page. Type-safe, no manual fetch wiring. Used for: user
  CRUD, course/category CRUD, grants, ai config, audit reads.
- **Route handlers** — used when the caller is an iframe / client component
  doing fire-and-forget JSON (progress save, quiz submit, AI chat stream).
- **Edge runtime?** App stays on Node runtime — Prisma + bcrypt + ldapts
  need it. We don’t need cold-start perf yet.

## 7 · Caching strategy (deliberately minimal)

- Pages render dynamic by default. Lists are cheap enough.
- We add `revalidatePath()` after every mutation so RSC trees re-fetch.
- Course HTML is cache-private 60 s in `/courses-html/[slug]/route.ts`.
- AI model list is cached per provider for 6 h in the DB (refreshable via UI).

## 8 · Observability

- Request log: structured JSON (route, status, duration, role).
- App log: `pino` (P2; today we use `console.*`).
- Audit log: write-only DB table; the source of truth for compliance.
- Optional OpenTelemetry hook in `instrumentation.ts` (P2).

## 9 · Deployment

- One container image (`app/Dockerfile`). Same image runs dev (`next dev`) and
  prod (`next start`).
- Postgres via managed service or a sibling container.
- Bind-mount `./courses` into the web container (read-only) so authors can
  push new HTML without rebuilding.
- Backups: nightly `pg_dump` (see `DEPLOYMENT.md`).

## 10 · Security checklist (live)

- [x] All non-public routes behind `proxy.ts`.
- [x] All mutating server actions call `requireAdmin()` / `requireHR()`.
- [x] All user input validated with Zod at the boundary.
- [x] `/courses-html/[slug]` rejects path traversal (`startsWith COURSES_DIR`).
- [x] CSP on iframe `frame-ancestors 'self'` blocks embed-jacking.
- [x] Bcrypt cost ≥ 10; passwords never logged.
- [x] LDAP bind password stored only in `LdapConfig` row; never echoed back.
- [x] AI provider API keys stored encrypted-at-rest (Postgres column with
      app-side AEAD using `AUTH_SECRET` as KEK).
- [ ] Rate limit on `/api/auth/*` and `/api/ai/*` (P2; today protected by
      Cloudflare/NGINX).

## 11 · Performance budget

| Metric (p95)               | Target  |
|----------------------------|---------|
| Login page TTFB            | 200 ms  |
| Dashboard TTFB             | 250 ms  |
| Course detail TTFB         | 250 ms  |
| Course HTML stream         | 500 ms  |
| Progress save round-trip   | 150 ms  |
| AI chat first-token        | 1.5 s   |
| JS sent to browser per route | < 200 KB gzipped |

Measured in dev with Lighthouse + `next dev --turbopack`. Prod numbers
should beat these on the same hardware.

## 12 · Migrations & upgrades

- `prisma migrate dev` during P1 (lossy iterations are fine while pre-prod).
- Switch to `prisma migrate deploy` once we have real user data.
- Next.js + React + Auth.js bumps happen in dedicated PRs, behind CI.
- Database column drops require a 2-deploy plan: stop writing → migrate →
  stop reading.
