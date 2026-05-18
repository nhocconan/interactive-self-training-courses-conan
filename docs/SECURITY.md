# Site security

The **Site security** page (`/admin/security`) is the single source of
truth for the runtime security posture. Settings are persisted in the
`SiteSecurity` singleton row and read through a 60-second in-process
cache so the hot path stays fast.

## What you can configure

### Password policy
| Setting              | Default | Notes                                                  |
|----------------------|---------|--------------------------------------------------------|
| Minimum length       | 10      | Clamped to ≥ 8. Applies to LOCAL passwords only.       |
| Min character classes| 3 of 4  | Lower / upper / digit / symbol.                        |
| Max age (days)       | 0       | 0 disables rotation. Future P2: forces a reset prompt. |

LDAP users inherit their directory's policy. The portal never stores
their password.

### Brute-force protection
| Setting              | Default | Notes                                              |
|----------------------|---------|----------------------------------------------------|
| Max consecutive failures | 8   | Per-identifier counter, reset on success.          |
| Lockout duration (min)   | 5   | Cooldown after the threshold.                      |

Lockout state is in-process (`src/lib/login-lockout.ts`). For multi-replica
deployments, back it with Redis — the seam is small.

### Sessions
| Setting                       | Default | Notes                                |
|-------------------------------|---------|--------------------------------------|
| Idle session timeout (min)    | 0       | 0 = follow the Auth.js JWT default (24 h). |
| Admin re-auth window (hours)  | 8       | Reserved for P2 sudo-mode flows.     |

### Access controls
| Setting                  | Default | Notes                                                 |
|--------------------------|---------|-------------------------------------------------------|
| Allowed email domains    | —       | Comma-separated. Restricts both local sign-up and LDAP provisioning. |
| Admin IP allowlist (CIDR)| —       | Comma- or newline-separated. Enforced at the proxy.   |
| Force HSTS               | ☑️      | Adds `Strict-Transport-Security` in production.       |

## How it flows

```
Login request
    │
    ▼
auth.ts.authorize()
    │
    ├── getSiteSecurity()        ← cached, 60 s TTL
    ├── configureLoginLockout()  ← updates module thresholds
    ├── isLockedOut(identifier)? → reject
    ├── local bcrypt check OR LDAP bind
    │       └── isEmailDomainAllowed(email)? → reject if not
    ├── recordLoginSuccess() / recordLoginFailure()
    ▼
JWT issued
```

Password creation flows (`createLocalUser`, `resetUserPassword`) call
`validatePassword(pwd, { minLength, minClasses })` with the live policy.

## Audit

Every save to `SiteSecurity` writes an `audit.update` entry (action key
`security.update`) with a before/after diff. View it at `/admin/audit`.

## Threat-model checklist

- ✅ Credential timing — `auth.ts` runs a dummy bcrypt compare on missing
  users.
- ✅ Path traversal — `/courses-html/[slug]` and `/courses-asset/[file]`
  reject any resolved path that escapes the configured root.
- ✅ Cross-frame breakout — HTML course iframes carry a tight sandbox; no
  `allow-top-navigation`.
- ✅ Tenant isolation — all DB queries are scoped by `userId` or `role`;
  there is no global "read all" code path outside admin guards.
- ⏳ Per-replica lockout (Redis) — see P2 roadmap.
- ⏳ Passkeys / WebAuthn — P3.
