# Vibe Coding Quality Control: Catching Bugs Before They Ship

Vibe coding — using AI agents to rapidly generate software from natural language — produces working prototypes fast. Engineering Intelligence is the quality-control layer that makes vibe coding production-safe.

When you vibe-code a feature, the AI agent fulfills the intent of your prompt. What it doesn't fulfil is everything you didn't say: index your foreign keys, check ownership before mutation, handle the timeout case, don't create unnecessary abstractions. Engineering Intelligence enforces those unstated engineering requirements deterministically, without LLM review costs or hallucination risk.

---

## Why Vibe Code Needs a Quality Gate

Vibe coding optimizes for speed of completion, not production resilience. The output is syntactically valid and often functionally correct on a happy path, but systematically missing:

* **Authorization guards**: Your prompt said "build a team management API." It didn't say "check that the user owns the team before deleting it." The agent didn't either.
* **Database index coverage**: The schema works with 50 rows. It won't work with 500,000.
* **Error propagation**: The happy path works. The network timeout path silently returns `undefined`.
* **Dependency hygiene**: The agent introduced three interfaces with one implementation each, two factories, and a God file.

Engineering Intelligence runs 32 backend detectors and 49 UI detectors to catch all of these before you push.

---

## Installation

```bash
npx skills add devravik/engineering-intelligence
```

---

## The Vibe Coding Verification Workflow

Run after every agentic session:

```bash
# 1. See what the agent broke / introduced
$ git diff --stat

# 2. Verify against engineering standards
$ ei detect --changed

Engineering Intelligence

NEW  API-001   Missing authorization on mutating endpoint
     src/api/teams/delete.ts:18

NEW  DB-002    N+1 query inside loop
     src/api/teams/members.ts:34

NEW  ARCH-001  Single-implementation interface
     src/services/TeamService.ts:1

3 findings

# 3. Executive review with blast radius
$ ei review

# 4. Ship gate enforcement
$ ei ship
BLOCK: 3 findings require resolution before shipping
```

---

## What Engineering Intelligence Catches in Vibe Code

| Category | Failure | Rule |
|---|---|---|
| Database | N+1 queries | `DB-002` |
| Database | Unindexed foreign keys | `DB-001` |
| Database | Table-locking migrations | `DB-003` |
| Security | Missing authorization | `API-001` |
| Security | SQL injection | `SEC-001` |
| Architecture | Unnecessary interfaces | `ARCH-001` |
| Architecture | Circular dependencies | `ARCH-003` |
| Error Handling | Swallowed exceptions | `API-002` |
| Error Handling | No HTTP timeouts | `API-005` |
| Testing | Fake assertions | `TEST-002` |
| Testing | Committed `.skip` | `TEST-004` |
| UI | AI purple gradients | `UI-COLOR-001` |
| UI | Everything-centered layout | `UI-SPATIAL-001` |

👉 **[See all 81 detector rules →](../problems.md)**

---

## Works with Every Vibe Coding Tool

* Claude Code · Cursor · GitHub Copilot · OpenCode · Windsurf · Cline · Antigravity

---

## Learn More

* [AI-Generated Code: Risks & Patterns](ai-generated-code.md)
* [AI-Agent Security Review](ai-agent-security.md)
* [CI/CD Quality Gate](ci-cd-quality-gate.md)
