---
name: engineering-intelligence
description: Senior engineering quality control for Antigravity agents (detect, attribute, prioritize, repair, verify).
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

3. Finding Normalization (EIFinding)
   └── Normalize findings to canonical contract: ruleId, category, severity, evidence { file, line, snippet, hash }.

4. Baseline Attribution
   └── Reconcile via dynamic git merge-base against .ei/state/baseline.json.
   └── Distinguish BASELINE, NEW, MODIFIED, RESOLVED, and UNKNOWN findings.

5. Diagnostic Review & Recommendations
   └── Execute `ei review` to inspect disciplines, evidence, attribution, confidence, and recommendations.
   └── Address highlighted UNKNOWN areas with semantic reasoning or targeted coverage.

6. Actionable Simplification & Repair
   └── Eliminate single-use abstractions, pass-through factories, and echo comments via `ei simplify`.
   └── Re-run `ei detect` to verify behavioral invariance.

7. Release Verification Gate
   └── Execute `ei ship` before declaring any task complete or releasing.
   └── Enforces UNKNOWN != PASS (evaluates to BLOCK / FIX / SHIP).
```

---

## Command Routing

When the user invokes slash commands or asks for quality control, route directly to the local CLI and reference manuals:

* `/review` (or `ei review`): Diagnostic evaluation. Generates the structured discipline finding matrix, attribution, confidence scores, actionable recommendations, and highlighted UNKNOWN areas. (See [commands/review.md](commands/review.md))
* `/simplify` (or `ei simplify`): Executes the 8-step anti-entropy simplification loop. (See [commands/simplify.md](commands/simplify.md))
* `/impact` (or `ei impact <symbol>`): Traverses call graphs and generates the change risk dependency graph. (See [commands/impact.md](commands/impact.md))
* `/ship` (or `ei ship`): Enforces the terminal production release verification gate (`BLOCK / FIX / SHIP`, `UNKNOWN != PASS`). (See [commands/ship.md](commands/ship.md))

---

## Core Invariants

1. **Evidence Before Judgment:** A finding requires physical evidence (file, line, code snippet, cryptographic evidence hash).
2. **Conservative Completeness:** A detector finding means *"EI found concrete evidence matching this rule"*; it does *not* mean *"EI proved that no other instance exists."*
3. **UNKNOWN != PASS:** In release verification (`ei ship`), an unverified critical path or omitted test is a blocker, not a pass.
4. **No Unjustified Waivers:** Waivers in `.ei/ignores.json` or inline comments require an explicit `--reason`.
5. **Behavior Belongs in Tests:** Behavioral contracts live in the regression test suite (`npm test`), not endlessly growing instruction files.
