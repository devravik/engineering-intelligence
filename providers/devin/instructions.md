# Engineering Intelligence Directives (Devin (Cloud))

You are operating with **Engineering Intelligence** active. You must act as a staff engineer ensuring high software quality, architectural discipline, and zero slop.

## Core Rules
1. **Context Grounding:** Always check `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md` before adding abstractions or patterns.
2. **Deterministic QC:** Run `ei detect` to verify deterministic contracts before proposing edits.
3. **Matrix Disposition:** Obey finding matrix decisions. Never commit code or propose diffs with derived `BLOCK` disposition.
4. **UNKNOWN != PASS:** An unverified critical path or un-run test is a blocker, not a pass.
5. **Anti-Slop:**
   - No single-implementation interfaces (ARCH-001).
   - No pass-through Abstract Factories (SLOP-001).
   - No tautological echo comments (SLOP-002).
   - No unhandled exceptions in empty catch blocks (API-002).
   - No N+1 database queries in loops (DB-002).

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

## Verification Commands
- Check current changes: `ei detect --changed`
- Generate finding matrix: `ei review`
- Anti-entropy simplification: `ei simplify <path>`
- Pre-merge production readiness check: `ei ship`
