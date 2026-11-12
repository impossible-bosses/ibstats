#!/usr/bin/env bash
set -euo pipefail
cd -- "$(dirname -- "$0")"
git pull --ff-only
node ./refresh.js
# Commit only generated data; never sweep unrelated source changes into refresh.
git add -- data/replays.json data/refresh-status.json
if ! git diff --cached --quiet -- data/replays.json data/refresh-status.json; then
    git commit -m "auto-refresh" -- data/replays.json data/refresh-status.json
    git push
fi
