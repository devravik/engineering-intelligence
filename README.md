# Engineering Intelligence

<p align="center">
  <strong>Engineering quality control for AI coding agents.</strong><br>
  <em>Detect. Attribute. Prioritize. Repair. Verify.</em>
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
  <a href="tests/"><img src="https://img.shields.io/badge/Regression_Tests-Passing-brightgreen.svg" alt="Tests"></a>
  <a href="src/detectors/"><img src="https://img.shields.io/badge/Detectors-12_Deterministic_Rules-purple.svg" alt="Detectors"></a>
  <a href="providers/"><img src="https://img.shields.io/badge/Providers-Claude_|_Cursor_|_Codex_|_OpenCode-orange.svg" alt="Providers"></a>
</p>

---

Modern AI coding agents generate an immense volume of code very quickly. That introduces a critical failure mode:

### AI can produce technically valid software that is still bad software. It looks correct.

Large Language Models will cheerfully generate:
* 4-layer class indirection for a single database query (**ARCH-001**).
* Circular dependency cycles between domain services (**ARCH-003**).
* Pass-through Abstract Factories for singletons (**SLOP-001**).
* Tautological echo comments that verbatim restate the code (**SLOP-002**).
* Destructive migrations that lock production tables (**DB-003**).
* Mutating API endpoints with missing authorization guards (**API-001**).
* N+1 query loops inside serialization maps (**DB-002**).

Prompts alone cannot prevent this. **Maturity requires converting observed failures into deterministic contracts, baseline attribution, regression tests, and machine-derived dispositions.**

```text
Deterministic Evidence + Project Context + LLM Reasoning + Baseline Attribution + Regression Tests
= Engineering Intelligence
```

---

## Architecture: From Prompt Prose to Deterministic QC

```text
                      ENGINEERING INTELLIGENCE
                                 │
                 ┌───────────────┴───────────────┐
                 │                               │
           Reasoning Core                 Evidence Engine
                 │                               │
        ┌────────┼────────┐             ┌────────┼────────┐
        │        │        │             │        │        │
     Context  Intent   Priority        Git     Static  Runtime
        │        │        │             │        │        │
        └────────┼────────┘             └────────┼────────┘
                 │                               │
                 └───────────────┬───────────────┘
                                 ↓
                           Finding Matrix
                                 ↓
                       Fix / Simplify / Ship
                                 ↓
                            Verification
```

---

## Core Pillars

### 1. Deterministic Detector Engine (`ei detect`)
Deterministic inspection rules run locally without LLM token latency or hallucinations. Every finding is anchored to an exact file, line number, code snippet, and **cryptographic evidence hash**.

### 2. Baseline Attribution (No Blaming New Edits for Legacy Debt)
If your repository already has 84 legacy issues, Engineering Intelligence records them in `.ei/state/baseline.json`. When you make a change, EI attributes findings:
```text
BASELINE: 84 existing | THIS CHANGE: 2 new | 1 resolved
```
Only newly introduced debt affects your current session disposition.

### 3. Machine-Derived Review Matrix (`UNKNOWN != PASS`)
Instead of a vague, conversational essay, `ei review` outputs a structured finding matrix. The terminal disposition is mechanically derived:
* `BLOCKERS > 0` ➔ **`BLOCK`**
* `UNKNOWN > 0` ➔ **`BLOCK`** (`UNKNOWN != PASS`: unverified paths cannot pass)
* `FIX > 0` ➔ **`FIX`**
* Clean & verified ➔ **`SHIP`**

### 4. Mandatory Waiver Rationale
Exceptions cannot be silently disabled. The waiver system requires an explicit business or technical justification:
```bash
ei ignores add-rule ARCH-001 --reason "Required for external plugin architecture"
```

### 5. Regression Test Corpus (`fixtures/`)
Behavior lives in deterministic test contracts, not endlessly growing prompt instructions. Every observed agent failure is codified into a test fixture in `fixtures/` verified by `npm test`.

---

## The V0 Command Suite

| Command | Deterministic Action | Lifecycle Phase |
| :--- | :--- | :--- |
| **`ei init`** | Initializes `.ei/` context suite (`PROJECT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `state/`) | Setup / Onboarding |
| **`ei detect`** | Runs 12 high-confidence deterministic detectors with evidence hashes | Continuous QC |
| **`ei review`** | Generates discipline matrix and derives mechanical terminal disposition | Pre-Commit / PR |
| **`ei simplify`** | Runs 8-step anti-entropy loop; verifies LOC and abstraction reduction | Refactoring |
| **`ei impact <target>`** | Traverses dependency graph across APIs, jobs, tests, and database | Planning / Pre-Merge |
| **`ei ship`** | Enforces the 10-point production readiness verification gate | Release Gate |
| **`ei baseline`** | Snapshots and reconciles existing technical debt in `baseline.json` | Debt Management |
| **`ei ignores`** | Manages rule and file waivers with mandatory rationale | Compliance |

---

## Example: The Engineering Review Matrix

When you run `ei review` or ask your agent to `/review`:

```text
================================================================
                     ENGINEERING REVIEW MATRIX                  
================================================================

Discipline      Evidence    Impact        Confidence    Disposition
----------------------------------------------------------------
Architecture    ✓           HIGH          HIGH          FIX
Security        ✓           CRITICAL      HIGH          BLOCK
Database        ✓           NONE          NONE          SHIP
CodeQuality     ✓           LOW           HIGH          IGNORE
Testing         ~           MEDIUM        MEDIUM        REVIEW
Slop            ✓           HIGH          HIGH          FIX
----------------------------------------------------------------
ATTRIBUTION:
  Baseline: 42 existing | New: 2 | Resolved: 1

CURRENT STATE:
  BLOCKERS:  1
  FIX:       2
  ADVISORY:  3
  UNKNOWN:   0

================================================================
FINAL DISPOSITION: BLOCK
================================================================

DETAILED FINDINGS:
- [CRITICAL] API-001 (Security): Mutating route handler missing authorization guard
  File: src/api/users/delete.ts:4
  Baseline Status: NEW | Disposition: BLOCK
  Evidence: export async function DELETE(req, db)
  Fix: Add authentication middleware or verify user permissions before executing mutations.

- [HIGH] ARCH-001 (Architecture): Single-implementation interface 'IOrderService'
  File: src/services/OrderService.ts:1
  Baseline Status: NEW | Disposition: FIX
  Evidence: interface IOrderService
  Fix: Collapse 'IOrderService' directly into the concrete class until variation is required.
```

---

## Quickstart

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/devravik/engineering-intelligence.git
cd engineering-intelligence

# Install dependencies and link CLI
npm install
npm link
```

### 2. Initialize in Any Project

```bash
cd /path/to/your/project
ei init
```

This creates the persistent project context and state directories:
```text
.ei/
├── PROJECT.md          # Mission and detected stack baseline
├── ARCHITECTURE.md     # Layering rules and boundary invariants
├── CONVENTIONS.md      # Coding style, error handling, validation idioms
├── DECISIONS.md        # Architecture Decision Records (ADRs)
├── constraints.md      # Invariants, performance budgets, forbidden deps
├── ignores.json        # Scoped waivers with mandatory rationale
└── state/
    ├── baseline.json   # Known legacy baseline snapshot
    └── sessions/       # Ephemeral session inspection runs
```

### 3. Run Deterministic Quality Control

```bash
# Check changed files in active Git branch
ei detect --changed

# Review changes against baseline
ei review

# Run anti-entropy simplification
ei simplify src/

# Trace blast radius of a symbol
ei impact UserModel

# Pre-release gate check
ei ship
```

---

## Detector Catalog

| Rule ID | Category | Name | Detection Logic |
| :--- | :--- | :--- | :--- |
| **`ARCH-001`** | Architecture | `unnecessary-abstraction` | Single-implementation interfaces adding indirection without variation. |
| **`ARCH-002`** | Architecture | `duplicated-responsibility` | Multiple classes/modules sharing identical method responsibilities. |
| **`ARCH-003`** | Architecture | `circular-dependency` | Direct cyclical imports between modules (`A -> B` and `B -> A`). |
| **`ARCH-004`** | Architecture | `architecture-inconsistency` | Direct database persistence calls in client UI components. |
| **`CODE-001`** | CodeQuality | `duplicated-logic` | Identical multi-line code blocks duplicated across multiple files. |
| **`CODE-002`** | CodeQuality | `dead-code` | Unreferenced exported functions or classes in non-entrypoint files. |
| **`CODE-003`** | CodeQuality | `excessive-indirection` | Pass-through wrapper functions that merely delegate calls 1:1 without value-add. |
| **`CODE-004`** | CodeQuality | `unnecessary-dependency` | Production dependencies declared in package.json never imported anywhere. |
| **`CODE-005`** | CodeQuality | `overly-defensive-code` | Redundant optional chaining (`a?.b`) immediately inside `if (a)` guards. |
| **`API-001`** | Security | `missing-authorization` | Mutating route handlers (`POST/PUT/DELETE`) modifying DB without auth. |
| **`API-002`** | CodeQuality | `inconsistent-error-contract`| Swallowed exceptions in empty catch blocks destroying stack traces. |
| **`API-003`** | Security | `breaking-contract-change` | Breaking modifications to route signatures or public endpoint contracts. |
| **`API-004`** | CodeQuality | `duplicated-validation` | Redundant manual validation checks immediately after schema validation. |
| **`DB-001`** | Database | `missing-index` | Foreign key relation columns declared in schemas/SQL without indexes. |
| **`DB-002`** | Database | `n-plus-one` | Database queries executed synchronously inside iteration loops. |
| **`DB-003`** | Database | `unsafe-migration` | `ALTER TABLE ADD COLUMN NOT NULL` without `DEFAULT` on populated tables. |
| **`DB-004`** | Database | `destructive-migration` | Irreversible `DROP TABLE` or `DROP COLUMN` operations without waivers. |
| **`TEST-001`** | Testing | `changed-behavior-without-coverage` | Source files modified in a changeset with 0 test file updates. |
| **`TEST-002`** | Testing | `weak-assertion` | Weak or tautological assertions (`expect(true).toBe(true)`) generating fake coverage. |
| **`TEST-003`** | Testing | `missing-failure-path-coverage` | Services with explicit error throws whose tests cover only happy paths. |
| **`SLOP-001`** | Slop | `generic-abstraction` | Pass-through Factory classes wrapping single hardcoded concrete classes. |
| **`SLOP-002`** | Slop | `repeated-boilerplate` | Tautological echo comments that literally rephrase the following line. |
| **`SLOP-003`** | Slop | `speculative-infrastructure`| Extensible plugin/strategy registries with only 1 registered implementation. |
| **`SLOP-004`** | Slop | `unnecessary-configuration` | Phantom environment variables used in code missing from `.env.example`. |

---

## Provider Architecture: AGY + Codex + Claude Code

The Engineering Intelligence core is strictly provider-independent. Provider adapters translate identical capabilities into each agent's native skill, command, context, and hook mechanisms without duplicating the underlying engineering logic.

```text
Engineering Intelligence Core
        │
        ├── Claude Code
        ├── Codex
        ├── Cursor
        ├── OpenCode
        ├── Gemini CLI
        ├── GitHub Copilot
        └── Antigravity CLI (AGY)
```

> **Provider support:** Engineering Intelligence must support Antigravity CLI (AGY) as a first-class coding-agent environment alongside Claude Code, Codex, Cursor, OpenCode, Gemini CLI, and GitHub Copilot. Provider adapters must translate the same Engineering Intelligence capabilities into each agent's native skill, command, context, and hook mechanisms without duplicating the underlying engineering logic.

### Initial First-Class Triad

Rather than spreading thin across every agent immediately, Engineering Intelligence establishes full native parity across the initial three integrations: **AGY + Codex + Claude Code**.

#### 1. [Antigravity CLI (AGY)](providers/agy/) Adapter
Antigravity CLI receives a dedicated, first-class adapter containing:
* **Skill Installation & Discovery Format:** Progressive disclosure skill discovered natively at `.agents/skills/engineering-intelligence/SKILL.md` (project) or `~/.gemini/config/skills/engineering-intelligence/SKILL.md` (global).
* **Command Mappings:** Direct routing from AGY slash commands (`/review`, `/simplify`, `/impact`, `/ship`, `/detect`, `/init`, `/baseline`, `/ignores`) to deterministic `ei` subcommands.
* **Context & Project Initialization:** Dual initialization linking `.ei/` context suite (`PROJECT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`) with `.agents/rules/engineering-intelligence.md`.
* **Lifecycle Hook Integration:** Automated triggers in `.agents/hooks.json`:
  * `PostToolUse` (`replace_file_content`, `write_to_file`) ➔ immediately executes `ei detect --changed` in the background.
  * `Stop` hook ➔ runs `ei review` before session termination, guaranteeing zero new blockers.
  * Safe merging algorithm preserves existing user hooks in `hooks.json`.
* **Agent Invocation Instructions:** Clear directives instructing AGY agents on how to ground in `.ei/`, respond to hook alerts, and maintain the `UNKNOWN != PASS` invariant.
* **Output & Result Format:** Dual output supporting human-readable Markdown discipline matrices and machine-readable JSON finding schemas with SHA-256 evidence hashes.
* **Version & Capability Detection:** Active probing of `agy --version`, `.gemini/config`, and `.agents/` capabilities (`supportsSkills`, `supportsHooks`, `supportsRules`, `supportsSlashCommands`).
* **Safe Fallback:** Graceful fallback to manual CLI verification and static workspace rules whenever AGY CLI binary or hook execution is unavailable.

#### 2. [Claude Code](providers/claude/) Adapter
* Discovers `.claude/skills/engineering-intelligence/SKILL.md`.
* Maps slash commands (`/review`, `/simplify`, `/impact`, `/ship`) and terminal verification before concluding turns.

#### 3. [GitHub Copilot & Codex](providers/codex/) Adapter
* Directs code generation through `.github/copilot-instructions.md`.
* Enforces deterministic contracts before proposing diffs and requires zero-blocker reviews.

#### 4. Additional Adapters
* [Cursor](providers/cursor/) (`.cursorrules` / `.mdc`) and [OpenCode](providers/opencode/) (`plugin.json`).

### Synchronize All Providers
```bash
# Generate and synchronize all provider configurations from canonical core
ei sync-providers

# Install directly into current workspace (.agents/, .claude/, .github/)
ei sync-providers --install

```

---

## Regression Test Suite

All 24 detectors, attribution logic, waiver policies, and provider adapters are verified by automated tests against real code fixtures:

```bash
npm test
```

```text
✔ Baseline Attribution: distinguishes BASELINE vs NEW findings (1.9ms)
✔ CLI: ei --help outputs available command surface (807ms)
✔ CLI: ei detect --json returns structured JSON with summary (752ms)
✔ CLI: ei impact outputs dependency graph tree (735ms)
✔ CLI: ei sync-providers updates provider configurations (733ms)
✔ ARCH-001: detects single-implementation interface (5.3ms)
✔ ARCH-002: detects duplicated responsibility across classes (1.9ms)
✔ ARCH-004: detects direct database access in UI client component (1.7ms)
✔ CODE-003: detects excessive indirection and pass-through functions (1.4ms)
✔ DB-001: detects missing database index on foreign key column (1.6ms)
✔ DB-003: detects unsafe migration adding NOT NULL without DEFAULT (1.4ms)
✔ DB-002: detects N+1 database queries in loop (1.4ms)
✔ API-001: detects missing authorization guard on mutating handler (1.8ms)
✔ TEST-002: detects weak tautological assertions (1.7ms)
✔ SLOP-001: detects speculative pass-through factory (1.3ms)
✔ SLOP-002: detects tautological echo comments (1.3ms)
✔ SLOP-003: detects speculative plugin registries with 1 registration (1.1ms)
✔ Ignores: respects rule-level waiver (0.8ms)
✔ Ignores: respects inline disable comment (0.2ms)
✔ Providers: registry contains first-class providers (AGY, Claude, Codex) (0.7ms)
✔ AGY Adapter: detects capabilities and generates hooks & skill artifacts (88ms)
✔ Claude Adapter: generates skill artifact and maps commands (0.3ms)
✔ Codex Adapter: generates copilot-instructions.md (0.1ms)
✔ Reviewer: derives BLOCK when BLOCKERS > 0 (2.2ms)
✔ Reviewer: enforces UNKNOWN != PASS (0.2ms)
✔ Reviewer: derives FIX when high-impact issues exist without blockers (0.3ms)
✔ Reviewer: derives SHIP when zero blockers, zero fixes, zero unknowns (0.1ms)

27 passing (3.4s)
```

---

## Community & License

Engineering Intelligence is open source under the [MIT License](LICENSE).

* **Repository:** [github.com/devravik/engineering-intelligence](https://github.com/devravik/engineering-intelligence)
* **Author:** K Ravi ([dev.ravikgupt@gmail.com](mailto:dev.ravikgupt@gmail.com))
* **Contributions:** See [CONTRIBUTING.md](CONTRIBUTING.md) to add detectors or failure fixtures.

