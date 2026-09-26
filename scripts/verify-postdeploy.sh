#!/usr/bin/env bash
# Post-deploy parity check: local == GitHub == production. Run after
# `wasp deploy` (in the WSL copy, so the local client build exists), or
# any time to answer "is production up to date?". A release is only
# complete when this prints RELEASE COMPLETE. Procedure: docs/22 §4.
set -uo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.railway/bin:$PATH"

REPO=mubeen01/licensedent
PROJECT_ID=8f5dbeaf-e6ee-4436-98ac-90381a11017f
SERVER_URL=https://licensedent-server-production.up.railway.app
CLIENT_URL=https://licensedent.com
GIT="git -c core.autocrlf=true -c safe.directory=*"

PROBLEMS=0
ok()   { echo "  ok    $*"; }
bad()  { echo "  FAIL  $*"; PROBLEMS=$((PROBLEMS+1)); }
warn() { echo "  warn  $*"; }
json() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log(($1)??'')})"; }

railway link --project "$PROJECT_ID" --environment production --service licensedent-server >/dev/null 2>&1

echo "== local vs GitHub"
HEAD_SHA=$($GIT rev-parse HEAD)
ORIGIN_SHA=$(curl -fsS "https://api.github.com/repos/$REPO/commits/master" | json "j.sha")
[ -z "$($GIT status --porcelain)" ] && ok "working tree clean" || bad "uncommitted changes"
[ "$HEAD_SHA" = "$ORIGIN_SHA" ] && ok "local HEAD == GitHub master (${HEAD_SHA:0:7})" \
  || bad "local HEAD ${HEAD_SHA:0:7} != GitHub master ${ORIGIN_SHA:0:7}"
CI=$(curl -fsS "https://api.github.com/repos/$REPO/actions/runs?head_sha=$ORIGIN_SHA&per_page=1" \
  | json "j.workflow_runs[0] ? j.workflow_runs[0].status+'/'+j.workflow_runs[0].conclusion : 'none'")
[ "$CI" = "completed/success" ] && ok "CI green for ${ORIGIN_SHA:0:7}" || bad "CI for ${ORIGIN_SHA:0:7} is '$CI'"

echo "== production vs local"
# Last commit that changes what actually ships. Docs, CI and helper
# scripts don't need a deploy, so only these paths count.
SHIPPED="src public migrations main.wasp.ts schema.prisma package.json package-lock.json vite.config.ts postcss.config.js tsconfig.json tsconfig.src.json tsconfig.wasp.json components.json"
LAST_APP_COMMIT=$($GIT log -1 --format=%cI -- $SHIPPED)
for svc in licensedent-server licensedent-client; do
  DEP=$(railway deployment list --service "$svc" --limit 1 --json 2>/dev/null | json "j[0] ? j[0].status+' '+j[0].createdAt : 'none'")
  STATUS=${DEP%% *}; CREATED=${DEP#* }
  if [ "$STATUS" != "SUCCESS" ]; then
    bad "$svc latest deployment: $DEP"
  elif node -e "process.exit(new Date('$CREATED') >= new Date('$LAST_APP_COMMIT') ? 0 : 1)"; then
    ok "$svc deployed $CREATED (after last app commit $LAST_APP_COMMIT)"
  else
    bad "$svc deployed $CREATED, BEFORE last app commit $LAST_APP_COMMIT -- production is behind, deploy needed"
  fi
done

code() { curl -s -o /dev/null -w '%{http_code}' "$1"; }
[ "$(code "$SERVER_URL/")" = "200" ] && ok "server responds 200" || bad "server $SERVER_URL -> $(code "$SERVER_URL/")"
[ "$(code "$CLIENT_URL/")" = "200" ] && ok "site responds 200" || bad "site $CLIENT_URL -> $(code "$CLIENT_URL/")"

LOGS=$(railway logs --service licensedent-server 2>/dev/null | tail -300)
echo "$LOGS" | grep -q "Server listening" && ok "server log: Server listening" || bad "no 'Server listening' in recent server logs"
# Only errors after the latest start matter; older ones belong to a replaced instance.
SINCE_START=$(echo "$LOGS" | awk '/Server listening/{buf=""} {buf=buf $0 "\n"} END{printf "%s", buf}')
echo "$SINCE_START" | grep -q "cron_on" && bad "pg-boss 'cron_on' error since the latest start -- pgboss.version is empty (docs/23 §2.9)"

LIVE_ENTRY=$(curl -s "$CLIENT_URL/" | grep -oE 'client-entry-[A-Za-z0-9_-]+\.js' | head -1)
LOCAL_ENTRY=$(find .wasp/out/web-app/build -name 'client-entry-*.js' 2>/dev/null | head -1 | xargs -r basename)
if [ -z "$LOCAL_ENTRY" ]; then
  warn "no local client build found (.wasp/out/web-app/build) -- run this in the WSL copy right after wasp deploy to compare bundles; live is $LIVE_ENTRY"
elif [ "$LIVE_ENTRY" = "$LOCAL_ENTRY" ]; then
  ok "live client bundle == local build ($LIVE_ENTRY)"
else
  bad "live client bundle $LIVE_ENTRY != local build $LOCAL_ENTRY -- the new client isn't live"
fi

echo
if [ "$PROBLEMS" -eq 0 ]; then
  echo "RELEASE COMPLETE: local, GitHub and production match."
else
  echo "NOT COMPLETE: $PROBLEMS problem(s) above."
  exit 1
fi
