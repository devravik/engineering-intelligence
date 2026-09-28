# OpenCode Code Quality & Engineering Gate

Engineering Intelligence delivers deterministic quality control for OpenCode, the open-source terminal-based AI coding agent. It prevents OpenCode sessions from introducing N+1 queries, missing authorization, architectural over-engineering, and AI UI slop before changes are committed.

OpenCode runs coding agents from the terminal against your local codebase. Engineering Intelligence integrates as an OpenCode skill to run automatically after file modifications, providing immediate quality feedback inside the same terminal workflow.

---

## Installation for OpenCode

Install the skill via the standard skills protocol:

```bash
npx skills add devravik/engineering-intelligence
```

This configures Engineering Intelligence as an OpenCode skill and installs the `ei` CLI for direct invocation.

---

## What It Catches in OpenCode Sessions

OpenCode's strength is agentic, multi-step code generation from natural-language instructions. Its systematic blind spot is the same as all LLM agents: engineering properties that were not explicitly specified in the prompt.

* **N+1 Queries (`DB-002`)**: When generating list-rendering API endpoints, OpenCode loops and performs individual ORM queries per record.
* **Missing Ownership Checks (`API-001`)**: Route handlers and service methods allow any authenticated user to access or mutate records they don't own.
* **Speculative Interfaces (`ARCH-001`)**: OpenCode generates TypeScript interfaces for simple services that have exactly one concrete implementation, creating over-engineered boilerplate.
* **HTTP Without Timeouts (`API-005`)**: External service calls (`fetch()`, `axios`) are generated without timeout configurations.
* **AI-Generated UI (`UI-COLOR-001`, `UI-SLOP-003`)**: Component generation defaults to purple/indigo gradients and excessive card nesting.

---

## OpenCode Verification Workflow

After an OpenCode session:

```bash
# 1. Review what was changed
$ git diff --stat

# 2. Run Engineering Intelligence on agent changes
$ ei detect --changed

Engineering Intelligence

NEW  DB-002    N+1 query inside array map
     src/api/members.ts:45

NEW  API-001   Missing authorization check on DELETE endpoint
     src/routes/projects.ts:67

2 findings

# 3. Review with attribution and blast radius
$ ei review

# 4. Enforce ship gate
$ ei ship
BLOCK: 2 findings require resolution
```

---

## Integrating with OpenCode's Skill System

Once installed, OpenCode can invoke Engineering Intelligence via natural language within the agent session:

```text
> Check what you just wrote with ei detect before we commit
```

Or automatically after every session via OpenCode's post-task hooks.

---

## Learn More

* [OpenCode Ecosystem Guide](../ecosystems/opencode.md)
* [AI-Generated Code Review](ai-code-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
