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

## Frozen Core Architecture

```text
                     ENGINEERING INTELLIGENCE
                              │
                 ┌────────────┴────────────┐
                 │                         │
          Evidence Engine            Context Engine
                 │                         │
          ┌──────┼──────┐            Project Memory
          │      │      │
      Detectors Baseline Impact
          │      │      │
          └──────┼──────┘
                 ▼
          FINDING NORMALIZER
                 │
                 ▼
          LLM / Semantic Reasoning
                 │
                 ▼
           Review Matrix
              │     │
              │     └───────── ei review  (Diagnostic: findings, evidence, attribution, confidence, recommendations, UNKNOWN)
              │
              └─────────────── ei ship    (Release Gate: BLOCK / FIX / SHIP, enforcing UNKNOWN != PASS)
                              │
                    BLOCK / FIX / SHIP

                 Standard EI Protocol
                        │
        ┌───────┬───────┼───────┬───────┐
       AGY   Claude   Codex   OpenCode   ...
```

---

## The Seven-Stage Quality Pipeline

The core mental model and intellectual property of Engineering Intelligence is the deterministic evidence ➔ attribution ➔ reasoning ➔ verification pipeline:

```text
DETECT
  ↓  (Deterministic evidence engine finds concrete code evidence)
NORMALIZE
  ↓  (Finding Normalizer standardizes into canonical EIFinding contract)
ATTRIBUTE
  ↓  (Dynamic Git merge-base reconciles BASELINE vs NEW vs MODIFIED)
UNDERSTAND
  ↓  (Project Memory grounds domain rules: PROJECT.md, ARCHITECTURE.md)
REASON
  ↓  (Staff Engineer mental models: failure modes, anti-slop, restraint)
DECIDE
  ↓  (Review Matrix: recommendations, confidence, unknowns, disposition)
VERIFY
  ↓  (Release Gate via ei ship: test suites, zero blockers, UNKNOWN != PASS)
```

```text
Detectors
    ↓
Finding Normalizer
    ↓
Baseline Attribution
    ↓
Project Context
    ↓
LLM / Semantic Reasoning
    ↓
Review Matrix
    ↓
Verification (ei ship)
    ↓
REVIEW / FIX / BLOCK / SHIP
```

### 1. The Canonical Internal Finding Contract (`EIFinding`)
The **Finding Normalizer** acts as the stable interface boundary between raw deterministic analysis and reasoning layers. Every finding conforms to:

```ts
type EIFinding = {
  ruleId: string
  category: Category
  severity: Severity

  evidence: {
    file: string
    line: number
    snippet: string
    hash: string
  }

  attribution:
    | "BASELINE"
    | "NEW"
    | "MODIFIED"
    | "RESOLVED"
    | "UNKNOWN"

  confidence: Confidence
  impact: Impact
  disposition: Disposition
}
```

### 2. Conservative Completeness (Evidence vs. Proof)
Deterministic detectors execute locally via fast AST and text matching without LLM token overhead. Crucially, EI maintains a conservative contract around detection:
* **A finding means EI found concrete evidence matching a rule.**
* It does **not** mean **EI proved that no other instance exists.**

Detection is grounded in physical code evidence; it does not claim formal mathematical absence in ambiguous or unanalyzed paths.

### 3. Dynamic Git Merge-Base Attribution
EI distinguishes pre-existing legacy technical debt from newly introduced debt using dynamic Git merge-base reconciliation (`git merge-base origin/main HEAD`) against `.ei/state/baseline.json`:
```text
BASELINE: 84 existing | THIS CHANGE: 2 new | 1 modified | 1 resolved
```
Legacy debt is tracked, not blamed on current pull requests.

### 4. Explicitly Separated `review` and `ship` Semantics
EI prevents the diagnostic review process from becoming an unnecessarily rigid deployment gate:

```text
ei review
    → findings
    → physical evidence (file, line, snippet, hash)
    → attribution (BASELINE vs NEW vs MODIFIED)
    → confidence scores
    → actionable recommendations
    → UNKNOWN areas requiring engineering judgment

ei ship
    → release verification preconditions
    → strict enforcement: UNKNOWN != PASS
    → terminal verdict: BLOCK / FIX / SHIP
```

* `ei review` provides deep diagnostic insight, recommendations, and unverified areas without halting agent workflows prematurely.
* `ei ship` serves as the hard production gate where any unverified path or blocker yields `BLOCK`.

### 5. Mandatory Waiver Rationale
Exceptions cannot be silently disabled. The waiver system requires an explicit business or technical justification recorded in `.ei/ignores.json`:
```bash
ei ignores add-rule ARCH-001 --reason "Required for external plugin architecture"
```

### 6. Regression Test Corpus (`fixtures/`)
Behavior lives in deterministic test contracts, not endlessly growing prompt instructions. Every observed agent failure is codified into a test fixture in `fixtures/` verified by `npm test`.

---

## Command Suite

| Command | Deterministic Action | Lifecycle Phase |
| :--- | :--- | :--- |
| **`ei init`** | Initializes `.ei/` context suite (`PROJECT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `state/`) | Setup / Onboarding |
| **`ei detect`** | Runs 24 high-confidence deterministic detectors with SHA-256 evidence hashes and SARIF export | Continuous QC |
| **`ei review`** | Diagnostic evaluation: generates matrix, attribution, recommendations, and highlights UNKNOWN areas | Pre-Commit / PR |
| **`ei simplify`** | Runs 8-step anti-entropy loop; verifies LOC and abstraction reduction | Refactoring |
| **`ei impact <target>`** | Traverses dependency graph across APIs, jobs, tests, and database | Planning / Pre-Merge |
| **`ei ship`** | Enforces the production readiness verification gate (`BLOCK / FIX / SHIP`, `UNKNOWN != PASS`) | Release Gate |
| **`ei baseline`** | Snapshots and reconciles technical debt in `baseline.json` using merge-base resolution | Debt Management |
| **`ei ignores`** | Manages rule and file waivers with mandatory rationale | Compliance |
| **`ei sync-providers`** | Generates provider configs across 16 tools via 5 archetype drivers | Multi-Provider Sync |

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

## Universal Provider Protocol: 16 Coding Agents Across 3 Surfaces

Rather than building 16 divergent, hard-coded adapters, Engineering Intelligence is structured around a **Standard Engineering Intelligence Protocol**. 

The core produces a unified quality control engine, which translates through 5 standard archetype drivers:

```text
                     Engineering Intelligence Core
                                │
                     ┌──────────┴──────────┐
                     │   EI Core Engine    │
                     └──────────┬──────────┘
                                │ Standard EI Interface (Protocol)
        ┌───────────┬───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼
       CLI        Skills      Hooks      ACP/MCP     IDE Rules
        │           │           │           │           │
      Codex        AGY        Claude       Zed        Cursor
      Aider       Cline      OpenCode     Kilo        Copilot
      Gemini      Kilo                  OpenHands    Windsurf
                                          Devin       Augment
                                                       Junie
```

> **Provider support:** Engineering Intelligence must support Antigravity CLI (AGY) as a first-class coding-agent environment alongside Claude Code, Codex, Cursor, OpenCode, Gemini CLI, and GitHub Copilot. Provider adapters must translate the same Engineering Intelligence capabilities into each agent's native skill, command, context, and hook mechanisms without duplicating the underlying engineering logic.

---

### The 2026 Agent Ecosystem Matrix

Engineering Intelligence classifies and supports the complete modern agent landscape across 4 priority tiers:

| Priority | Coding Agent | Environment | Native Channels | Key Integration Points |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | **Antigravity CLI (AGY)** | Terminal / CLI | `skills`, `hooks` | Continuous reference implementation; `.agents/hooks.json` on `PostToolUse` and `Stop`; native `.agents/skills/`. |
| **P0** | **Claude Code** | Terminal / CLI | `skills` | Discovered via `.claude/skills/`; native slash commands (`/review`, `/simplify`, `/impact`, `/ship`). |
| **P0** | **OpenAI Codex CLI** | Terminal / CLI | `cli`, `ide_rules` | Terminal directives in `codex.json` and persistent `.github/copilot-instructions.md`. |
| **P0** | **OpenCode** | Terminal / CLI | `skills`, `cli` | Open-source terminal agent with `plugin.json` and progressive disclosure skills. |
| **P1** | **Cline** | IDE / Editor | `skills`, `ide_rules` | 5M+ installs, 60K+ stars; `.cline/skills/` specification and `.clinerules`. |
| **P1** | **Kilo Code / CLI** | IDE & Terminal | `skills`, `cli`, `acp_mcp` | Multi-surface agent spanning VS Code, JetBrains, and terminal with native MCP. |
| **P1** | **Cursor** | IDE / Editor | `ide_rules`, `acp_mcp` | `.cursor/rules/engineering-intelligence.mdc` and `.cursorrules`. |
| **P1** | **Gemini CLI** | Terminal / CLI | `cli` | Local repository grounding via `.gemini/context.md`. |
| **P1** | **Zed** | IDE / Editor | `skills`, `acp_mcp` | Agent Client Protocol (ACP) interoperability and `.zed/skills/`. |
| **P2** | **Aider** | Terminal / CLI | `cli` | Terminal-native pair programmer; auto-lints via `.aider.conf.yml` on every edit. |
| **P2** | **GitHub Copilot** | IDE / Editor | `ide_rules` | Enterprise directives via `.github/copilot-instructions.md`. |
| **P2** | **Augment Code** | IDE / Editor | `ide_rules` | Large-codebase monorepo intelligence via `.augment/instructions.md`. |
| **P2** | **Windsurf / Devin Desktop** | IDE / Editor | `ide_rules` | Devin Desktop lineage rules via `.windsurfrules`. |
| **P2** | **JetBrains Junie** | IDE / Editor | `ide_rules` | JetBrains ecosystem guidelines via `.junie/guidelines.md`. |
| **P3** | **OpenHands** | Autonomous / Cloud | `acp_mcp`, `cli` | Autonomous agent integration via `.openhands/mcp.json`. |
| **P3** | **Devin (Cloud)** | Autonomous / Cloud | `acp_mcp`, `ide_rules` | Cloud sandbox execution instructions via `.devin/instructions.md`. |

---

### Universal Interoperability via MCP & ACP (`ei mcp`)

Engineering Intelligence includes a built-in JSON-RPC stdio **Model Context Protocol (MCP)** and **Agent Client Protocol (ACP)** server. Any agent supporting MCP (such as Zed, Kilo Code, Devin, OpenHands, or Claude Desktop) can connect directly:

```json
{
  "context_servers": {
    "engineering-intelligence": {
      "command": "ei",
      "args": ["mcp"]
    }
  }
}
```

Exposed MCP Tools:
- **`ei_detect`**: Runs deterministic detectors on changed files or entire workspace.
- **`ei_review`**: Evaluates finding matrix and derives mechanical terminal disposition (`BLOCK`, `FIX`, `REVIEW`, `IGNORE`, `SHIP`).
- **`ei_simplify`**: Executes the 8-step anti-entropy simplification loop.
- **`ei_impact`**: Traverses call graphs and calculates blast radius for any symbol or file.
- **`ei_ship`**: Verifies the 10-point production release gate.

---

### Synchronizing Providers

Generate or update configuration artifacts across all 16 providers with a single command:

```bash
# View all supported coding agents and priority tiers
ei providers

# Synchronize all 16 providers from canonical core
ei sync-providers

# Synchronize only P0 and P1 tier providers
ei sync-providers --tier P0,P1

# Install directly into current workspace (.agents/, .claude/, .github/, .cursor/, .zed/, etc.)
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
* **Author:** Ravi Krishnan Gupta ([dev.ravikgupt@gmail.com](mailto:dev.ravikgupt@gmail.com))
* **Contributions:** See [CONTRIBUTING.md](CONTRIBUTING.md) to add detectors or failure fixtures.

