# Windsurf Code Quality: Engineering Gate for Cascade Agent Flows

Engineering Intelligence provides deterministic code quality review and ship gate enforcement for Windsurf's Cascade agent. It catches architectural debt, security vulnerabilities, database performance traps, and AI-generated UI slop introduced during Cascade multi-step editing sessions.

Windsurf Cascade enables deep codebase reasoning and multi-file edits. Engineering Intelligence complements this capability by evaluating every file Cascade modifies against 32 backend and 49 UI engineering rules, surfacing production risks before you push.

---

## Installation for Windsurf

Install the skill:

```bash
npx skills add devravik/engineering-intelligence
```

Or install and configure directly:

```bash
npx @devravik/engineering-intelligence install
```

This automatically provisions `.windsurfrules` in your workspace with Engineering Intelligence quality directives for Cascade.

---

## What It Catches in Cascade-Generated Code

Windsurf Cascade is particularly effective at cross-file refactoring. Engineering Intelligence validates the engineering safety of those cross-file changes:

* **N+1 Queries Across Files (`DB-002`)**: When Cascade introduces a new list rendering pattern that queries child records per-item across multiple service and API files.
* **Authorization Regression (`API-001`)**: When refactoring route handlers, Cascade may silently remove an existing `authMiddleware` call while restructuring the file.
* **Speculative Type Hierarchies (`ARCH-001`)**: Cascade often introduces TypeScript interface hierarchies that add one additional layer of abstraction without variance.
* **Swallowed Errors in Restructured Services (`API-002`)**: Catch blocks simplified during refactoring drop the rethrow.
* **AI UI Aesthetics (`UI-COLOR-001`)**: Generated component code uses generic purple/indigo gradient tokens.

---

## Windsurf Verification Workflow

```bash
# After a Cascade session
$ ei detect --changed

Engineering Intelligence

NEW  API-001   Authorization middleware removed during refactor
     src/routes/api/users.ts:24

NEW  ARCH-001  Single-implementation interface added without variance
     src/services/ReportingService.ts:1

2 findings

$ ei review   # Blast radius, attribution, recommendations
$ ei ship     # BLOCK or PASS
```

---

## `.windsurfrules` Configuration

After `ei install`, your `.windsurfrules` is updated with:

```markdown
## Engineering Quality Control

After modifying files, verify changes with Engineering Intelligence:

```bash
ei detect --changed
ei ship
```

Do not commit or submit changes that produce a BLOCK result.
Fix all detected issues before proceeding.
```

---

## Learn More

* [Windsurf Ecosystem Guide](../ecosystems/windsurf.md)
* [AI-Agent Architecture Review](ai-agent-architecture-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
