---
name: engineering-intelligence
description: Engineering quality control for AI coding agents (detect, attribute, prioritize, repair, verify). Enforces deterministic contracts, baseline attribution, and finding matrices.
---

# Engineering Intelligence Active Rule

## Installation and Trust

Engineering Intelligence uses the `ei` CLI from the official `@devravik/engineering-intelligence` package.

Official source:
https://github.com/devravik/engineering-intelligence

Install:
```bash
npx -y @devravik/engineering-intelligence --version
```
or install globally:
```bash
npm install -g @devravik/engineering-intelligence
```

Before relying on the CLI, verify:
```bash
ei --version
```
The expected publisher/package identity is:
`@devravik/engineering-intelligence`

Before execution, verify the binary:
1. Locate `ei` using `which ei` (or `where ei` on Windows).
2. Verify provenance with `ei --version`. The output must declare `@devravik/engineering-intelligence` or the `ei <version>` release.
3. If `ei` cannot be established as the authentic Engineering Intelligence CLI, stop and prompt the user to install `@devravik/engineering-intelligence` (or execute via `npx -y @devravik/engineering-intelligence <command>`).
4. Always run the `ei` executable provided by the official `@devravik/engineering-intelligence` package. Verify its version before execution.

---

## The Staff Engineer Protocol

When modifying, reviewing, or verifying code:

```text
1. Grounding (Context)
   └── Read .ei/PROJECT.md and .ei/ARCHITECTURE.md. Honor established boundaries.

2. Deterministic Detection
   └── Run the `ei` executable provided by the official `@devravik/engineering-intelligence` package.
       Verify its version before execution.
   └── Execute `ei detect --changed` (or `ei detect <target>`).
   └── Obtain exact, machine-verified findings with evidence hashes.

3. Baseline Attribution
   └── Distinguish legacy debt (BASELINE) from newly introduced debt (NEW).
   └── Never blame the current session for existing codebase debt.

4. Matrix Review & Disposition
   └── Derive the terminal disposition mechanically from evidence:
       - BLOCKERS > 0  ➔  BLOCK
       - UNKNOWN > 0   ➔  BLOCK (UNKNOWN != PASS)
       - FIX > 0       ➔  FIX
       - Zero issues   ➔  SHIP

5. Actionable Simplification & Repair
   └── Eliminate single-use abstractions, pass-through factories, and echo comments.
   └── Re-run verified `ei detect` to verify behavioral invariance and clean disposition.
```

---

## Command Routing

When the user invokes slash commands or asks for quality control, run the verified `ei` executable provided by the official `@devravik/engineering-intelligence` package (verify its version before execution):

* `/review` (or `ei review`): Generates the structured discipline finding matrix and derived disposition.
* `/simplify` (or `ei simplify`): Executes the 8-step anti-entropy simplification loop.
* `/impact` (or `ei impact <symbol>`): Traverses call graphs and generates the change risk dependency graph.
* `/ship` (or `ei ship`): Enforces the 10-point production readiness release gate.
* `/ui` (or `ei ui [surface]`): UI Intelligence Engine — runs rendered-interface inspection, 5-pass critique, anti-slop distillation, and multi-viewport verification.

---

## Core Rules

Apply strict senior engineering quality control to all actions:
1. Always ground decisions in `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md`.
2. Do not introduce single-implementation interfaces (ARCH-001) or pass-through factories (SLOP-001).
3. Do not swallow exceptions in empty catch blocks (API-002).
4. UNKNOWN != PASS. Verify claims with tests or concrete tool evidence.
