# Engineering Intelligence

Engineering quality control for AI coding agents. 1 canonical skill, 18 commands, live browser iteration, dynamic baseline attribution, and 81 deterministic detector rules (32 code + 49 UI).

> **Quick start:** From your project root, run `npx @devravik/engineering-intelligence install`, then run `ei init` (or `/ei init`) inside your AI coding tool. Full docs: [github.com/devravik/engineering-intelligence](https://github.com/devravik/engineering-intelligence).

---

## Why Engineering Intelligence?

Modern AI coding agents generate an immense volume of code very quickly. That introduces a critical failure mode:

### AI can produce technically valid software that is still bad software. It looks correct.

Large Language Models will cheerfully generate:
- 4-layer class indirection for a single database query (**ARCH-001**).
- Circular dependency cycles between domain services (**ARCH-003**).
- Pass-through Abstract Factories for singletons (**SLOP-001**).
- Tautological echo comments that verbatim restate the code (**SLOP-002**).
- Destructive migrations that lock production tables (**DB-003**).
- Mutating API endpoints with missing authorization guards (**API-001**).
- N+1 query loops inside serialization maps (**DB-002**).
- AI purple/blue gradients and card-in-card visual slop (**UI-COLOR-001**, **UI-SLOP-003**).

Prompts alone cannot prevent this. Engineering Intelligence adds:
- **One setup flow.** `ei init` records durable project truth in `.ei/` (`PROJECT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `DESIGN.md`, `constraints.md`), so agents understand architecture without hallucinating boundaries.
- **18 commands.** A shared engineering vocabulary with your AI: `detect`, `review`, `simplify`, `impact`, `ship`, `doctor`, `ui critique`, `ui audit`, `ui distill`, and more.
- **81 deterministic detector rules** (32 code + 49 UI). Runs locally with zero LLM API costs and zero token latency.
- **Dynamic Git merge-base attribution.** Distinguishes legacy debt from regressions in new changes (`BASELINE` vs `NEW`).
- **Staff-level release verification.** Mechanical dispositions (`BLOCK`, `FIX`, `REVIEW`, `SHIP`) enforcing `UNKNOWN != PASS`.

---

## What's Included

### The Skill: engineering-intelligence

The skill installs as a native command across supported AI coding tools:

```bash
/ei <command> <target>
# or in terminal:
ei <command> <target>
```

Start every new project with:

```bash
ei init
# or `/ei init` in your agent chat
```

`init` inspects the project, discovers the active tech stack, and initializes the durable `.ei/` context suite:

```text
.ei/
├── PROJECT.md          # Mission, core domains, and detected stack baseline
├── ARCHITECTURE.md     # Layering rules, dependency boundaries, invariants
├── CONVENTIONS.md      # Coding style, error handling, validation idioms
├── DESIGN.md           # Visual design system tokens, typography, surfaces
├── DECISIONS.md        # Architecture Decision Records (ADRs)
├── constraints.md      # Invariants, performance budgets, forbidden deps
├── ignores.json        # Scoped waivers with mandatory justification
└── state/
    ├── baseline.json   # Known legacy baseline snapshot
    └── sessions/       # Ephemeral session inspection runs
```

### Commands

All commands are accessible directly via the CLI or through your agent's native `/ei` slash interface:

| Command | What it does |
| :--- | :--- |
| `ei init` | One-time setup: inspect stack, record project memory, write `.ei/` context suite |
| `ei detect` | Run deterministic rules on changed files (`--changed`) or entire workspace |
| `ei review` | Evaluate findings matrix, reconcile baseline attribution, derive disposition |
| `ei simplify` | 8-step anti-entropy simplification loop: eliminate dead code, collapse indirection |
| `ei impact <symbol>` | Blast radius & dependency graph traversal: trace callers, risks, dependents |
| `ei ship` | Pre-merge release gate: verifies 10 production checks, enforces `UNKNOWN != PASS` |
| `ei baseline` | Snapshot or display known legacy technical debt without penalizing new PRs |
| `ei ignores` | Manage scoped waivers and rule suppressions with mandatory rationale |
| `ei doctor` | Audit installed harnesses, capabilities, detectors, hooks, and marketplace parity |
| `ei install` | Auto-detect AI agent harnesses and provision native skills, hooks, and rules |
| `ei update` | Re-synchronize installed provider configurations and skills from canonical core |
| `ei ui detect` | Deterministic frontend rules: typography, color, spacing, composition, slop |
| `ei ui audit` | Technical UI audit: accessibility (WCAG AA), responsive matrix, tokens |
| `ei ui critique` | Two-pass critique: mechanical compliance + visual/UX heuristic reasoning |
| `ei ui distill` | Anti-slop distillation: remove unnecessary wrappers, cards, and decoration |
| `ei ui document` | Reverse-engineer existing styles into a clean, canonical `DESIGN.md` |
| `ei mcp` | Start stdio Model Context Protocol (MCP) & Agent Client Protocol (ACP) server |
| `ei providers` | Inspect all 16 supported coding agents, environments, and priority tiers |
| `ei sync-providers` | Synchronize provider artifacts across P0-P3 tiers from canonical core |

#### Usage Examples

```bash
ei detect --changed           # Check changed files in active Git branch
ei review                     # Review changes with machine-derived disposition
ei simplify src/services/     # Strip pass-through wrappers and singletons
ei impact UserModel           # Check blast radius before refactoring
ei ship                       # Run release gate verification before merging
ei ui critique src/components # Run 5-pass UI & accessibility critique
```

### Anti-Patterns & Slop Doctrine

Engineering Intelligence enforces explicit constraints against common AI-generated antipatterns:

- **No speculative indirection:** Don't create single-implementation interfaces or factories (`ARCH-001`, `SLOP-001`).
- **No echo comments:** Don't write comments that simply restate the line of code (`SLOP-002`).
- **No unhandled exceptions:** Don't swallow errors in empty catch blocks or destroy stack traces (`API-002`).
- **No N+1 queries:** Don't execute database queries inside map/filter/loops (`DB-002`).
- **No unindexed foreign keys:** Don't define relational keys without index backing (`DB-001`).
- **No unconstrained HTTP:** Don't make external network calls without timeouts or AbortSignals (`API-005`).
- **No generic AI aesthetics:** Don't use purple-to-blue gradients, card-in-card nesting, or low-contrast text (`UI-COLOR-001`, `UI-SLOP-003`).

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

### Option 2: Universal Agent Skills Ecosystem (`npx skills add`)

For skill-native agents adopting the open Agent Skills standard, install directly from the canonical skill definition without any custom CLI:

```bash
# Universal skill installation
npx skills add https://github.com/devravik/engineering-intelligence --skill engineering-intelligence

# Or via GitHub shorthand:
npx skills add devravik/engineering-intelligence --skill engineering-intelligence
```

The canonical skill resides in [`skills/engineering-intelligence/SKILL.md`](skills/engineering-intelligence/SKILL.md) with self-contained detector references, commands, anti-slop doctrine, and verification scripts.

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
