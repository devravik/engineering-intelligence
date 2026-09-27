#!/usr/bin/env bash
# Engineering Intelligence Lightweight Verification Script
set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"

echo "=== Engineering Intelligence Quality Verification ==="

# 1. Self-Verifying CLI Provenance Check
if command -v ei &> /dev/null; then
  EI_PATH="$(which ei 2>/dev/null || true)"
  echo "Located 'ei' binary: ${EI_PATH}"
  EI_VER="$(ei --version 2>&1 || true)"
  echo "CLI version: ${EI_VER}"

  if echo "${EI_VER}" | grep -q "engineering-intelligence"; then
    echo "Provenance verified: @devravik/engineering-intelligence"
    ei detect
    ei ui detect
  else
    echo "Warning: 'ei' on PATH did not report authentic @devravik/engineering-intelligence provenance."
    echo "Falling back to verified package runner..."
    npx -y @devravik/engineering-intelligence detect
  fi
elif [ -f "${REPO_ROOT}/src/cli/index.ts" ]; then
  echo "Running via local workspace tsx source..."
  npx tsx "${REPO_ROOT}/src/cli/index.ts" detect
  npx tsx "${REPO_ROOT}/src/cli/index.ts" ui detect
else
  echo "Running via verified npm package: @devravik/engineering-intelligence..."
  npx -y @devravik/engineering-intelligence detect
fi

echo "=== Verification Complete ==="
