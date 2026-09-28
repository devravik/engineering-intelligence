---
name: engineering-intelligence
description: Senior engineering quality control for Antigravity agents (detect, attribute, prioritize, repair, verify).
---

# Engineering Intelligence (AGY Active Skill)

You are operating with **Engineering Intelligence** enabled under Antigravity CLI.

---
name: engineering-intelligence
description: Review and improve AI-generated software for architecture, security, APIs, databases, testing, complexity, UI quality, and AI slop. Uses evidence, project context, and verification.
---

# Engineering Intelligence (EI)

Engineering Intelligence provides **engineering quality control for AI coding agents**.

Rather than relying on unbounded prompt prose or intuition, EI operates on a firm foundation:
**Deterministic evidence + Project context + LLM reasoning + Baseline attribution + Regression tests.**

---

## Installation and Trust

Engineering Intelligence uses the `ei` CLI from the official `@devravik/engineering-intelligence` npm package.

### Installation
```bash
npm install -g @devravik/engineering-intelligence
```

### Verification
Verify the installation and binary provenance:
```bash
ei --version
which ei
```

The CLI source and release history are maintained in:
- GitHub Repository: [https://github.com/devravik/engineering-intelligence](https://github.com/devravik/engineering-intelligence)
- Official npm Package: [https://www.npmjs.com/package/@devravik/engineering-intelligence](https://www.npmjs.com/package/@devravik/engineering-intelligence)

Do not install an unrelated executable named `ei` or execute an unverified `ei` binary from an untrusted source.

### Self-Verifying CLI Protocol
Before executing commands, the agent verifies the `ei` CLI binary:
1. Locate `ei` using `which ei` (or `where ei` on Windows).
2. Verify provenance with `ei --version`. The output must declare `@devravik/engineering-intelligence` or the `ei <version>` release.
3. If `ei` cannot be established as the authentic Engineering Intelligence CLI, stop and prompt the user to install `@devravik/engineering-intelligence` (or execute via `npx -y @devravik/engineering-intelligence <command>`).
4. Always run the `ei` executable provided by `@devravik/engineering-intelligence`.

---

## The Staff Engineer Protocol

When modifying, reviewing, or verifying code:

```text
1. Grounding (Context)
   └── Read .ei/PROJECT.md and .ei/ARCHITECTURE.md. Honor established boundaries.

2. Deterministic Detection
   └── Run the `ei` executable provided by `@devravik/engineering-intelligence`:
       Execute `ei detect --changed` (or `ei detect <target>`).
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

When the user invokes slash commands or asks for quality control, run the verified `ei` executable provided by `@devravik/engineering-intelligence` (or reference local manuals):

* `/review` (or `ei review`): Generates the structured discipline finding matrix and derived disposition. (See [references/commands.md](references/commands.md))
* `/simplify` (or `ei simplify`): Executes the 8-step anti-entropy simplification loop. (See [references/commands.md](references/commands.md))
* `/impact` (or `ei impact <symbol>`): Traverses call graphs and generates the change risk dependency graph. (See [references/commands.md](references/commands.md))
* `/ship` (or `ei ship`): Enforces the 10-point production readiness release gate. (See [references/commands.md](references/commands.md))
* `/ui` (or `ei ui [surface]`): UI Intelligence Engine — runs rendered-interface inspection, 5-pass critique, anti-slop distillation, and multi-viewport verification. (See [references/commands.md](references/commands.md))

---

## Core Invariants

1. **Evidence Before Judgment:** A finding requires physical evidence (file, line, code snippet, evidence hash).
2. **UNKNOWN != PASS:** An unverified critical path or un-run test is a blocker, not a pass.
3. **No Unjustified Waivers:** Waivers in `.ei/ignores.json` or inline comments require an explicit `--reason`.
4. **Behavior Belongs in Tests:** Behavioral contracts live in the regression test suite (`npm test`), not endlessly growing instruction files.


## Active Deterministic Rules
- **SEC-001** (Security): Detects hardcoded secrets, private keys, and high-entropy authentication tokens with confidence tiering.
- **SEC-002** (Security): Detects raw SQL queries constructed using direct string interpolation with data-flow risk classification.
- **ARCH-001** (Architecture): Detects single-implementation interfaces that add indirection without supporting polymorphism or architectural inversion.
- **ARCH-002** (Architecture): Detects multiple services or modules with overlapping responsibilities and duplicated public methods.
- **ARCH-003** (Architecture): Detects direct circular dependencies between modules.
- **ARCH-004** (Architecture): Detects architectural boundary violations such as direct database persistence calls in client UI components.
- **ARCH-005** (Architecture): Detects module-level request-specific mutable state in server routes mutated across concurrent requests.
- **CODE-001** (CodeQuality): Detects identical multi-line code blocks duplicated across multiple files.
- **CODE-002** (CodeQuality): Detects exported functions or classes that are never referenced across the codebase.
- **CODE-003** (CodeQuality): Detects pass-through wrapper functions that merely delegate calls 1:1 without value-add.
- **CODE-004** (CodeQuality): Detects production dependencies declared in package.json that are never imported anywhere in the project.
- **CODE-005** (CodeQuality): Detects redundant optional chaining or null assertions immediately inside non-null guard blocks.
- **CODE-006** (CodeQuality): Detects compiler suppression directives (@ts-ignore, @ts-nocheck) and gratuitous "as any" type casts in application code.
- **CODE-007** (CodeQuality): Detects floating, unawaited asynchronous promises on known async APIs in mutating handlers.
- **API-001** (Security): Detects mutating API endpoints or server actions that modify state without authorization checks.
- **API-002** (CodeQuality): Detects swallowed exceptions in empty or unhandled catch blocks that destroy stack traces.
- **API-003** (Security): Detects breaking modifications to public API route signatures or contract definitions.
- **API-004** (CodeQuality): Detects redundant validation checks performed immediately after schema parser validation.
- **API-005** (Architecture): Detects outgoing raw HTTP requests executed without an explicit timeout, AbortSignal, or configured client wrapper.
- **DB-001** (Database): Detects foreign key relation columns declared in SQL or schemas without accompanying indexes.
- **DB-002** (Database): Detects database or ORM queries invoked synchronously inside iteration loops.
- **DB-003** (Database): Detects table-locking migrations that add NOT NULL columns without DEFAULT values.
- **DB-004** (Database): Detects irreversible schema operations such as DROP TABLE or DROP COLUMN without explicit waivers.
- **DB-005** (Database): Detects potential multi-mutation consistency boundaries across entities executed without an atomic transaction.
- **TEST-001** (Testing): Detects source files modified in changes without corresponding test updates.
- **TEST-002** (Testing): Detects weak or tautological test assertions that simulate test coverage without verifying behavior.
- **TEST-003** (Testing): Detects services with critical error throws whose test files test only happy paths.
- **TEST-004** (Testing): Detects committed disabled or focused test cases (.skip, .only, xit, fit) that bypass or silence test suites.
- **SLOP-001** (Slop): Detects pass-through Factory classes that merely wrap single concrete class instantiations.
- **SLOP-002** (Slop): Detects tautological echo comments that restate the code line verbatim without domain context.
- **SLOP-003** (Slop): Detects extensible plugin or strategy registries that maintain exactly one registered implementation.
- **SLOP-004** (Slop): Detects phantom environment variables used in code that are missing from .env.example documentation.
