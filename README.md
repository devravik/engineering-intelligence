# Engineering Intelligence

### Catch the problems AI coding agents introduce before they reach production.

**AI writes code faster. Engineering Intelligence checks whether it should ship.**

AI can write working code that is still bad engineering. It looks correct, passes syntax checks, and silently degrades your system:
- 4-layer class indirection for a single database query (**ARCH-001**).
- Circular dependency cycles between domain services (**ARCH-003**).
- Mutating API endpoints with missing authorization guards (**API-001**).
- N+1 query loops inside serialization maps (**DB-002**).
- Destructive migrations that lock production tables (**DB-003**).
- Swallowed exceptions in empty catch blocks (**API-002**).
- Outbound HTTP requests without timeouts (**API-005**).
- AI purple/blue gradients and card-in-card visual slop (**UI-COLOR-001**, **UI-SLOP-003**).

Engineering Intelligence gives coding agents a deterministic engineering quality gate for:
**Architecture · Security · APIs · Databases · Testing · Complexity · UI Quality**

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)
[![GitHub release](https://img.shields.io/github/v/release/devravik/engineering-intelligence)](https://github.com/devravik/engineering-intelligence/releases)
[![License](https://img.shields.io/github/license/devravik/engineering-intelligence)](https://github.com/devravik/engineering-intelligence)
[![npm](https://img.shields.io/npm/v/@devravik/engineering-intelligence)](https://www.npmjs.com/package/@devravik/engineering-intelligence)

---

## Quick Start

Install into any agent via the **[skills.sh](https://skills.sh/devravik/engineering-intelligence)** ecosystem (Claude Code, Cursor, Windsurf, Cline):
```bash
npx skills add devravik/engineering-intelligence
```

Or install via the official npm installer:
```bash
npx @devravik/engineering-intelligence install
```

Then run against your branch:
```bash
ei detect --changed
ei review
ei ship
```

**81 deterministic detectors** (32 code + 49 UI). Runs locally with zero LLM API cost and zero token latency.

---

## Run One Command Against Your AI-Generated Changes

Don't wait for code review to discover what your AI generated. Run `ei detect --changed` directly against your branch:

```bash
$ ei detect --changed

Engineering Intelligence · Active Branch Inspection

NEW  DB-002   N+1 query loop inside array iteration
     src/api/users.ts:84
     const invoice = await db.invoices.findFirst({ where: { userId: u.id } });

NEW  API-001  Mutating endpoint missing authorization guard
     src/routes/projects.ts:42
     export async function POST(req: Request) { ... }

NEW  ARCH-001 Single-implementation interface adds speculative indirection
     src/services/UserService.ts:1
     export interface IUserService { ... }

NEW  API-005  Outbound HTTP request executed without timeout or AbortSignal
     src/services/github.ts:72
     const res = await fetch("https://api.github.com/repos/...");

4 findings (4 NEW, 0 BASELINE)
```

Then evaluate the machine-derived review disposition:

```bash
$ ei review

══════════════════════════════════════════════════════════════
  ENGINEERING INTELLIGENCE · FINDING MATRIX REVIEW
══════════════════════════════════════════════════════════════

  CRITICAL  API-001  Missing authorization guard
  HIGH      DB-002   N+1 query in iteration loop
  HIGH      API-005  Unbounded HTTP request lacking timeout
  MEDIUM    ARCH-001 Single-implementation interface

  DERIVED DISPOSITION: BLOCK
  2 security issues · 1 database issue · 1 architecture issue
```

And enforce the pre-merge ship gate:

```bash
$ ei ship

══════════════════════════════════════════════════════════════
  ENGINEERING INTELLIGENCE · PRODUCTION READINESS GATE
══════════════════════════════════════════════════════════════

  [✗] Zero Blocker Findings (1 Blocker: API-001)
  [✗] Zero Fix-Required Findings (2 Fixes: DB-002, API-005)
  [✓] Behavioral Invariance (120 tests passed)
  [✓] Architectural Boundaries Honored
  [✗] UNKNOWN != PASS (1 unverified endpoint mutation)

  TERMINAL DISPOSITION: BLOCK
  Release blocked until blockers and unverified paths are resolved.
```

---

## 81 Problems AI Coding Agents Introduce

Don't audit generic code. Catch the specific failure modes AI coding agents introduce:

| What your AI generates | Why it breaks production | Detector Rule |
| :--- | :--- | :--- |
| **N+1 query loops** | Loops executing queries inside iteration instead of batching | [`DB-002`](docs/problems.md#1-database--orm-failures) |
| **Missing authorization checks** | Mutating API endpoints or server actions missing auth guards | [`API-001`](docs/problems.md#2-security--perimeter-vulnerabilities) |
| **Single-use interfaces & factories** | Speculative abstractions with exactly one implementation | [`ARCH-001`](docs/problems.md#3-architectural-decay--over-engineering), [`SLOP-001`](docs/problems.md#3-architectural-decay--over-engineering) |
| **Table-locking migrations** | Adding `NOT NULL` columns to existing tables without `DEFAULT` | [`DB-003`](docs/problems.md#1-database--orm-failures) |
| **Unbounded HTTP requests** | External `fetch()` calls without timeouts or AbortSignals | [`API-005`](docs/problems.md#4-code-quality--error-handling) |
| **AI purple/blue gradient UI slop** | Formulaic purple-to-indigo aesthetics & card-in-card nesting | [`UI-COLOR-001`](docs/problems.md#6-frontend--ai-ui-slop), [`UI-SLOP-003`](docs/problems.md#6-frontend--ai-ui-slop) |
| **Swallowed exceptions** | Empty `catch` blocks that discard stack traces and hide crashes | [`API-002`](docs/problems.md#4-code-quality--error-handling) |
| **Tautological echo comments** | Verbatim restating code lines without architectural rationale | [`SLOP-002`](docs/problems.md#4-code-quality--error-handling) |
| **Skipped & fake test assertions** | Writing `expect(true).toBe(true)` or committing `.skip` | [`TEST-002`](docs/problems.md#5-testing-anti-patterns), [`TEST-004`](docs/problems.md#5-testing-anti-patterns) |
| **Circular dependency cycles** | Direct cyclic imports between domain modules | [`ARCH-003`](docs/problems.md#3-architectural-decay--over-engineering) |

👉 **[See all 81 detector rules and failure patterns →](docs/problems.md)**

---

## Built for Every Major Agent Ecosystem

Install once with `npx skills add devravik/engineering-intelligence`:

* **[Claude Code](docs/ecosystems/claude-code.md)**: Native slash command `/ei`, Claude Code marketplace plugin, progressive skill disclosure.
* **[Cursor](docs/ecosystems/cursor.md)**: `.cursor/rules/` (`.mdc`), Composer boundary guards, MCP server integration.
* **[GitHub Copilot & Codex](docs/ecosystems/codex.md)**: `.github/copilot-instructions.md`, CLI verification loop.
* **[OpenCode](docs/ecosystems/opencode.md)**: Open-source terminal agent skill, plugin manifests.
* **[Google Antigravity (AGY)](docs/ecosystems/antigravity.md)**: Automated lifecycle hooks on tool edits (`PostToolUse`) and turn completion (`Stop`).
* **[Windsurf & Devin Desktop](docs/ecosystems/windsurf.md)**: `.windsurfrules` persistent directives for Cascade agent flows.
* **[Cline](docs/ecosystems/cline.md)**: VS Code autonomous agent rules (`.clinerules`) and verification.

---

## The Staff Engineer Cognition Cycle

Engineering Intelligence operates on a strict seven-stage cognition sequence:

```text
DETECT ──► ATTRIBUTE ──► UNDERSTAND ──► REASON ──► DECIDE ──► REPAIR ──► VERIFY
```

1. **DETECT**: Run 81 deterministic rules to gather physical evidence (file, line, snippet, hash).
2. **ATTRIBUTE**: Reconcile dynamic Git merge-base to separate legacy codebase debt (`BASELINE`) from newly introduced debt (`NEW`). Never blame the agent for existing debt.
3. **UNDERSTAND**: Consult durable project memory (`.ei/PROJECT.md`, `.ei/ARCHITECTURE.md`) before changing code.
4. **REASON**: Evaluate evidence against architectural contracts and risk matrices.
5. **DECIDE**: Mechanically derive terminal disposition (`BLOCK`, `FIX`, `REVIEW`, `SHIP`). Enforce `UNKNOWN != PASS`.
6. **REPAIR**: Eliminate dead abstractions, collapse pass-through wrappers, add missing guards.
7. **VERIFY**: Re-run test suites (`npm test`) and `ei detect` to prove behavioral invariance.

---

## Installation

The skill needs no runtime of its own. It provisions native skills, instructions, rules, and hooks into your agent harness, while the deterministic engine runs via npm or local CLI.

### Option 1: CLI installer (Recommended)

From the root of your project, run:

```bash
npx @devravik/engineering-intelligence install
```

This auto-detects active harness directories and installed CLIs (such as Antigravity, Claude Code, Codex, Cursor, OpenCode, Cline), lets you confirm or customize providers, and installs project-local or global skills.

- **Non-interactive / Scripted:**
  ```bash
  # Install for specific providers
  npx @devravik/engineering-intelligence install --providers=agy,claude,cursor --scope=project
  
  # Install globally across user config directories (~/.gemini, ~/.claude, etc.)
  npx @devravik/engineering-intelligence install --scope=global
  ```

- **Update Existing Installations:**
  ```bash
  npx @devravik/engineering-intelligence update
  ```

- **System Health Check (`doctor`):**
  ```bash
  npx @devravik/engineering-intelligence doctor
  ```

### Option 2: skills.sh Ecosystem (`npx skills add`)

Engineering Intelligence is automatically discoverable through [skills.sh](https://skills.sh/devravik/engineering-intelligence) — no separate submission required. The skills.sh catalogue is seeded by installation telemetry: once the repo is public with a valid `SKILL.md`, the first `npx skills add` invocation registers it.

```bash
# Install from GitHub source (canonical)
npx skills add https://github.com/devravik/engineering-intelligence --skill engineering-intelligence

# Or via GitHub shorthand:
npx skills add devravik/engineering-intelligence
```

This installs Engineering Intelligence into any skills.sh-compatible agent (Claude Code, Cursor, Windsurf, and others). The canonical skill resides in [`skills/engineering-intelligence/SKILL.md`](skills/engineering-intelligence/SKILL.md) with self-contained detector references, commands, anti-slop doctrine, and verification scripts.

> **Distribution pipeline:** `GitHub repo` → `skills.sh catalogue` (auto-discovered via install telemetry) → `npx skills add` → agent harness. No portal submission or approval step needed.

### Option 3: Claude Code Marketplace Plugin

Install the native Claude Code plugin with bundled skills and slash commands:

```text
/plugin marketplace add devravik/engineering-intelligence
```

> Claude Code only. Provides native `/detect`, `/review`, `/simplify`, `/impact`, `/ship`, and `/ui` commands with automated manifest version-lock parity.

### Option 4: Google Antigravity (AGY)

Antigravity is supported as a first-class P0 environment with dual-directory compatibility:

- **Project-Local:**
  Provisions `.agents/skills/engineering-intelligence/SKILL.md` and `.agent/skills/engineering-intelligence/SKILL.md`.
- **Global:**
  Provisions `~/.gemini/config/skills/engineering-intelligence/SKILL.md`.
- **Hooks:**
  Configures edit-time verification and pre-stop check hooks in `.agents/hooks.json`.
- **Zero Runtime Dependency:**
  AGY loads the skill's instructions directly; the EI engine is only invoked when deterministic checks or browser testing are requested.

### Option 5: Manual Copy & Direct Git

**Cursor:**
```bash
cp -r providers/cursor/.cursor your-project/
# Or copy rule: cp providers/cursor/.cursor/rules/engineering-intelligence.mdc your-project/.cursor/rules/
```

**OpenAI Codex & Copilot:**
```bash
cp providers/codex/codex.json your-project/
cp providers/copilot/.github/copilot-instructions.md your-project/.github/
```

**OpenCode:**
```bash
cp -r providers/opencode/.opencode your-project/
```

**Direct Git & Offline Environments:**
```bash
git clone https://github.com/devravik/engineering-intelligence.git
cd engineering-intelligence
npm install
npm link
```

---

## Diagnostic Verification (`ei doctor`)

Run `ei doctor` (or `npx @devravik/engineering-intelligence doctor`) to verify your environment, harnesses, detectors, hooks, and project context:

```text
================================================================
                 ENGINEERING INTELLIGENCE DOCTOR
================================================================

──── Installed & Detected Harnesses ────
  ✓ Antigravity CLI (AGY)    [P0] (.agents/skills/engineering-intelligence/SKILL.md)
  ✓ Claude Code              [P0] (.claude/skills/engineering-intelligence/SKILL.md)
  ✓ OpenAI Codex CLI         [P0] (.github/copilot-instructions.md)
  ✓ Cursor                   [P1] (.cursor/rules/engineering-intelligence.mdc)
  ✓ GitHub Copilot           [P2] (.github/copilot-instructions.md)

──── Capabilities & Engines ────
  ✓ 32 Engineering Detectors (Architecture, DB, Security, API, Slop)
  ✓ 49 UI Detectors (Typography, Color, Spatial, Slop, A11y, Responsive)
  ℹ Browser Engine: Static DOM & CSS analysis active (install Playwright for live captures)
  ✓ 5-Pass Visual Reasoning Engine (Questions, Distill, Layout, Typeset, Harden, Polish)
  ✓ Agent Client Protocol (ACP) & stdio MCP Server

──── Lifecycle Hooks ────
  ✓ Antigravity (AGY)   : Active edit-time and stop verification hooks in .agents/hooks.json
  ℹ Claude Code         : Supported via native skill discovery in .claude/skills/ and plugin marketplace
  ! Codex / Copilot     : Directives in .github/copilot-instructions.md require user approval per prompt

──── Project Context Suite ────
  ✓ .ei/PROJECT.md        Found
  ✓ .ei/ARCHITECTURE.md   Found
  ✓ .ei/DESIGN.md         Found
  ✓ Baseline Snapshot     Snapshot active (4 legacy issues tracked)

──── Claude Marketplace & Version Parity ────
  Package Version:        0.1.0
  ✓ .claude-plugin/plugin.json      (0.1.0)
  ✓ .claude-plugin/marketplace.json (0.1.0)
  ✓ Version Alignment:           100% aligned
================================================================
```

---

## The Quality Pipeline & Frozen Core

The core mental model and intellectual property of Engineering Intelligence is the deterministic evidence ➔ attribution ➔ reasoning ➔ verification pipeline:

```text
DETECTION ENGINE                     CONTEXT ENGINE
(32 code + 49 UI rules)               (Project Memory: .ei/)
       │                                       │
       └───────────────────┬───────────────────┘
                           ▼
                  FINDING NORMALIZER
                  (EIFinding Contract)
                           │
                           ▼
                  BASELINE ATTRIBUTION
              (Git Merge-Base Reconciliation)
                           │
                           ▼
                  STAFF-LEVEL REASONING
               (Anti-Slop & Restraint Doctrine)
                           │
                           ▼
                     REVIEW MATRIX
                 (Disposition Derivation)
                           │
                           ▼
                     RELEASE GATE
                 (ei ship: UNKNOWN != PASS)
```

### The Canonical Internal Finding Contract (`EIFinding`)

The **Finding Normalizer** acts as the stable interface boundary between raw deterministic analysis and reasoning layers:

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
    | "BASELINE"    // Pre-existing legacy debt
    | "NEW"         // Introduced in current changeset
    | "MODIFIED"    // Changed in current changeset
    | "RESOLVED"    // Fixed by current changeset
    | "UNKNOWN"     // Unverifiable without human review

  confidence: Confidence
  impact: Impact
  disposition: Disposition // BLOCK | FIX | REVIEW | IGNORE | SHIP
}
```

### Conservative Completeness (Evidence vs. Proof)
Deterministic detectors execute locally via fast AST and text matching without LLM token overhead:
* **A finding means EI found concrete evidence matching a rule.**
* It does **not** mean **EI proved that no other instance exists.**

Detection is grounded in physical code evidence; it does not claim formal mathematical absence in ambiguous or unanalyzed paths.

### Dynamic Git Merge-Base Attribution
EI distinguishes pre-existing legacy technical debt from newly introduced debt using dynamic Git merge-base reconciliation (`git merge-base origin/main HEAD`) against `.ei/state/baseline.json`:
```text
BASELINE: 84 existing | THIS CHANGE: 2 new | 1 modified | 1 resolved
```
Legacy debt is tracked, not blamed on current pull requests.

---

## Universal Provider Protocol: 16 Coding Agents Across 3 Surfaces

Rather than building 16 divergent, hard-coded adapters, Engineering Intelligence is structured around a **Standard Engineering Intelligence Protocol**. The core produces a unified quality control engine, which translates through 5 standard archetype drivers:

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

### The 2026 Agent Ecosystem Matrix

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

### Model Context Protocol (MCP) & Agent Client Protocol (ACP)

Engineering Intelligence includes a built-in stdio JSON-RPC server (`ei mcp`):

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

Exposed Tools: `ei_detect`, `ei_review`, `ei_simplify`, `ei_impact`, `ei_ship`, and `ei_ui`.

---

## Deterministic Detector Catalog

| Rule ID | Category | Name | Detection Logic |
| :--- | :--- | :--- | :--- |
| **`ARCH-001`** | Architecture | `unnecessary-abstraction` | Single-implementation interfaces adding indirection without variation. |
| **`ARCH-002`** | Architecture | `duplicated-responsibility` | Multiple classes/modules sharing identical method responsibilities. |
| **`ARCH-003`** | Architecture | `circular-dependency` | Direct cyclical imports between modules (`A -> B` and `B -> A`). |
| **`ARCH-004`** | Architecture | `architecture-inconsistency` | Direct database persistence calls in client UI components. |
| **`ARCH-005`** | Architecture | `hidden-shared-mutable-state` | Module-level mutable singletons/caches accessed across boundary functions. |
| **`CODE-001`** | CodeQuality | `duplicated-logic` | Identical multi-line code blocks duplicated across multiple files. |
| **`CODE-002`** | CodeQuality | `dead-code` | Unreferenced exported functions or classes in non-entrypoint files. |
| **`CODE-003`** | CodeQuality | `excessive-indirection` | Pass-through wrapper functions that merely delegate calls 1:1 without value-add. |
| **`CODE-004`** | CodeQuality | `unnecessary-dependency` | Production dependencies declared in package.json never imported anywhere. |
| **`CODE-005`** | CodeQuality | `overly-defensive-code` | Redundant optional chaining (`a?.b`) immediately inside `if (a)` guards. |
| **`CODE-006`** | CodeQuality | `compiler-suppression-directive`| Unconstrained TypeScript suppression (`@ts-ignore`, `@ts-nocheck`, `any` casts). |
| **`CODE-007`** | CodeQuality | `floating-unawaited-promise` | Floating, unawaited asynchronous promises on known async APIs in mutating handlers. |
| **`SEC-001`** | Security | `hardcoded-secret` | Embedded API keys, private tokens, or credentials in source code. |
| **`SEC-002`** | Security | `sql-injection` | Unescaped string interpolation or concatenation in raw SQL queries. |
| **`API-001`** | Security | `missing-authorization` | Mutating route handlers (`POST/PUT/DELETE`) modifying DB without auth. |
| **`API-002`** | CodeQuality | `inconsistent-error-contract`| Swallowed exceptions in empty catch blocks destroying stack traces. |
| **`API-003`** | Security | `breaking-contract-change` | Breaking modifications to route signatures or public endpoint contracts. |
| **`API-004`** | CodeQuality | `duplicated-validation` | Redundant manual validation checks immediately after schema validation. |
| **`API-005`** | Architecture | `unbounded-http-request` | Outgoing raw HTTP requests executed without explicit timeout or AbortSignal. |
| **`DB-001`** | Database | `missing-index` | Foreign key relation columns declared in schemas/SQL without indexes. |
| **`DB-002`** | Database | `n-plus-one` | Database queries executed synchronously inside iteration loops. |
| **`DB-003`** | Database | `unsafe-migration` | `ALTER TABLE ADD COLUMN NOT NULL` without `DEFAULT` on populated tables. |
| **`DB-004`** | Database | `destructive-migration` | Irreversible `DROP TABLE` or `DROP COLUMN` operations without waivers. |
| **`DB-005`** | Database | `multi-mutation-boundary` | Cross-entity multi-mutations executed without an atomic transaction. |
| **`TEST-001`** | Testing | `changed-behavior-without-coverage` | Source files modified in a changeset with 0 test file updates. |
| **`TEST-002`** | Testing | `weak-assertion` | Weak or tautological assertions (`expect(true).toBe(true)`) generating fake coverage. |
| **`TEST-003`** | Testing | `missing-failure-path-coverage` | Services with explicit error throws whose tests cover only happy paths. |
| **`TEST-004`** | Testing | `committed-focused-or-skipped-test` | Committed `.only`, `.skip`, `fit`, `xit` markers that bypass test suites. |
| **`SLOP-001`** | Slop | `generic-abstraction` | Pass-through Factory classes wrapping single hardcoded concrete classes. |
| **`SLOP-002`** | Slop | `repeated-boilerplate` | Tautological echo comments that literally rephrase the following line. |
| **`SLOP-003`** | Slop | `speculative-infrastructure`| Extensible plugin/strategy registries with only 1 registered implementation. |
| **`SLOP-004`** | Slop | `unnecessary-configuration` | Phantom environment variables used in code missing from `.env.example`. |

---

## Automated Test Suite

All 32 code detectors, 49 UI detectors, attribution logic, waiver policies, and provider adapters are verified by 119 automated regression tests:

```bash
npm test
```

---

## Community & License

Engineering Intelligence is open source under the [MIT License](LICENSE).

* **Repository:** [github.com/devravik/engineering-intelligence](https://github.com/devravik/engineering-intelligence)
* **Author:** Ravi Krishnan Gupta ([dev.ravikgupt@gmail.com](mailto:dev.ravikgupt@gmail.com))
* **Contributions:** See [CONTRIBUTING.md](CONTRIBUTING.md) to add detectors or failure fixtures.
