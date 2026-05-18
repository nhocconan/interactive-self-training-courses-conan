# Architecture

## Stack

```
┌────────────────────────────────────────────────────────────────┐
│  Browser                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Next.js 16 App Router                                    │  │
│  │ ┌─────────────┐  ┌──────────────────────────────────────┐│  │
│  │ │ Public      │  │ (app) — authenticated shell          ││  │
│  │ │  /login     │  │  /dashboard   /courses   /courses/:s ││  │
│  │ └─────────────┘  │  /admin/*     /hr                    ││  │
│  │                  └──────────────────────────────────────┘│  │
│  └──────────────────────────────────────────────────────────┘  │
│                       ▲                  ▲                     │
│                       │ Server Actions   │ Route handlers      │
└───────────────────────┼──────────────────┼─────────────────────┘
                        │                  │
                        ▼                  ▼
                  Auth.js v5 ──── Prisma 6 ─── PostgreSQL 16
                        │                  │
                        ▼
                   ldapts (AD/LDAP)
```

## Why these choices

- **Next.js 16 App Router** — server components keep DB queries off the client;
  the proxy (formerly middleware) is the single place that decides auth.
- **Auth.js v5 (NextAuth)** — credentials provider with our own `authorize()`
  fallback chain: local hash first, then LDAP.
- **Prisma + Postgres** — typed schema, painless migrations, easy
  multi-instance deployment.
- **ldapts** — modern, promise-based LDAPv3 client; works with AD on Windows
  Server 2019 out of the box (plain LDAP, StartTLS, LDAPS).
- **Tailwind v4** — single CSS pipeline, design-token first via `@theme`.

## Authentication flow

1. User submits **identifier + password** to `/login`.
2. `auth.ts` → credentials provider:
   - Tries the local user store first (bcrypt compare).
   - If LDAP is enabled, falls through to `ldapAuthenticate()`:
     - Service-binds with `bindDN` / `bindPassword`.
     - Searches the directory for the user (`userFilter` template).
     - Re-binds as that user with the supplied password.
     - JIT-provisions or updates the local `User` row.
3. JWT session (`{ uid, role, source }`) sent as HTTP-only cookie.
4. `proxy.ts` blocks unauthenticated traffic and enforces role gates.

## Authorisation model

```
ADMIN  →  everything (catalog mgmt, user mgmt, LDAP, HR reports, security)
HR     →  reports + HR-relevant views (read-only by default)
USER   →  sees only courses granted via:
            • direct Enrollment, or
            • CategoryGrant covering that course's category
```

Two layers:

1. **Role gates** (`src/lib/guards.ts`) — `requireAdmin()` and `requireHR()`
   protect every Server Component / Server Action / Route Handler.
2. **Fine-grained RBAC** (`src/lib/rbac.ts`) — `hasPermission(role, key)`
   reads `RolePermission` rows that admins edit on `/admin/roles`. Use it
   inside a page or action to widen / narrow what HR can do without
   touching the route gate.

Course access:

- `canAccessCourse(userId, role, courseId)` — gate per page / API.
- `accessibleCourseIds(userId, role)` — bulk lookup for catalog views.

Site security:

- `getSiteSecurity()` returns the cached singleton, used by `auth.ts` to
  configure the lockout module and by `actions.ts` to enforce password
  policy and email-domain allowlists.

## Course content & progress

A course's content can be any of seven kinds (see `CourseKind` enum):

| Kind            | Storage                                  | Player route                |
|-----------------|------------------------------------------|-----------------------------|
| `HTML`          | File under `COURSES_DIR`                 | `/courses-html/[slug]`      |
| `VIDEO_FILE`    | Upload under `COURSE_ASSETS_DIR`         | `/courses-asset/[file]`     |
| `VIDEO_EMBED`   | External URL (`embedUrl`)                | provider iframe             |
| `PDF`           | Upload under `COURSE_ASSETS_DIR`         | `/courses-asset/[file]`     |
| `PPTX` / `PPT`  | Upload + Office Online viewer            | Office Online iframe        |
| `SLIDES_GOOGLE` | External URL (`embedUrl`)                | docs.google.com iframe      |
| `MARKDOWN`      | Inline `contentMd`                       | rendered in-app             |

Both `/courses-html/[slug]` and `/courses-asset/[file]` are authenticated
route handlers that resolve the requested file inside a strict root,
reject path traversal, and check `canAccessCourse()` before responding.
Video files support HTTP Range so `<video>` can seek.

The viewer (`CourseContent.tsx`) chooses the right player by `kind`:

- HTML — sandboxed iframe, scroll-based progress, plus
  `window.postMessage({type:"lms:progress", percent})` opt-in.
- Video file — `<video>` `timeupdate` event drives `percent`.
- All other kinds — learner clicks **Mark complete** when finished.

In every mode, debounce-save (`/api/progress`) upserts `CourseProgress`
and stamps `completedAt` when `complete` is true or `percent ≥ 100`.

## Data model (highlights)

See `app/prisma/schema.prisma` for the full schema.

```
User ─┬─< Enrollment >─ Course >─ Category
      ├─< CategoryGrant >─ Category
      ├─< CourseProgress >─ Course
      ├─< QuizAttempt >─ Quiz
      ├─< Certificate >─ Course | LearningPath
      └─< LearningPathEnrollment >─ LearningPath >─< LearningPathStep >─ Course

Course      has kind ∈ CourseKind, htmlPath, contentUrl, embedUrl, contentMd
Permission  ─< RolePermission (Role enum × Permission)
LdapConfig   (singleton row id=1)         — incl. subtreeOUs, syncEnabled
SiteSecurity (singleton row id=1)         — password policy, lockout, ACLs
SiteSetting  (singleton row id=1)         — site name, logo, defaults
AuditLog     (every admin/HR mutation, with before/after diff)
```

## Folder layout

```
app/src
├── auth.ts            NextAuth instance + JWT/session callbacks
├── proxy.ts           Edge-level auth + role gate (Next 16 name for middleware)
├── lib/
│   ├── prisma.ts / ldap.ts / access.ts / guards.ts / audit.ts
│   ├── password.ts  / login-lockout.ts / site-security.ts
│   ├── rbac.ts        permission catalog + hasPermission()
│   ├── course-content.ts  upload constants + embed-URL normaliser
│   ├── notifications.ts / certificate.ts / quiz.ts
│   └── ai/            adapter, registry, anthropic|openai|gemini
├── components/        Design-system primitives + nav + viewer
└── app/
    ├── login/         Public login page
    ├── (app)/         Authenticated shell (uses route group)
    │   ├── dashboard/
    │   ├── courses/[slug]/  CourseContent.tsx (multi-format)
    │   ├── admin/
    │   │   ├── users/ courses/ categories/ quizzes/ paths/
    │   │   ├── ldap/          server config
    │   │   ├── ldap/sync/     sub-tree picker + nightly sync
    │   │   ├── ai/ announcements/ audit/
    │   │   ├── reports/       org analytics dashboard
    │   │   ├── roles/         RBAC matrix
    │   │   └── security/      site security
    │   ├── paths/ profile/ hr/
    ├── courses-html/[slug]/route.ts    Auth-gated HTML server
    ├── courses-asset/[filename]/route.ts  Auth-gated upload server (+Range)
    ├── api/auth/[...nextauth]/route.ts
    ├── api/progress/route.ts
    ├── api/admin/ldap/test/route.ts
    └── api/admin/course-upload/route.ts
```

## Deployment topology

- **Single container** (`app/Dockerfile`) → reverse-proxy or behind Cloudflare.
- **Postgres** as a managed service or sibling container.
- **Courses directory** is bind-mounted read-only into the container
  (`./courses:/courses:ro`), so HTML authoring is decoupled from app deploys.
- **Uploaded assets** live under `COURSE_ASSETS_DIR` (default
  `../course-assets`). Mount this as a writable volume in production
  (network share is fine — files are streamed, not loaded into memory).
- The asset route supports HTTP Range, so a single backend can serve
  large video files without a CDN; put one in front when you outgrow that.
