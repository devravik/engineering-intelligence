# System Architecture & Reasoning Engine

Engineering Intelligence is not a code linter or an automated fixer. It is a **deterministic, context-anchored reasoning layer** designed to operate directly inside AI coding agents.

This document details the internal architecture, reasoning pipeline, and design principles of Engineering Intelligence.

---

## Conceptual Overview

Traditional code review and generation operates at the **syntax level**:

```text
Prompt ➔ AI Generation ➔ AST / Linter Check ➔ Output
```

While this catches syntax errors, type mismatches, and formatting issues, it cannot evaluate **architectural necessity, cognitive load, or domain alignment**.

Engineering Intelligence inserts an analytical reasoning layer before and after code generation:

```text
                         ENGINEERING INTELLIGENCE
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
1. Context Layer            2. Evidence Engine           3. Reasoning Core
   ├── .ei/ context suite      ├── Git diff & tree          ├── Anti-Slop filter
   ├── Framework detection     ├── AST symbol discovery     ├── Leverage ranking
   └── Existing conventions    └── Test & compiler outputs  └── Trade-off calculus
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    ▼
                         High-Leverage Verdict
                       (Categorized, Actionable)
```

---

## The Three Core Subsystems

### 1. The Context Engine
The Context Engine anchors all reasoning to the specific codebase.

* **Repository Scanner:** Inspects package manifests, build scripts, directory structures, and git logs to identify the active framework and paradigms.
* **`.ei/` Context Resolver:** Reads the project's explicit architectural guidelines (`.ei/architecture.md`), conventions (`.ei/conventions.md`), and recorded decisions (`.ei/decisions.md`).
* **Convention Baseline:** Disallows recommendations that contradict established patterns (e.g., forbidding Redux recommendations in an established Zustand codebase).

### 2. The Evidence Engine
Engineering Intelligence enforces the doctrine of **Evidence Before Judgment**. An agent is strictly prohibited from flagging theoretical issues without physical evidence.

The Evidence Engine leverages native agent tools:
* **Filesystem & Grep:** Verifies callers, count of implementations, and usage graphs.
* **Git History & Tree:** Compares current branch diffs, identifies modified boundaries, and detects un-idempotent migration changes.
* **Compiler & Test Runners:** Checks actual compiler diagnostics and test suite results.

### 3. The Reasoning & Anti-Slop Core
The Reasoning Core evaluates evidence against senior engineering principles:

* **Necessity Test:** Does this change introduce complexity that solves a real current problem?
* **Anti-Slop Filter:** Identifies single-use interfaces, gratuitous wrapper functions, echo comments, and cosmetic design patterns.
* **Blast Radius Calculation:** Computes upstream and downstream ripple effects across database schemas, APIs, and background queues.
* **Finding Ranking:** Sorts issues strictly by **operational risk and architectural leverage**, filtering out trivial cosmetic noise.

---

## The Execution Pipeline

When any command (e.g., `/ei:review` or `/ei:simplify`) is invoked, it passes through a standard 5-stage pipeline:

```text
Stage 1: Scope & Context Resolution
  └── Identify target files, diff ranges, and load .ei/ context rules.

Stage 2: Deterministic Evidence Gathering
  └── Inspect git diff, trace symbol references, check test runners.

Stage 3: Architectural & Anti-Slop Evaluation
  └── Test for single-use abstractions, boundary violations, and failure modes.

Stage 4: Risk Tiering & Finding Synthesis
  └── Categorize issues into CRITICAL, HIGH, MEDIUM, and NIT.
  └── Formulate runnable diffs and remediation steps.

Stage 5: Output Presentation
  └── Render standardized, concise, actionable report to the engineer.
```

---

## Local-First & Zero Telemetry Design

Engineering Intelligence is built from the ground up to be **strictly local**:

* **Zero Third-Party Cloud Dependencies:** No external API keys or cloud servers are queried.
* **Zero Telemetry or Data Collection:** Your proprietary codebase, commit history, and prompts never leave your local machine or your agent's private execution sandbox.
* **Portability:** Because it relies entirely on Markdown specifications, heuristic instructions, and standard agent capabilities, it works seamlessly across disparate environments.

---

## Extensibility & Modular Adapters

Engineering Intelligence is designed to support framework-specific intelligence packs (e.g., Laravel, Next.js, Go, Django, PostgreSQL) in Phase 6 of our roadmap.

Each adapter plugs into the Evidence Engine by providing:
1. **Framework-Specific Heuristics:** (e.g., detecting Laravel N+1 Eloquent relationships, Next.js Server/Client component boundary leaks, or Go goroutine leaks).
2. **Specialized Inspection Patterns:** Knowing exactly which config files, migrations, or route registries to inspect.
3. **Tailored Simplification Rules:** Removing framework-specific anti-patterns.
