#!/bin/bash
# D:\Dental\LicenseDent is the ONE PERMANENT home (all commits happen
# there). ~/LicenseDent in WSL is a *disposable* run-only copy re-synced
# from D: every session -- confirmed 2026-09-20 (see memory
# licensedent-startup's "FINAL MODEL" block) that running wasp directly
# against /mnt/d instead is a real regression, not a fix: 4-5min cold
# boot, hot reload never fires, SSR takes 380+s/request with no clean
# completion, unaffected by chokidar polling. So this script still points
# at the WSL-native copy -- but MUST be preceded by a real rsync from D:
# every time, never assumed already in sync. sync-from-d.sh (alongside
# this file) does that, with a real verification, not just a comment
# reminder -- called automatically below so this can't be skipped.
export NVM_DIR="$HOME/.nvm"
. "$NVM_DIR/nvm.sh"
nvm use default
bash "$(dirname "${BASH_SOURCE[0]}")/sync-from-d.sh"
cd /home/mubeen/LicenseDent/app
wasp start 2>&1 | tee /tmp/wasp-final.log
