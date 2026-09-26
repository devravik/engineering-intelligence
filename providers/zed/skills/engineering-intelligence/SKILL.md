---
name: engineering-intelligence
description: Engineering quality control for Zed (detect, attribute, prioritize, repair, verify). Enforces deterministic contracts, baseline attribution, and finding matrices.
---

# Engineering Intelligence (Zed)

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
   └── Obtain exact, machine-verified findings with cryptographic evidence hashes.

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

* `/review`: Generates structured discipline finding matrix and derived disposition.
* `/simplify`: Executes the 8-step anti-entropy simplification loop.
* `/impact <symbol>`: Traverses call graphs and generates the change risk dependency graph.
* `/ship`: Enforces the 10-point production readiness release gate.
* `/detect`: Runs 12-discipline deterministic inspection rules.

---

## Active Deterministic Rules
- **ARCH-001** (Architecture): Detects single-implementation interfaces that add indirection without supporting variation.
- **ARCH-002** (Architecture): Detects multiple services or modules with overlapping responsibilities and duplicated public methods.
- **ARCH-003** (Architecture): Detects direct circular dependencies between modules.
- **ARCH-004** (Architecture): Detects architectural boundary violations such as direct database persistence calls in client UI components.
- **CODE-001** (CodeQuality): Detects identical multi-line code blocks duplicated across multiple files.
- **CODE-002** (CodeQuality): Detects exported functions or classes that are never referenced across the codebase.
- **CODE-003** (CodeQuality): Detects pass-through wrapper functions that merely delegate calls 1:1 without value-add.
- **CODE-004** (CodeQuality): Detects production dependencies declared in package.json that are never imported anywhere in the project.
- **CODE-005** (CodeQuality): Detects redundant optional chaining or null assertions immediately inside non-null guard blocks.
- **API-001** (Security): Detects mutating API endpoints or server actions that modify state without authorization checks.
- **API-002** (CodeQuality): Detects swallowed exceptions in empty or unhandled catch blocks that destroy stack traces.
- **API-003** (Security): Detects breaking modifications to public API route signatures or contract definitions.
- **API-004** (CodeQuality): Detects redundant validation checks performed immediately after schema parser validation.
- **DB-001** (Database): Detects foreign key relation columns declared in SQL or schemas without accompanying indexes.
- **DB-002** (Database): Detects database or ORM queries invoked synchronously inside iteration loops.
- **DB-003** (Database): Detects table-locking migrations that add NOT NULL columns without DEFAULT values.
- **DB-004** (Database): Detects irreversible schema operations such as DROP TABLE or DROP COLUMN without explicit waivers.
- **TEST-001** (Testing): Detects source files modified in changes without corresponding test updates.
- **TEST-002** (Testing): Detects weak or tautological test assertions that simulate test coverage without verifying behavior.
- **TEST-003** (Testing): Detects services with critical error throws whose test files test only happy paths.
- **SLOP-001** (Slop): Detects pass-through Factory classes that merely wrap single concrete class instantiations.
- **SLOP-002** (Slop): Detects tautological echo comments that restate the code line verbatim without domain context.
- **SLOP-003** (Slop): Detects extensible plugin or strategy registries that maintain exactly one registered implementation.
- **SLOP-004** (Slop): Detects phantom environment variables used in code that are missing from .env.example documentation.

---

## Core Invariants

1. **Evidence Before Judgment:** A finding requires physical evidence (file, line, code snippet, evidence hash).
2. **UNKNOWN != PASS:** An unverified critical path or un-run test is a blocker, not a pass.
3. **No Unjustified Waivers:** Waivers in `.ei/ignores.json` or inline comments require an explicit `--reason`.
4. **Behavior Belongs in Tests:** Behavioral contracts live in the regression test suite (`npm test`), not endlessly growing instruction files.
