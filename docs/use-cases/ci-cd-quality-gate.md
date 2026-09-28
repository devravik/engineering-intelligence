# CI/CD Quality Gate for AI-Generated Code

Engineering Intelligence integrates into CI/CD pipelines as a deterministic engineering quality gate. It blocks pull requests from merging when AI-generated changes introduce N+1 queries, missing authorization, SQL injection, table-locking migrations, or AI UI slop.

Unlike LLM-based PR review bots that add comments and rely on humans to act, Engineering Intelligence returns a non-zero exit code when findings exceed your configured threshold, natively failing the CI job.

---

## GitHub Actions Integration

Add to any repository in under 5 minutes:

```yaml
# .github/workflows/engineering-intelligence.yml
name: Engineering Quality Gate

on:
  pull_request:
    branches: [main, develop]

jobs:
  quality-gate:
    runs-on: ubuntu-latest
    name: Engineering Intelligence

    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # Required for --changed diff

      - uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Detect Engineering Issues
        run: npx --yes @devravik/engineering-intelligence detect --changed

      - name: Enforce Ship Gate
        run: npx --yes @devravik/engineering-intelligence ship
```

`ei ship` exits `0` (SHIP/FIX) or `1` (BLOCK), making it a standard CI gate compatible with every CI/CD platform.

---

## What the CI Gate Catches

Every pull request is evaluated against 32 backend detectors:

```
$ ei detect --changed

Engineering Intelligence

NEW  DB-002    N+1 query
     src/api/reports.ts:91

NEW  SEC-001   SQL injection via template literal
     src/db/search.ts:14

NEW  API-005   HTTP fetch without timeout
     src/integrations/stripe.ts:48

3 findings

$ ei ship
BLOCK: 3 findings require resolution (UNKNOWN != PASS)
```

Exit code `1` fails the GitHub Actions check. The PR cannot be merged until findings are resolved.

---

## GitLab CI Integration

```yaml
# .gitlab-ci.yml
engineering-quality-gate:
  stage: test
  image: node:20-alpine
  script:
    - npx --yes @devravik/engineering-intelligence detect --changed
    - npx --yes @devravik/engineering-intelligence ship
  only:
    - merge_requests
```

---

## Pre-commit Hook Integration

Run locally before every commit:

```bash
# Install the pre-commit hook
npx @devravik/engineering-intelligence install

# Or manually add to .git/hooks/pre-commit:
#!/bin/sh
ei detect --changed && ei ship
```

---

## Ship Gate States

| State | Exit Code | Meaning |
|---|---|---|
| `SHIP` | `0` | Zero blockers, zero warnings, zero unknowns |
| `FIX` | `0` | Warnings exist but no blockers (configurable) |
| `BLOCK` | `1` | Blockers or unresolved unknowns present |

`UNKNOWN != PASS` is enforced by default: any unreviewed finding prevents shipping.

---

## Supported CI/CD Platforms

Works on any platform that runs Node.js:

* GitHub Actions
* GitLab CI
* CircleCI
* Bitbucket Pipelines
* Azure DevOps
* Jenkins
* Vercel / Netlify build hooks

---

## Installation

```bash
npx skills add devravik/engineering-intelligence
```

---

## Learn More

* [Pre-Commit Code Review](pre-commit-code-review.md)
* [AI-Generated Code Review](ai-code-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
