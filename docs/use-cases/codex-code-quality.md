# GitHub Copilot & OpenAI Codex Code Quality Gate

Engineering Intelligence delivers deterministic engineering quality control and static analysis for GitHub Copilot, OpenAI Codex, and GitHub Actions CI pipelines. It prevents AI-generated code from introducing security vulnerabilities, performance regressions, and architectural debt.

While LLM-powered autocompletion and Copilot workspace agents accelerate development speed, they lack real-time architectural memory. Engineering Intelligence enforces strict engineering standards locally on developer machines and across CI checks.

---

## Quick Installation

Add the skill via standard skills protocol:

```bash
npx skills add devravik/engineering-intelligence
```

Or install repository-level Copilot instructions:

```bash
npx @devravik/engineering-intelligence install
```
This automatically provisions or updates `.github/copilot-instructions.md` with deterministic quality rules.

---

## What It Catches in Copilot / Codex Generated Code

GitHub Copilot and Codex completions often contain subtle patterns that pass compilation but degrade production reliability:

* **SQL Injection via String Templates (`SEC-001`)**: Template literals used inside raw query strings instead of parameterized bindings (`$1` or `:id`).
* **Unindexed Foreign Key References (`DB-001`)**: Schema alterations adding relational keys without accompanying database indexes.
* **Destructive Migrations (`DB-003`)**: Adding `NOT NULL` columns to existing tables without default values, triggering full table locks in production PostgreSQL/MySQL.
* **Echo Comments & LLM Watermarks (`SLOP-002`)**: Repetitive, redundant comments that restate code verbatim (`// set user age to 25`).
* **Swallowed Errors (`API-002`)**: Empty `catch (e) {}` blocks that mask background operational failures.
* **Fake Test Assertions (`TEST-002`, `TEST-004`)**: Committing tautological tests (`expect(response).toBeDefined()`) or tests marked `.skip` to bypass coverage checks.

---

## CI/CD Pipeline Integration (GitHub Actions)

Add Engineering Intelligence to your PR checks:

```yaml
# .github/workflows/engineering-intelligence.yml
name: Engineering Intelligence Quality Gate

on:
  pull_request:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Run Engineering Intelligence
        run: |
          npx --yes @devravik/engineering-intelligence detect --changed
          npx --yes @devravik/engineering-intelligence ship
```

If an agent or engineer introduces an unindexed foreign key, a missing authorization check, or an N+1 query, `ei ship` fails the build with a non-zero exit code.

---

## Learn More

* [Codex & Copilot Ecosystem Guide](../ecosystems/codex.md)
* [AI-Agent Security Review](ai-agent-security.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
