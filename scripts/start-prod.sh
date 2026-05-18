#!/usr/bin/env bash
# Boot the full stack (db + web) in prod mode via docker compose.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
docker compose up -d --build
echo
echo "App      : http://localhost:3940"
echo "Postgres : localhost:3942"
echo "Admin    : REDACTED_EMAIL  /  REDACTED_PASSWORD"
