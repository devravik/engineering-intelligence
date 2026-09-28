# Pre-Commit Code Review for AI-Generated Changes

Engineering Intelligence runs as a pre-commit and pre-push quality gate for AI-generated code. It catches architecture, security, database, and UI problems locally before changes reach your team's pull request queue.

Running quality checks before committing is 10× cheaper than catching problems in code review and 100× cheaper than fixing them in production. For AI-generated code, where individual sessions can modify dozens of files across every layer of the stack, a pre-commit gate is essential.

---

## Installation

Install the pre-commit hook automatically:

```bash
npx @devravik/engineering-intelligence install
```

Or add to your agent skill set:

```bash
npx skills add devravik/engineering-intelligence
```

---

## What Runs on Every Commit

When you run `git commit`, Engineering Intelligence checks only your staged changes — not the entire codebase:

```bash
$ git add src/api/users.ts prisma/schema.prisma
$ git commit -m "feat: add user management API"

Engineering Intelligence (pre-commit)

NEW  DB-002    N+1 query inside loop
     src/api/users.ts:84

NEW  DB-001    Foreign key 'department_id' missing index
     prisma/schema.prisma:62

Commit blocked: 2 findings require resolution.
Fix issues or run `ei ignore --rule DB-002 --reason "intentional"` to waive.
```

---

## Running Manually Against Staged Changes

```bash
# Check only staged files (pre-commit)
ei detect --staged

# Check all changed files against HEAD (pre-push)
ei detect --changed

# Check a specific directory
ei detect src/api/

# Full project scan
ei detect
```

---

## Configuring Severity Thresholds

Control which finding severities block commits via `ei.config.json`:

```json
{
  "gate": {
    "blockOn": ["CRITICAL", "HIGH"],
    "warnOn": ["MEDIUM"],
    "ignoreOn": ["LOW"]
  }
}
```

---

## Inline Waivers for Intentional Patterns

When a detection is a known false positive, add an inline comment to suppress it:

```typescript
// ei-ignore: ARCH-001 - intentional strategy pattern with runtime resolution
export interface NotificationProvider {
  send(message: Message): Promise<void>;
}
```

---

## Husky Integration

Add to your Husky pre-commit configuration:

```json
// package.json
{
  "lint-staged": {
    "**/*.{ts,tsx,js,jsx}": [
      "ei detect --staged",
      "ei ship"
    ]
  }
}
```

Or in `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"
npx ei detect --staged && npx ei ship
```

---

## Learn More

* [CI/CD Quality Gate](ci-cd-quality-gate.md)
* [AI-Code Review Overview](ai-code-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
