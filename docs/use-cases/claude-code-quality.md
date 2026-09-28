# Claude Code Quality & Engineering Gate

Engineering Intelligence provides an automated, deterministic quality gate for Claude Code (`claude-code`). It catches architectural decay, security gaps, database bottlenecks, and UI slop before Claude commits code to your repository.

While Claude Code writes working code rapidly, agentic modifications often introduce subtle structural liabilities: N+1 database queries, swallowed errors, unindexed foreign keys, and speculative over-engineering. Engineering Intelligence integrates directly with Claude Code's skill and hook architecture to review every modification.

---

## Quick Installation for Claude Code

Add the skill to Claude Code in one command:

```bash
npx skills add devravik/engineering-intelligence
```

Or configure the Claude Code marketplace plugin:

```bash
claude plugin add @devravik/engineering-intelligence
```

---

## What Engineering Intelligence Catches in Claude Code Sessions

Claude Code excels at single-pass generation but frequently exhibits specific architectural blind spots:

* **N+1 Database Queries (`DB-002`)**: Claude loops over ORM entities performing individual queries inside map/forEach iterations instead of eager-loading with `include` or joins.
* **Missing Authorization Guards (`API-001`)**: When creating new API routes or Next.js server actions, Claude often forgets tenant or user permission checks on mutating endpoints.
* **Speculative Abstractions (`ARCH-001`)**: Claude frequently invents generic interfaces (e.g., `IUserService`, `AbstractNotificationFactory`) that have exactly one concrete implementation and no test mock variance.
* **Unbounded HTTP Fetching (`API-005`)**: External API calls are written without `timeout` or `AbortSignal`, creating unbounded hung socket vulnerabilities.
* **Swallowed Exceptions (`API-002`)**: In catch blocks, Claude often logs a warning and returns `null` or a generic error, discarding stack traces.
* **AI UI Slop (`UI-COLOR-001`, `UI-SLOP-003`)**: Generates purple/indigo gradient headers and deeply nested card layouts without consistent design tokens.

---

## How Claude Code Runs Engineering Intelligence

Once installed, Claude Code can invoke the skill autonomously or through commands:

### 1. Manual Invocation
You can ask Claude:
```text
> Check the changes we just made with ei detect
```

### 2. Native Slash Command
Run within Claude Code:
```text
/ei
```

### 3. Automated PostToolUse Hooks
Engineering Intelligence hooks into Claude's file write tools (`WriteFile`, `EditFile`) to automatically analyze staged diffs:

```bash
$ ei detect --changed
Engineering Intelligence
0 findings detected across 3 modified files.
Ready to commit.
```

---

## Enforcing the Ship Gate

Claude Code can verify readiness before pushing or raising a pull request:

```bash
$ ei ship
PASS: 0 blockers, 0 warnings, 0 unknown risks. Safe to ship.
```

If issues are detected, `ei ship` blocks execution and provides concrete AST line numbers for Claude to repair.

---

## Learn More

* [Claude Code Ecosystem Guide](../ecosystems/claude-code.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
* [AI-Generated Code Review Overview](ai-code-review.md)
