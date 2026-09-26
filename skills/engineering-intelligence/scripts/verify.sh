#!/usr/bin/env bash
# Engineering Intelligence Lightweight Verification Script
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "=== Engineering Intelligence Quality Verification ==="

if command -v ei &> /dev/null; then
  echo "Running via local 'ei' binary..."
  ei detect
  ei ui detect
elif [ -f "${REPO_ROOT}/src/cli/index.ts" ]; then
  echo "Running via tsx source..."
  npx tsx "${REPO_ROOT}/src/cli/index.ts" detect
  npx tsx "${REPO_ROOT}/src/cli/index.ts" ui detect
else
  echo "Running via npx engineering-intelligence..."
  npx engineering-intelligence detect
fi

echo "=== Verification Complete ==="
