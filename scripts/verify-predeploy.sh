#!/usr/bin/env bash
# Pre-deploy gate. Run in the WSL copy (~/LicenseDent/app), after
# ./sync-from-d.sh and right before `wasp deploy`. Stops at the first
# problem. Checks: toolchain, Railway account, WSL copy == D:, committed +
# pushed, CI green for this exact commit, production config, and a real
# build + typecheck (same steps as CI). Procedure: docs/22 §4.
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.railway/bin:$PATH"

REPO=mubeen01/licensedent
RAILWAY_ACCOUNT=mubeen31m@gmail.com
PROJECT_ID=8f5dbeaf-e6ee-4436-98ac-90381a11017f
CLIENT_URL=https://licensedent.com
D_APP=/mnt/d/Dental/LicenseDent/app
GIT="git -c core.autocrlf=true -c safe.directory=*"

fail() { echo; echo "GATE FAILED: $*" >&2; exit 1; }
step() { echo; echo "== $*"; }
json() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(($1)??'')})"; }

step "1/8 toolchain"
node -v | grep -q '^v24\.' || fail "Node $(node -v); run: nvm use 24.20.0"
wasp version 2>/dev/null | head -1 | grep -q '0\.25' || fail "Wasp is not 0.25.x ($(wasp version 2>/dev/null | head -1))"
# Only LicenseDent's own `wasp start` matters; other projects' dev servers
# (e.g. /mnt/d/Fluenspire) don't share this build's .wasp/out.
for pid in $(pgrep -f "wasp start"); do
  case "$(readlink "/proc/$pid/cwd" 2>/dev/null)" in
    *LicenseDent*) fail "a LicenseDent 'wasp start' is running (pid $pid) -- stop it first (building alongside it can crash both)" ;;
  esac
done
echo "ok: node $(node -v), wasp $(wasp version | head -1)"

step "2/8 Railway account + project"
railway whoami 2>/dev/null | grep -q "$RAILWAY_ACCOUNT" || fail "railway whoami is not $RAILWAY_ACCOUNT (railway logout && railway login)"
railway link --project "$PROJECT_ID" --environment production --service licensedent-server >/dev/null 2>&1 \
  || fail "could not link to project $PROJECT_ID"
echo "ok: $RAILWAY_ACCOUNT, project licensedent/production"

step "3/8 WSL copy matches D:"
for p in src public migrations main.wasp.ts schema.prisma package.json package-lock.json; do
  diff -rq "$D_APP/$p" "$p" >/dev/null 2>&1 || fail "$p differs from D: -- run ./sync-from-d.sh"
done
[ "$($GIT -C "$D_APP" rev-parse HEAD)" = "$($GIT rev-parse HEAD)" ] || fail "WSL copy HEAD != D: HEAD -- run ./sync-from-d.sh"
echo "ok: identical to D: at $($GIT rev-parse --short HEAD)"

step "4/8 committed and pushed"
[ -z "$($GIT status --porcelain)" ] || { $GIT status --short; fail "uncommitted changes -- commit on D: first (if EVERY file shows, it's line endings: check 'git status' on Windows)"; }
HEAD_SHA=$($GIT rev-parse HEAD)
ORIGIN_SHA=$(curl -fsS "https://api.github.com/repos/$REPO/commits/master" | json "j.sha") || fail "could not read GitHub master"
[ "$HEAD_SHA" = "$ORIGIN_SHA" ] || fail "local HEAD ${HEAD_SHA:0:7} != GitHub master ${ORIGIN_SHA:0:7} -- push (or pull) first"
echo "ok: local == GitHub master (${HEAD_SHA:0:7})"

step "5/8 CI green for this commit"
CI=$(curl -fsS "https://api.github.com/repos/$REPO/actions/runs?head_sha=$HEAD_SHA&per_page=1" \
  | json "j.workflow_runs[0] ? j.workflow_runs[0].status+'/'+j.workflow_runs[0].conclusion : 'none'")
[ "$CI" = "completed/success" ] || fail "CI for ${HEAD_SHA:0:7} is '$CI' -- wait for it to finish green"
echo "ok: CI completed/success"

step "6/8 production config"
GA=${REACT_APP_GOOGLE_ANALYTICS_ID:-}
if [ -z "$GA" ]; then
  echo "  note: REACT_APP_GOOGLE_ANALYTICS_ID not set -- analytics off (one harmless console line on cookie Accept)"
elif ! [[ "$GA" =~ ^G-[A-Z0-9]{6,}$ ]]; then
  fail "REACT_APP_GOOGLE_ANALYTICS_ID='$GA' is not a real GA4 id -- unset it, or export the real G-XXXXXXXXXX"
fi
case "${REACT_APP_API_URL:-}" in *localhost*) fail "REACT_APP_API_URL is localhost in this shell -- unset it (don't source .env.client)";; esac
SERVER_CLIENT_URL=$(railway variables --service licensedent-server --kv 2>/dev/null | grep '^WASP_WEB_CLIENT_URL=' | cut -d= -f2-)
[ "$SERVER_CLIENT_URL" = "$CLIENT_URL" ] || fail "server WASP_WEB_CLIENT_URL is '$SERVER_CLIENT_URL', expected $CLIENT_URL (CORS/login will break)"
echo "ok: GA id valid or unset, API URL not localhost, server WASP_WEB_CLIENT_URL=$CLIENT_URL"

step "7/8 build + typecheck (same steps as CI)"
npm install --no-audit --no-fund
wasp install
npx prisma generate --schema=schema.prisma
wasp build
npx tsc --noEmit -p tsconfig.src.json
echo "ok: wasp build + tsc clean"

step "8/8 GATE PASSED -- deploy with:"
cat <<EOF

  wasp deploy railway deploy licensedent --existing-project-id $PROJECT_ID

Then run: ./scripts/verify-postdeploy.sh
EOF
