# AI-Agent Architecture Review: Complexity, Decoupling, & Anti-Sprawl

Engineering Intelligence delivers automated, deterministic architectural review for code written by AI agents. It stops agents from introducing single-implementation abstractions, runaway file complexity (God classes), circular dependency cycles, and stateful singletons.

AI agents are notorious for speculative over-engineering. Because LLMs are trained on enterprise codebases with extensive abstractions, they reflexively create interfaces, factories, and boilerplate wrappers where straightforward functions would suffice. Engineering Intelligence enforces the **Restraint Doctrine** to keep codebases lean, maintainable, and decoupled.

---

## Architectural Anti-Patterns Caught by Engineering Intelligence

### 1. Speculative Single-Implementation Interfaces (`ARCH-001`)
* **The Failure**: An agent introduces an interface (`IUserService`, `NotificationStrategyInterface`) that has exactly one concrete implementation, no alternate implementations, and no mocking requirements.
* **The Harm**: Unnecessary indirection, cognitive overhead, and bloated refactoring costs without architectural benefit.
* **The Doctrine**: Interfaces should represent true polymorphism or system boundaries, not speculative future proofing.

### 2. God Files and Unbounded Modules (`ARCH-002`)
* **The Failure**: Agents continuously append new helper routines to existing files (e.g., `utils.ts`, `api.ts`), until a single module exceeds 1,000+ lines and dozens of unrelated responsibilities.
* **The Harm**: Violates Single Responsibility Principle, generates merge conflicts, and obscures module boundaries.
* **Remediation**: Recommends cohesive decomposition into bounded domain modules.

### 3. Circular Dependency Cycles (`ARCH-003`)
* **The Failure**: Module A imports Module B, and Module B imports Module A (directly or transitively).
* **The Harm**: Causes initialization deadlocks, `undefined` module exports at runtime, and brittle bundle packaging.
* **Detection**: Builds module import graphs across changed files to detect dependency cycles.

### 4. Stateful Global Singletons (`ARCH-005`)
* **The Failure**: Storing mutable application state in module-level global variables or unbounded in-memory caches.
* **The Harm**: Causes memory leaks, concurrency race conditions in serverless/cluster environments, and non-deterministic test failures.
* **Restraint Filter**: Legitimate memoization caches with explicit eviction and initialization locks are intentionally permitted.

### 5. AI Slop Abstractions (`SLOP-001`)
* **The Failure**: Creating abstract factory classes, builder classes, or wrapper layers for simple one-line operations.
* **Detection**: Flags factory classes that merely return a new instance of a single hardcoded class.

---

## Installation

Add the skill to your AI coding agent:

```bash
npx skills add devravik/engineering-intelligence
```

Or install locally:

```bash
npx @devravik/engineering-intelligence install
```

---

## Architecture Review Workflow

```bash
# Detect architectural decay on changed files
$ ei detect --changed

Engineering Intelligence

NEW  ARCH-001  Single-implementation interface without variance
     src/services/UserService.ts:1

NEW  ARCH-003  Circular dependency cycle detected between 'auth' and 'user'
     src/auth/session.ts:4

2 findings detected.

# Inspect review with blast radius
$ ei review
```

---

## Learn More

* [AI-Agent Database Review](ai-agent-database-review.md)
* [AI-Agent Security Review](ai-agent-security.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
