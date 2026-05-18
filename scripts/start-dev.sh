#!/usr/bin/env bash
# Boot the Demo Learning Portal dev stack:
#   1. Postgres via docker compose
#   2. Run prisma migrations + seed (idempotent)
#   3. Start Next.js dev server on :3940 in the background
#   4. Wait until the portal responds, then return control to the user
#
# Works regardless of the cwd you call it from (resolves its own root).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
mkdir -p logs

PORT="${PORT:-3940}"
DEV_LOG="$ROOT/logs/dev.log"
DEV_PID_FILE="$ROOT/logs/dev.pid"

# 1. Sanity checks
command -v docker >/dev/null 2>&1 || { echo "✗ docker not found in PATH"; exit 1; }
docker info >/dev/null 2>&1 || { echo "✗ docker daemon is not running — start Docker Desktop first"; exit 1; }

# 2. If a previous dev server is still on the port, refuse and tell the user.
if lsof -tiTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "✗ Port $PORT is already in use."
  echo "  Run 'bash scripts/stop-dev.sh' first, or 'lsof -tiTCP:$PORT' to see what holds it."
  exit 1
fi

# 3. Postgres only.
echo "▸ Starting Postgres (loopback-only on 127.0.0.1:3942)…"
docker compose up -d db >/dev/null

# 4. Wait for Postgres
echo "▸ Waiting for Postgres to be healthy…"
for _ in $(seq 1 30); do
  if docker compose exec -T db pg_isready -U lms -d lms >/dev/null 2>&1; then
    echo "  ✓ Postgres ready"
    break
  fi
  sleep 1
done

cd "$ROOT/app"

# 5. Dependencies
if [ ! -d node_modules ]; then
  echo "▸ Installing app dependencies (first run only)…"
  npm ci
fi

# 6. Schema + seed (idempotent)
echo "▸ Syncing Prisma schema…"
npx prisma db push --skip-generate >/dev/null 2>&1

echo "▸ Generating Prisma client…"
npx prisma generate >/dev/null 2>&1

echo "▸ Seeding admin + categories + courses + quizzes…"
npx tsx prisma/seed.ts >/dev/null 2>&1 || {
  echo "  ✗ Seed failed — re-running with full output:"
  npx tsx prisma/seed.ts
  exit 1
}

# 7. Start Next.js dev in the background (detached from this shell)
echo "▸ Starting Next.js dev on :$PORT (logs → logs/dev.log)…"
: > "$DEV_LOG"
nohup npm run dev >"$DEV_LOG" 2>&1 &
echo $! > "$DEV_PID_FILE"
disown || true

# 8. Wait until HTTP is healthy
echo "▸ Waiting for the portal to come up…"
ready=0
for _ in $(seq 1 60); do
  if curl -fs -o /dev/null "http://localhost:$PORT/api/health" 2>/dev/null; then
    ready=1
    break
  fi
  sleep 1
done

if [ "$ready" != "1" ]; then
  echo "✗ Portal did not respond on :$PORT within 60s. Last 30 lines of log:"
  tail -30 "$DEV_LOG" || true
  exit 1
fi

PID=$(cat "$DEV_PID_FILE" 2>/dev/null || echo "?")

cat <<EOF

============================================================
   Demo Learning Portal — running

   App      : http://localhost:$PORT
   Postgres : 127.0.0.1:3942          (lms / lms) — loopback only
   Admin    : REDACTED_EMAIL  /  REDACTED_PASSWORD

   Logs     : logs/dev.log  (tail -f logs/dev.log)
   PID      : $PID
   Stop     : bash scripts/stop-dev.sh
============================================================

EOF
