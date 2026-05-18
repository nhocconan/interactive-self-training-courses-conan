#!/usr/bin/env bash
# Stop everything started by start-dev.sh
# Works regardless of the cwd you call it from.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PORT="${PORT:-3940}"
DEV_PID_FILE="$ROOT/logs/dev.pid"

# 1. Stop the Next dev process if we know its PID.
if [ -f "$DEV_PID_FILE" ]; then
  PID="$(cat "$DEV_PID_FILE" 2>/dev/null || true)"
  if [ -n "${PID:-}" ] && kill -0 "$PID" 2>/dev/null; then
    echo "▸ Stopping Next.js dev (pid $PID)…"
    kill "$PID" 2>/dev/null || true
    # Give it a moment, then SIGKILL stragglers.
    for _ in 1 2 3 4 5; do kill -0 "$PID" 2>/dev/null || break; sleep 1; done
    kill -0 "$PID" 2>/dev/null && kill -9 "$PID" 2>/dev/null || true
  fi
  rm -f "$DEV_PID_FILE"
fi

# 2. Belt-and-suspenders: kill anything still listening on the dev port.
PIDS="$(lsof -tiTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"
if [ -n "${PIDS}" ]; then
  echo "▸ Stopping leftover listener(s) on :$PORT (pids: ${PIDS})…"
  # shellcheck disable=SC2086
  kill ${PIDS} 2>/dev/null || true
fi

# 3. docker compose down — but only if docker is actually running.
if docker info >/dev/null 2>&1; then
  echo "▸ Stopping docker compose services…"
  docker compose down >/dev/null
fi

echo "✓ Stopped."
