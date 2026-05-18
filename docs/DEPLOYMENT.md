# Deployment

## Modes

- **Dev** (`scripts/start-dev.sh`) — Postgres in Docker (loopback-only), Next.js
  runs locally with hot-reload.
- **Prod** (`scripts/start-prod.sh`) — Postgres + Web all in
  containers via `docker-compose.yml`.

## Environment variables

| Var                  | Required | Default                                         | Notes                              |
|----------------------|----------|-------------------------------------------------|------------------------------------|
| `DATABASE_URL`       | ✓        | `postgresql://lms:lms@db:5432/lms?schema=public`| Prisma connection string (dev host port = **3942**) |
| `AUTH_SECRET`        | ✓        | (placeholder in `.env`)                          | **Generate a real one for prod**   |
| `AUTH_TRUST_HOST`    | ✓        | `true`                                           | Trust X-Forwarded-* (reverse-proxy)|
| `NEXTAUTH_URL`       | ✓        | `http://localhost:3940`                          | Public URL the browser hits        |
| `PORT`               |          | `3940`                                           | Next listen port                   |
| `COURSES_DIR`        |          | `../courses` (dev) / `/courses` (container)     | Where the HTML lives               |

### Reserved ports

| Service          | Host port |
|------------------|-----------|
| Web (Next.js)    | **3940**  |
| Postgres         | **3942**  |

Generate a strong `AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

## Behind a reverse-proxy

- Terminate TLS at NGINX/Traefik/Cloudflare.
- Forward `X-Forwarded-*` headers.
- Set `NEXTAUTH_URL=https://learn.yourcompany.com`.

## Backups

Daily:
```
docker exec lms-db pg_dump -U lms -d lms > backups/lms-$(date +%F).sql
```

Restore:
```
cat backup.sql | docker exec -i lms-db psql -U lms -d lms
```

## Scaling

- App is stateless (JWT cookies, no in-memory session) — run N replicas
  behind a load balancer.
- Database is the only state; use Postgres HA (managed or Patroni).
- Static course HTML can be moved to S3/CDN later; the auth gate stays
  in front via signed URLs.

## Hardening checklist (before going live)

- [ ] Rotate `AUTH_SECRET`
- [ ] Rotate the seeded admin password (`/admin/users/<id>` → Reset)
- [ ] Configure LDAP with StartTLS or LDAPS
- [ ] Set up automated daily DB backups
- [ ] Put the portal on internal DNS / VPN
- [ ] Review course HTML CSP if you ship third-party scripts
