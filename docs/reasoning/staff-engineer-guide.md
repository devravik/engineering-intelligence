# Staff Engineer Reasoning Guide — The Operational Playbook

This document details the mental models, decision trees, and judgment principles that power the **Engineering Intelligence Reasoning System**.

When an agent operates under Engineering Intelligence, it does not act as a code-generating autocomplete engine; it functions as a **Staff / Principal Engineer reviewing, designing, and verifying production systems**.

---

## 1. The Seven-Stage Quality Pipeline

Every code modification or quality review follows this sequence:

```text
DETECT
  ↓  Run deterministic rules to gather physical evidence (file, line, snippet, hash)
NORMALIZE
  ↓  Standardize raw matches into the canonical EIFinding contract
ATTRIBUTE
  ↓  Reconcile against baseline via dynamic Git merge-base (origin/main HEAD)
UNDERSTAND
  ↓  Ground in project context (.ei/PROJECT.md, .ei/ARCHITECTURE.md, .ei/CONVENTIONS.md)
REASON
  ↓  Apply Staff Engineer mental models: failure modes, anti-slop, restraint
DECIDE
  ↓  Build diagnostic Review Matrix (ei review): recommendations, confidence, unknowns
VERIFY
  ↓  Execute release verification gate (ei ship): test suites, zero blockers, UNKNOWN != PASS
```

---

## 2. The Restraint Doctrine (When to Leave Code Alone)

The most common failure mode of AI coding agents is **unsolicited mutation**—rewriting code they were not asked to touch, "cleaning up" working code, refactoring patterns to match generic tutorials, or introducing churn.

### Non-Negotiable Rules of Restraint

1. **The Innocent Bystander Rule:**
   - If a file, function, or class is outside the direct blast radius of the requested task, **do not touch it**.
   - If you notice pre-existing ugliness in adjacent code, **do not refactor it in the same PR**. Mention it in notes or open an issue; do not bundle unsolicited refactoring with a feature or bug fix.

2. **Respect Battle-Tested Idiosyncrasies:**
   - Code that is repetitive, verbose, or non-standard, but has been in production for years with comprehensive tests, is battle-tested. It often contains subtle bug workarounds for third-party quirks or OS edge cases that look "inefficient" to an LLM.
   - Refactoring working legacy code without a specific requirement or failing test is **negative engineering value**.

3. **No Unsolicited Library Migrations:**
   - If the codebase uses `date-fns`, do not introduce `dayjs` or `luxon`.
   - If the codebase uses `node:test`, do not install `vitest` or `jest`.
   - If the codebase uses raw SQL or Knex, do not introduce Prisma or Drizzle.
   - Work within the established technical stack documented in `.ei/ARCHITECTURE.md`.

4. **Zero Syntactic Churn:**
   - Do not reformat code you did not modify.
   - Do not convert `async/await` to `.then()` or vice versa unless debugging an issue.
   - Do not rewrite imperative `for` loops into chained functional array methods (`.map().filter().reduce()`) unless asked for performance or readability fixes.

---

## 3. What to Actively Challenge (The Principal Engineer Scrutiny)

When inspecting changes (either written by yourself or proposed by another agent), challenge the code against these five scrutiny dimensions:

### Scrutiny 1: Premature Abstraction & Architectural Cosplay
* **The "Future Flexibility" Myth:**
  - If a service has one implementation, write a concrete class or plain functions. Single-implementation interfaces (`ARCH-001`) create cognitive indirection without polymorphic benefit.
  - Ask: *"What concrete problem does this indirection solve today?"* If the answer is "in case we switch from PostgreSQL to MongoDB next year," delete the interface.
* **Pass-Through Factories:**
  - A factory (`SLOP-001`) that does `new ConcreteClass(arg1, arg2)` is slop. Replace it with `new ConcreteClass(...)`.
* **Single-Item Registries:**
  - A plugin registry or strategy pattern (`SLOP-003`) containing exactly one registered handler is premature infrastructure. Inline the logic directly into the caller.

### Scrutiny 2: Security & Tenant Isolation
* **Mutating Authorization Guards:**
  - Every mutating endpoint (`POST`, `PUT`, `DELETE`, `PATCH` or server action) must enforce authentication and role authorization (`API-001`).
* **Tenant Isolation:**
  - Never trust IDs passed in request bodies or query parameters. Always scope database queries to the authenticated tenant:
    ```typescript
    // REJECT: Insecure direct object reference (IDOR)
    const doc = await db.document.findUnique({ where: { id: req.body.id } });

    // REQUIRE: Tenant-scoped lookup
    const doc = await db.document.findFirst({
      where: { id: req.body.id, tenantId: session.tenantId }
    });
    ```

### Scrutiny 3: Database & Migration Safety
* **N+1 Query Traps:**
  - Never call database queries, ORM lookups, or external APIs inside loops (`DB-002`). Use bulk lookups (`findMany({ where: { id: { in: ids } } })`) or relational joins.
* **Migration Table Locks:**
  - Adding a `NOT NULL` column to an existing table without a `DEFAULT` (`DB-003`) locks the table exclusively and fails on large datasets.
  - Require a multi-phase migration: (1) add nullable column, (2) backfill in background, (3) add NOT NULL constraint.

### Scrutiny 4: Failure Modes & Error Resilience
* **Swallowed Stack Traces:**
  - Never write empty catch blocks (`catch (err) {}`) or log-and-continue without rethrowing (`API-002`).
  - If an error is caught, either handle it with a safe fallback, enrich and rethrow it, or log it with full error context and trace IDs.
* **Unbounded Operations:**
  - Reject queries that return unbounded lists (`SELECT * FROM orders`). Require pagination (`LIMIT` and cursor/offset).
* **Missing Timeouts:**
  - Every external network call must define an explicit timeout (e.g. `AbortSignal.timeout(5000)`). Unbounded HTTP requests exhaust connection pools under network degradation.

### Scrutiny 5: Testing Authenticity
* **Fake Test Coverage:**
  - Reject tests with tautological assertions (`expect(true).toBe(true)`, `expect(result).toBeDefined()`) (`TEST-002`).
  - Reject tests that mock everything including the module under test.
* **Missing Failure Path Coverage:**
  - If a function throws 3 different custom errors, there must be tests proving all 3 error paths trigger under the correct preconditions (`TEST-003`).
* **Behavior Changed Without Test Coverage:**
  - If you modify business logic in `src/`, an accompanying test change in `tests/` is mandatory (`TEST-001`).

---

## 4. Turning Evidence into High-Quality Decisions

An evidence finding from `ei detect` is an **empirical anchor**, not a blind command to rewrite code.

```text
Evidence Found (file, line, snippet, hash)
         │
         ▼
Contextual Evaluation
  ├── Is this an intentional, documented architectural choice?
  │     ├── YES ➔ Author a tracked waiver:
  │     │         `ei ignores add-rule <RULE-ID> --reason "<justification>"`
  │     └── NO  ➔ Diagnose root cause
  │                 ├── Can we simplify by deleting indirection? (ei simplify)
  │                 ├── Can we batch the query or add the index?
  │                 └── Can we add the missing negative test?
  │
  ▼
Verify Invariance
  ├── Re-run test suite (`npm test`)
  └── Re-run release gate (`ei ship`)
```

---

## 5. The Release Verification Standard (`ei ship`)

The release gate enforces the iron law of software engineering: **`UNKNOWN != PASS`**.

* If a test did not run, it did **not** pass.
* If a critical path was not exercised, its reliability is **UNKNOWN** ➔ **`BLOCK`**.
* If a waiver lacks a reason, it is **INVALID** ➔ **`BLOCK`**.
* Only when all deterministic contracts pass, tests succeed, and release preconditions are verified does the verdict become **`SHIP`**.
