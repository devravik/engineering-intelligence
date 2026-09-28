# Cline Code Quality: Engineering Gate for Autonomous VS Code Agent

Engineering Intelligence provides deterministic quality control for Cline, the autonomous AI coding agent for VS Code. It catches missing authorization, N+1 queries, swallowed exceptions, and AI UI slop generated during Cline's multi-step autonomous execution before changes are accepted.

Cline operates with high autonomy — reading files, writing code, running commands, and iterating across complex multi-file tasks. Engineering Intelligence integrates via `.clinerules` to inject quality verification into every Cline session as a mandatory step before commit or file acceptance.

---

## Installation for Cline

```bash
npx skills add devravik/engineering-intelligence
```

Or install directly:

```bash
npx @devravik/engineering-intelligence install
```

This provisions `.clinerules` in your workspace, instructing Cline to run `ei detect --changed` and `ei ship` before completing any task involving code modifications.

---

## What Cline Misses That Engineering Intelligence Catches

Cline's autonomous nature means it makes architectural decisions without a human in the loop for each step. This creates specific failure patterns:

* **Authorization Omission (`API-001`)**: When scaffolding new CRUD endpoints for a resource, Cline verifies the user is authenticated but doesn't check that they own the specific record ID being mutated (IDOR vulnerability).
* **N+1 Patterns in Generated Loops (`DB-002`)**: Cline generates list-fetching logic that queries child entities per-iteration when building REST API endpoints.
* **Over-Abstracted Service Layers (`ARCH-001`)**: To make code "well-structured," Cline introduces service interfaces, repository patterns, and factory classes for simple operations.
* **Empty Error Recovery (`API-002`)**: Error handlers that log and return empty responses rather than propagating or re-raising.

---

## `.clinerules` Integration

After `ei install`, your `.clinerules` is configured with:

```markdown
## Engineering Quality Gate

Before completing any task that involved writing or modifying code:

1. Run `ei detect --changed` to check for engineering issues
2. If findings are detected, fix them before stopping
3. Run `ei ship` to verify the gate passes
4. Only stop when `ei ship` returns SHIP or FIX

Do not report a task as complete if `ei ship` returns BLOCK.
```

---

## Verification Workflow

```bash
# After Cline completes an autonomous task
$ ei detect --changed

Engineering Intelligence

NEW  API-001   Missing authorization check
     src/api/documents/[id]/delete.ts:8

NEW  DB-002    N+1 query inside Promise.all map
     src/api/workspace/members.ts:31

2 findings

$ ei ship
BLOCK: 2 findings require resolution
```

Cline can be instructed to fix these findings automatically:

```text
> ei detected 2 issues — fix the missing authorization check and the N+1 query, then re-run ei ship
```

---

## Learn More

* [Cline Ecosystem Guide](../ecosystems/cline.md)
* [AI-Agent Security Review](ai-agent-security.md)
* [AI-Agent Database Review](ai-agent-database-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
