---
name: engineering-intelligence
description: Senior engineering quality control for Antigravity agents (detect, attribute, prioritize, repair, verify).
---

# Engineering Intelligence (EI) — Antigravity Skill

Engineering Intelligence provides **senior engineering quality control for AI coding agents**.

Rather than relying on unbounded prompt prose or intuition, EI operates on a firm foundation:
**Deterministic evidence + Project context + LLM reasoning + Baseline attribution + Regression tests.**

---

## The Seven-Stage Mental Model

When modifying, reviewing, or verifying code, execute these seven cognitive stages in strict sequence:

```text
1. DETECT
   └── Run deterministic rules to gather physical evidence (file, line, snippet, hash).
       Contract: A finding means EI found concrete evidence matching a rule.

2. NORMALIZE
   └── Standardize raw matches into the canonical EIFinding contract:
       ruleId, category, severity, evidence { file, line, snippet, hash }.

3. ATTRIBUTE
   └── Reconcile against baseline via dynamic Git merge-base (origin/main HEAD).
       Distinguish BASELINE, NEW, MODIFIED, RESOLVED, and UNKNOWN findings.
       Never blame the current session for pre-existing legacy debt.

4. UNDERSTAND
   └── Ground in project context (.ei/PROJECT.md, .ei/ARCHITECTURE.md, .ei/CONVENTIONS.md).
       Respect established boundaries, tenancy models, and database constraints.

5. REASON
   └── Apply Staff Engineer judgment: failure mode analysis, anti-slop, blast radius,
       and the Restraint Doctrine (when to leave working code alone).

6. DECIDE
   └── Build the diagnostic Review Matrix (`ei review`): actionable recommendations,
       confidence ratings, impact, and highlighted UNKNOWN investigation targets.

7. VERIFY
   └── Execute the release verification gate (`ei ship`): enforce UNKNOWN != PASS.
       Verify tests pass, zero blockers exist, and all contracts are satisfied.
```

---

## The Cognitive Order of Operations (What to Think About, in What Order)

### Phase 1: Pre-Flight Invariant Grounding (Before Writing Any Code)
1. Read `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md`. Identify non-negotiable boundaries:
   - What layer is allowed to talk to the database?
   - What authentication and authorization policies govern mutating actions?
   - How are tenant boundaries isolated?
2. Run `ei impact <target>` to compute the dependency graph. Know the callers and dependents before touching a file.

### Phase 2: The Restraint Assessment (When to LEAVE CODE ALONE)
The mark of a Principal Engineer is knowing what **not** to change. Apply the **Restraint Doctrine**:
* **Never refactor innocent bystander code:** If an adjacent function or file is not in the direct blast radius of your task, **leave it alone**.
* **Respect working idiosyncrasies:** Code that is verbose or non-standard, but battle-tested and covered by tests, has earned its right to exist. Do not "clean up" working legacy code on a whim.
* **No unsolicited library migrations:** If the project uses `fetch`, do not introduce `axios`. If it uses `Yup`, do not introduce `Zod`.
* **Zero syntactic churn:** Do not reformat code, rewrite working `for` loops into `reduce`, or reorder object keys unless actively modifying that logic.

### Phase 3: What to Actively Challenge (The Principal Engineer Scrutiny)
When writing or reviewing code, actively challenge these common AI failure modes:
1. **Clean Architecture Cosplay & Premature Abstraction:**
   - Challenge single-implementation interfaces (`ARCH-001`). If there is only one `UserService`, write `UserService`, not `IUserService` + `UserServiceImpl`.
   - Challenge pass-through factories (`SLOP-001`). If a factory instantiates a single concrete class, delete the factory and instantiate directly.
   - Challenge one-item extensible registries (`SLOP-003`). Do not build a plugin architecture for a single hardcoded provider.
   - Challenge tautological echo comments (`SLOP-002`). Delete comments that merely restate the code line verbatim.
   - Challenge defensive null gymnastics (`CODE-005`). Do not add optional chaining inside blocks that already assert presence.
2. **Security & Perimeter Guarantees:**
   - Challenge any mutating endpoint (`POST/PUT/DELETE/PATCH` or server action) touching state without authorization guards (`API-001`).
   - Ask: *"Can Tenant A access or modify Tenant B's resource by manipulating IDs in the request?"*
3. **Database & Data Integrity:**
   - Challenge queries inside iteration loops (`DB-002`). Always batch queries with `IN (...)` or joins.
   - Challenge foreign key columns lacking index coverage (`DB-001`).
   - Challenge table-locking migrations (`DB-003`). Adding `NOT NULL` without `DEFAULT` on existing large tables causes production downtime.
4. **Reliability & Failure Modes:**
   - Challenge swallowed exceptions (`API-002`). Empty `catch {}` blocks destroy root-cause stack traces.
   - Challenge unbounded operations: all list endpoints must enforce `LIMIT` and pagination.
   - Challenge unconfigured external network requests: every HTTP/RPC call must specify an explicit timeout and retry policy.
5. **Testing Authenticity:**
   - Challenge fake coverage (`TEST-002`). Reject tautological assertions (`expect(true).toBe(true)`) and tests that mock the entire system under test.
   - Challenge happy-path-only test suites (`TEST-003`). Verify failure paths, timeouts, and rollbacks.
   - Challenge behavioral modifications lacking tests (`TEST-001`). If behavior changes, a test must prove it.

### Phase 4: Turning Evidence into High-Quality Engineering Decisions
* **Evidence is an inquiry, not an automatic blind rewrite.**
* When `ei detect` flags a violation:
  1. Inspect the physical code evidence (file, line, code snippet, and hash).
  2. Consult project context: Is this an intentional architectural pattern?
  3. **If legitimate exception:** Do not disable checks with bare comments. Author an explicit waiver with mandatory rationale:
     `ei ignores add-rule <RULE-ID> --reason "<business or technical justification>"`
  4. **If actual debt:** Fix the root cause. Prefer **simplification over layer-addition**. Delete indirection rather than wrapping it in another helper.
  5. **Prove Behavioral Invariance:** Re-run test suites (`npm test`) and `ei detect` to verify that the fix solved the debt without introducing regressions.

---

## Command Routing & Operations

When the user invokes commands or asks for quality control, route directly to the local CLI and reference manuals:

* `/review` (or `ei review`): **Diagnostic Evaluation.** Generates discipline finding matrix, physical evidence, baseline attribution, confidence scores, recommendations, and highlighted UNKNOWN areas.
* `/ship` (or `ei ship`): **Terminal Release Gate.** Enforces production readiness preconditions and the strict `UNKNOWN != PASS` invariant. Evaluates to `BLOCK`, `FIX`, or `SHIP`.
* `/simplify` (or `ei simplify`): **Anti-Entropy Loop.** Analyzes and executes candidate structural simplifications (deletes single-use interfaces, pass-through factories, and dead wrappers).
* `/impact` (or `ei impact <symbol>`): **Blast Radius Traversal.** Computes full dependency call graph across APIs, database models, and test suites.
* `ei detect`: **Deterministic Evidence Engine.** Runs 24 high-speed inspection rules and returns physical evidence hashes and SARIF v2.1.0 exports.
* `ei baseline`: **Debt Snapshot & Reconcile.** Manages `.ei/state/baseline.json` via dynamic Git merge-base attribution.
* `ei ignores`: **Waiver Management.** Records tracked waivers with mandatory justifications.

---

## Active Deterministic Rules Catalog
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

1. **Evidence Before Judgment:** A finding requires physical evidence (file, line, code snippet, cryptographic evidence hash).
2. **Conservative Completeness:** A detector finding means *"EI found concrete evidence matching this rule"*; it does *not* mean *"EI proved that no other instance exists."*
3. **UNKNOWN != PASS:** In release verification (`ei ship`), an unverified critical path or omitted test is a blocker, not a pass.
4. **The Restraint Doctrine:** If working code is not part of the active task's blast radius and conforms to baseline debt, leave it alone.
5. **No Unjustified Waivers:** Waivers in `.ei/ignores.json` or inline comments require an explicit `--reason`.
6. **Behavior Belongs in Tests:** Behavioral contracts live in the regression test suite (`npm test`), not endlessly growing instruction files.
