#!/bin/bash
# Re-syncs the disposable WSL-native working copy (~/LicenseDent) from
# D:\Dental\LicenseDent (the one permanent home, all commits happen
# there) -- run before every wasp start, never assumed already in sync.
# See memory licensedent-startup's "FINAL MODEL" block for why a
# disposable native-filesystem copy exists at all instead of running
# directly against /mnt/d (a real, measured dev-server regression there,
# not a style preference), and docs/09-work-changelog.md's 2026-09-23
# "everything must be from the D drive" entry for what skipping this
# step actually broke: a whole session's worth of edits sat invisible on
# D: while the live app kept serving a stale WSL copy.
set -euo pipefail

# --delete: a file deleted on D: must also disappear here, or the next
# build ships it (Adverizeo shipped an already-fixed bug this way,
# 2026-09-07). Excluded dirs (node_modules, .wasp) are left alone.
rsync -a --delete --exclude 'node_modules' --exclude '.wasp' \
  /mnt/d/Dental/LicenseDent/ ~/LicenseDent/

# Verify, don't assume -- a partial/failed sync should fail loud, not
# silently leave the WSL copy stale.
diff \
  <(cd /mnt/d/Dental/LicenseDent/app/src && find . -type f | sort) \
  <(cd ~/LicenseDent/app/src && find . -type f | sort) \
  && echo "sync OK: app/src file lists identical" \
  || { echo "SYNC MISMATCH -- see diff above" >&2; exit 1; }
