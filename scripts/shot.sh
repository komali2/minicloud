#!/usr/bin/env bash
# Render a minicloud page to PNG with headless chromium.
#   scripts/shot.sh <path> <out.png> [width] [height]
# e.g. scripts/shot.sh /a/sales-by-quarter-i4zw6e/ /tmp/chart.png
set -euo pipefail
PATH_=${1:-/}
OUT=${2:-/tmp/minicloud-shot.png}
W=${3:-1400}
H=${4:-2100}
BASE="http://127.0.0.1:${PORT:-3000}"
rm -f "$OUT"
timeout 60 chromium --headless --disable-gpu --no-sandbox --hide-scrollbars \
  --force-device-scale-factor=1 --window-size="$W,$H" --virtual-time-budget=8000 \
  --screenshot="$OUT" "${BASE}${PATH_}" >/dev/null 2>&1 || true
[ -s "$OUT" ] || { echo "failed to render ${BASE}${PATH_}" >&2; exit 1; }
echo "$OUT  $(stat -c %s "$OUT") bytes  $(stat -c %n "$OUT")"
