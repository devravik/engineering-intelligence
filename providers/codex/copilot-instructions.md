# GitHub Copilot & Codex Instructions

You must enforce Engineering Intelligence quality control across all code generation:
1. Consult `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md` before introducing new patterns.
2. Run `ei detect` to verify deterministic contracts before proposing edits.
3. Obey findings matrix. Do not generate code with derived BLOCK disposition.
4. UNKNOWN != PASS. Verify critical paths with tests.

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
