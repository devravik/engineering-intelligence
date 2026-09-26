# Development & Benchmarking Guide

This guide explains how to develop, test, benchmark, and extend Engineering Intelligence.

Whether you are adding a new command, authoring a framework-specific adapter, or refining anti-slop heuristics, this document outlines our engineering standards and evaluation processes.

---

## Repository Structure

```text
engineering-intelligence/
├── README.md              # Project landing page & quickstart
├── SKILL.md               # Universal executable agent skill definition
├── CONTRIBUTING.md        # Community contribution guide
├── LICENSE                # MIT License
├── docs/                  # Comprehensive documentation suite
│   ├── architecture.md    # System design & reasoning engine
│   ├── anti-slop.md       # Anti-slop taxonomy & 3-question heuristic
│   ├── context-system.md  # .ei/ directory architecture & schemas
│   ├── platforms.md       # Multi-platform installation guide
│   ├── development.md     # This file (development & benchmarking)
│   └── commands/          # Detailed command documentation
│       ├── overview.md
│       ├── init.md
│       ├── review.md
│       ├── simplify.md
│       ├── impact.md
│       ├── audit.md
│       └── ship.md
└── templates/             # Default .ei context templates
    ├── context.md
    ├── architecture.md
    ├── conventions.md
    ├── decisions.md
    ├── constraints.md
    └── design.md
```

---

## How Skills Are Evaluated

The core challenge in building AI agent skills is **evaluating non-deterministic outcomes**. How do we prove that Engineering Intelligence actually improves software output?

We evaluate Engineering Intelligence using three quantitative metrics:

### 1. Defect & Risk Detection Rate
We run commands against curated benchmark repositories containing planted real-world defects:
* Table-locking migrations on large tables
* Missing webhook timestamp tolerance (replay vulnerability)
* N+1 query loops in serializers
* Uncaught background job serialization discrepancies

**Goal:** Engineering Intelligence must detect ≥ 90% of planted critical risks, whereas unguided agents typically identify < 30%.

### 2. Slop & Entropy Reduction (LOC Delta)
We measure the delta in generated code volume when an agent implements a feature with and without Engineering Intelligence active.
* **Unguided Agent:** Frequently introduces 3 to 5 new files (interfaces, factories, abstract classes) for trivial CRUD operations.
* **With Engineering Intelligence (`/simplify`):** Consistently produces 50-80% fewer lines of code while delivering identical feature functionality and higher test coverage.

### 3. Signal-to-Noise Ratio (SNR)
In code reviews, we track the ratio of high-leverage findings (architectural, security, failure modes) vs. superficial cosmetic lints.
* **Target:** ≥ 80% of reported review findings must be categorized as `HIGH` or `CRITICAL`. Purely cosmetic nitpicks must not exceed 20%.

---

## Authoring Heuristics & Commands

When adding or modifying an Engineering Intelligence command in `SKILL.md`:

### 1. Enforce Concrete Steps Over Vague Prompting
* ❌ *Vague:* "Make sure the code looks clean and doesn't have bugs."
* ✅ *Concrete:* "Inspect `git diff`. For every modified function signature, search for all caller references across the workspace. Verify parameter counts and error return handling."

### 2. Constrain the Output Format
Agents must produce structured, scannable markdown utilizing the [Standard Finding Schema](./commands/overview.md#the-standard-finding-format). Unstructured narrative paragraphs are rejected.

### 3. Keep Heuristics Local & Zero-Dependency
Never introduce dependencies on external cloud APIs or closed web services. All analysis must be performable using local file reading, regex/grep search, AST tools, git, or compiler execution.

---

## Adding Framework Adapters

In Phase 6 of our roadmap, Engineering Intelligence introduces specialized framework packs. To propose or author an adapter:

1. Create a specification document in `docs/adapters/<framework>.md` (e.g., `laravel.md`, `nextjs.md`).
2. Define the framework's canonical directory layout and configuration files.
3. List common framework-specific anti-patterns (e.g., in Laravel: using raw DB queries instead of Eloquent models, or skipping form request authorization).
4. Provide concrete before/after code examples showing proper simplification.

---

## Packaging & The CLI Installer

The CLI installer (`npx engineering-intelligence install`) is packaged as an open-source Node.js utility.

* **Binary Entrypoint:** `bin/cli.js`
* **Agent Detection Engine:** Checks for existence of directories such as `~/.claude`, `~/.cursor`, and workspace `.agents`.
* **Zero Runtime Dependencies:** The installer uses native Node.js filesystem APIs to ensure instantaneous download and execution via `npx`.
