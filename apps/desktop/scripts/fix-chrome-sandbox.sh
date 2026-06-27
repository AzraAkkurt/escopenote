#!/usr/bin/env bash
# Optional: fix Electron chrome-sandbox SUID permissions (Linux only).
# Run from repo: bash apps/desktop/scripts/fix-chrome-sandbox.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SANDBOX="$ROOT/node_modules/electron/dist/chrome-sandbox"

if [[ ! -f "$SANDBOX" ]]; then
  echo "chrome-sandbox not found. Run: cd apps/desktop && npm install"
  exit 1
fi

if [[ "$(uname -s)" != "Linux" ]]; then
  echo "This script is for Linux only. On other OS, use: npm run dev"
  exit 0
fi

echo "Setting ownership and mode on:"
echo "  $SANDBOX"
sudo chown root:root "$SANDBOX"
sudo chmod 4755 "$SANDBOX"
echo "Done. You can run: npm run dev"
