# Antigravity CLI (AGY) Provider Adapter

First-class provider adapter for **Google Antigravity CLI (AGY)**.

Engineering Intelligence integrates natively with Antigravity CLI, delivering automated, deterministic engineering quality control without polluting or duplicating core reasoning logic.

---

## Adapter Specifications

The AGY provider adapter implements 8 native integration contracts:

### 1. Skill Installation & Discovery Format
* **Workspace Discovery:** Discovered natively under `.agents/skills/engineering-intelligence/SKILL.md`.
* **Global Discovery:** Discovered across all projects via `~/.gemini/config/skills/engineering-intelligence/SKILL.md`.
* **Progressive Disclosure:** Exposes YAML frontmatter (`name: engineering-intelligence`, `description: ...`) for efficient token usage, with progressive drill-downs into commands, deterministic rules, and disciplinary criteria.

### 2. Command Mappings
Routes AGY slash commands directly to deterministic `ei` subcommands:
* `/review` ➔ `ei review` (Matrix evaluation and mechanical disposition)
* `/simplify` ➔ `ei simplify` (8-step anti-entropy refactoring loop)
* `/impact <target>` ➔ `ei impact <target>` (Dependency tree and blast radius analysis)
* `/ship` ➔ `ei ship` (10-point release gate verification)
* `/detect` ➔ `ei detect` (12-discipline deterministic rule execution)
* `/init` ➔ `ei init` (Context suite initialization)
* `/baseline` ➔ `ei baseline` (Legacy debt reconciliation)
* `/ignores` ➔ `ei ignores` (Waiver management with mandatory rationale)

### 3. Context & Project Initialization
* Initializes `.ei/` context suite (`PROJECT.md`, `ARCHITECTURE.md`, `CONVENTIONS.md`, `DECISIONS.md`, `constraints.md`).
* Cross-links `.ei/` context directly with `.agents/rules/engineering-intelligence.md` so AGY agents automatically ground decisions in repository memory.

### 4. Lifecycle Hook Integration (`hooks.json`)
Pre-configured lifecycle hooks in `.agents/hooks.json`:
* **`PostToolUse` Hook:** Triggers on `replace_file_content` and `write_to_file`. Runs `ei detect --changed` in background (15s timeout).
* **`Stop` Hook:** Triggers on session termination. Runs `ei review` (20s timeout) to ensure the final mechanical disposition is `SHIP`.
* **Non-Destructive Merge:** Merges safely with existing workspace `hooks.json` files without overwriting other hooks.

### 5. Agent Invocation Instructions
Direct instructions embedded in agent context instructing AGY agents to ground in `.ei/`, avoid speculative abstraction, and enforce `UNKNOWN != PASS`.

### 6. Output & Result Format
* Markdown discipline matrix with columns for Discipline, Evidence, Impact, Confidence, Attribution, and Terminal Disposition.
* Exact JSON finding schemas with SHA-256 evidence hashes.

### 7. Version & Capability Detection
* Detects AGY binary presence and version via `agy --version`.
* Evaluates capability matrix: `supportsSkills`, `supportsHooks`, `supportsRules`, `supportsSlashCommands`.

### 8. Safe Fallback Mode
* When the `agy` CLI binary is absent or hooks cannot run, automatically switches to fallback mode without crashing, guiding manual verification.

---

## Installation & Synchronization

```bash
# Generate/synchronize AGY adapter artifacts into providers/agy/
ei sync-providers

# Install directly into current workspace (.agents/skills, .agents/hooks.json, .agents/rules)
ei sync-providers --install
```
