#!/usr/bin/env bash
# Run from repository root. A present but incomplete scaffold must fail CI.
set -euo pipefail
case "${1:-}" in
  backend) manifest=backend/pom.xml; issue=3 ;;
  mobile) manifest=mobile/package.json; issue=4 ;;
  *) echo 'Usage: check-project.sh backend|mobile' >&2; exit 2 ;;
esac
if [[ ! -f "$manifest" ]]; then
  echo "SKIPPED: $1 verification not executed; $manifest absent (Issue #$issue)."
  if [[ -n "${GITHUB_STEP_SUMMARY:-}" ]]; then
    echo "SKIPPED: $1 verification not executed; manifest absent (Issue #$issue)." >> "$GITHUB_STEP_SUMMARY"
  fi
  [[ -z "${GITHUB_OUTPUT:-}" ]] || echo 'present=false' >> "$GITHUB_OUTPUT"
  exit 0
fi
[[ -z "${GITHUB_OUTPUT:-}" ]] || echo 'present=true' >> "$GITHUB_OUTPUT"
if [[ "$1" == backend ]]; then
  if [[ ! -x backend/mvnw || ! -f backend/.mvn/wrapper/maven-wrapper.properties ]]; then
    echo 'FAIL: Issue #3 must commit executable backend/mvnw and its Maven wrapper configuration.' >&2
    exit 1
  fi
else
  python3 - <<'PY'
import json
from pathlib import Path
p = Path('mobile')
package = json.loads((p / 'package.json').read_text())
if not (p / 'package-lock.json').is_file():
    raise SystemExit('FAIL: Issue #4 must commit mobile/package-lock.json for npm ci.')
if any((p / name).exists() for name in ('yarn.lock', 'pnpm-lock.yaml', 'bun.lock', 'bun.lockb')):
    raise SystemExit('FAIL: conflicting package managers; align CI with the selected lockfile in Issue #4.')
if not package.get('packageManager', 'npm@').startswith('npm@'):
    raise SystemExit('FAIL: CI currently targets npm; update install/cache/lint commands for the selected package manager.')
if not isinstance(package.get('scripts', {}).get('lint'), str) or not package['scripts']['lint'].strip():
    raise SystemExit('FAIL: Issue #4 must define a noninteractive scripts.lint (no auto-install or --fix).')
PY
fi
echo "PASS: $1 prerequisites found; real verification must run next."
