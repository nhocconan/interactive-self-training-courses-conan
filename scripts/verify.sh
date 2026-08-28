#!/usr/bin/env bash
# One-command mirror of CHECKLIST.md §4 (pre-commit verification). Hard-fails on: tsc, vitest,
# eslint on CHANGED files (pre-existing lint debt elsewhere is out of scope per CHECKLIST),
# and the SVG arrow audit. The §5 browser walk-through is NOT covered — do it before "done".
set -uo pipefail
cd "$(dirname "$0")/.."
fail=0
echo "== app: tsc =="
(cd app && npx tsc --noEmit) || fail=1
echo "== app: eslint (changed files) =="
changed=$(git diff --name-only HEAD -- app | grep -E '\.(ts|tsx|js|mjs)$' | sed 's#^app/##' || true)
if [ -n "$changed" ]; then (cd app && npx eslint $changed --max-warnings 0) || fail=1; else echo "(no changed app files)"; fi
echo "== app: vitest =="
(cd app && npm test) || fail=1
echo "== svg arrow audit =="
python3 scripts/audit-svg-arrows.py || fail=1
[ $fail -eq 0 ] && echo "verify: all green ✔ (CHECKLIST §5 browser walk-through still required)" || echo "verify: FAILED"
exit $fail
