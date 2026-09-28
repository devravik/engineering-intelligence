# AI-Generated Code Review

Engineering Intelligence is an open-source engineering quality-control skill and CLI for AI coding agents. It detects architecture, security, API, database, testing, and UI problems in AI-generated code using deterministic rules and local project context.

When AI coding agents (such as Claude Code, Cursor, Codex, OpenCode, GitHub Copilot, and Cline) generate or modify software, they frequently produce syntactically valid code that contains severe engineering liabilities. Engineering Intelligence acts as a deterministic pre-commit and pre-merge gate to catch these flaws before they reach production.

---

## What It Detects

Engineering Intelligence executes 32 backend/architecture detectors and 49 UI detectors across the codebase:

* **Database & ORM**: N+1 queries (`DB-002`), unindexed foreign keys (`DB-001`), table-locking migrations (`DB-003`), unbounded queries without `LIMIT` (`DB-004`).
* **Security & Auth**: Missing authorization on mutating endpoints (`API-001`), SQL injection via string concatenation (`SEC-001`), command injection (`SEC-002`), exposed secrets/API keys (`SEC-004`).
* **Architecture & Complexity**: Speculative single-implementation interfaces (`ARCH-001`), God files and classes (`ARCH-002`), circular dependency cycles (`ARCH-003`), stateful singletons (`ARCH-005`).
* **Error Handling & API Resilience**: Swallowed exceptions in catch blocks (`API-002`), HTTP requests without timeouts or AbortSignals (`API-005`), unhandled promise rejections (`CODE-007`).
* **Testing Anti-Patterns**: Fake assertions like `expect(true).toBe(true)` (`TEST-002`), skipped test suites committed to source (`TEST-004`), zero-assertion tests (`TEST-001`).
* **AI Code Slop**: Tautological echo comments that merely repeat code (`SLOP-002`), unnecessary factory patterns (`SLOP-001`), unused speculative types (`SLOP-004`).
* **AI-Generated UI Slop**: Purple-to-indigo generic gradients (`UI-COLOR-001`), card-in-card nesting (`UI-SLOP-003`), everything-centered layouts (`UI-SPATIAL-001`), missing accessibility labels (`UI-A11Y-002`).

---

## Installation

Install as an agent skill into your coding agent:

```bash
npx skills add devravik/engineering-intelligence
```

Or install the standalone CLI:

```bash
npm install -g @devravik/engineering-intelligence
# or run directly with npx
npx @devravik/engineering-intelligence install
```

---

## How It Works

Unlike LLM-based reviewers that suffer from hallucination, non-determinism, and token costs, Engineering Intelligence evaluates code deterministically:

1. **Local AST & Static Analysis**: Parses changed files using tree-sitter and TypeScript compiler ASTs.
2. **Project Context Awareness**: Evaluates schema definitions, migration histories, and route registries to confirm or refute findings.
3. **Restraint Doctrine**: Strictly filters out false positives—intentional abstractions with multiple variants or legitimate memoization caches are ignored.
4. **Zero External API Calls**: Runs 100% locally on your machine or CI runner. No API keys, zero cloud egress.

---

## Usage Workflow

Run one command against AI-generated modifications:

```bash
# 1. Detect issues across changed git files
$ ei detect --changed

Engineering Intelligence
NEW  DB-002    N+1 query
     src/api/users.ts:84
NEW  API-001   Missing authorization check on mutating endpoint
     src/routes/projects.ts:42

# 2. Compile an executive review matrix with attribution & blast radius
$ ei review

# 3. Enforce the ship gate (UNKNOWN != PASS)
$ ei ship
BLOCK: UNKNOWN != PASS (2 findings require resolution)
```

---

## Supported Agent Ecosystems

* **Claude Code**: Native `/ei` slash command and PreToolUse / PostToolUse verification hooks.
* **Cursor**: `.cursor/rules/` (`.mdc`) directives for Composer.
* **GitHub Copilot & Codex**: `.github/copilot-instructions.md` configuration.
* **OpenCode / Cline / Windsurf / Antigravity**: Universal standard skill protocol support.

👉 **[Explore all 81 detector rules and failure patterns →](../problems.md)**
