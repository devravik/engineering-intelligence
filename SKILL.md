---
name: engineering-intelligence
description: Engineering quality control for AI coding agents (detect, attribute, prioritize, repair, verify). Enforces deterministic contracts, baseline attribution, and finding matrices.
---

# Engineering Intelligence (EI)

Engineering Intelligence provides **engineering quality control for AI coding agents**.

Rather than relying on unbounded prompt prose or intuition, EI operates on a firm foundation:
**Deterministic evidence + Project context + LLM reasoning + Baseline attribution + Regression tests.**

---

## The Staff Engineer Protocol

When modifying, reviewing, or verifying code:

```text
1. Grounding (Context)
   └── Read .ei/PROJECT.md and .ei/ARCHITECTURE.md. Honor established boundaries.

2. Deterministic Detection
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
   └── Re-run `ei detect` to verify behavioral invariance and clean disposition.
```

---

## Command Routing

When the user invokes slash commands or asks for quality control, route directly to the local CLI and reference manuals:

* `/review` (or `ei review`): Generates the structured discipline finding matrix and derived disposition. (See [commands/review.md](commands/review.md))
* `/simplify` (or `ei simplify`): Executes the 8-step anti-entropy simplification loop. (See [commands/simplify.md](commands/simplify.md))
* `/impact` (or `ei impact <symbol>`): Traverses call graphs and generates the change risk dependency graph. (See [commands/impact.md](commands/impact.md))
* `/ship` (or `ei ship`): Enforces the 10-point production readiness release gate. (See [commands/ship.md](commands/ship.md))

---

## Core Invariants

1. **Evidence Before Judgment:** A finding requires physical evidence (file, line, code snippet, evidence hash).
2. **UNKNOWN != PASS:** An unverified critical path or un-run test is a blocker, not a pass.
3. **No Unjustified Waivers:** Waivers in `.ei/ignores.json` or inline comments require an explicit `--reason`.
4. **Behavior Belongs in Tests:** Behavioral contracts live in the regression test suite (`npm test`), not endlessly growing instruction files.
