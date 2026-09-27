# Engineering Intelligence Command Reference

This guide explains how to invoke and route quality control commands across Engineering Intelligence.

---

## 1. Engineering Commands

### `/review` (or `ei review`)
Runs matrix-based engineering review on changed files:
- Distinguishes baseline legacy debt from newly introduced debt.
- Evaluates rule confidence and unknown paths.
- Yields a mechanical disposition: `BLOCK`, `FIX`, or `SHIP`.

### `/simplify` (or `ei simplify [path]`)
Runs the 8-step anti-entropy simplification loop:
- Eliminates single-use interfaces and pass-through factory functions.
- Strips tautological echo comments.
- Flattens unnecessary indirection while ensuring behavioral tests remain invariant.

### `/impact <symbol>` (or `ei impact <symbol>`)
Generates the symbol dependency graph:
- Computes upstream call-sites, database touchpoints, and API consumers.
- Classifies change risk score (LOW, MEDIUM, HIGH, CRITICAL).

### `/ship` (or `ei ship`)
Evaluates the 10-point release gate:
- Enforces `UNKNOWN != PASS` (any unverified critical path blocks release).
- Zero blockers, zero fixes, zero unverified paths required to pass.

---

## 2. UI Intelligence Commands

### `/ui` (or `ei ui [surface]`)
Runs the automated UI reasoning pipeline:
- Auto-detects surface type (`dashboard`, `landing`, `settings`, `developer-tool`).
- Evaluates 15 structured visual reasoning questions.
- Dynamically selects and executes only relevant workflows (`distill`, `layout`, `typeset`, `adapt`, `harden`, `polish`).

### `ei ui critique`
Executes the flagship 5-pass UI critique:
- **Pass 1:** Mechanical Evidence (DOM, CSS tokens, axe tree).
- **Pass 2:** Anti-Pattern Signals (AI slop, card overload, gradient clichés).
- **Pass 3:** Semantic Reasoning (Task clarity grounded against `DESIGN.md`).
- **Pass 4:** Actionable Interventions (`REMOVE`, `RESTRUCTURE`, `SIMPLIFY`, `RETYPE`, `RECOLOR`, `ADAPT`, `HARDEN`, `POLISH`).
- **Pass 5:** Browser Verification Plan (Before/After screenshot comparison).

### `ei ui distill`
Enforces the anti-slop doctrine: **"What can be removed before anything is added?"**
- Unwraps redundant card wrappers.
- Strips decorative badges and gratuitous gradient meshes.

### `ei ui adapt`
Tests responsive behavior across standard viewports (375px, 390px, 768px, 1024px, 1440px).

### `ei ui extract`
Applies restraint doctrine (3+ uses threshold) to recommend tokens to tokenize and components to share.

---

## 3. Distribution & Management Commands

### `ei install` (or `npx @devravik/engineering-intelligence install`)
Detects local and system coding agent harnesses (AGY, Claude, Codex, Cursor, etc.) and provisions skills, hooks, and rules.

### `ei update` (or `npx @devravik/engineering-intelligence update`)
Updates installed provider skills and rules from canonical core.

### `ei doctor` (or `npx @devravik/engineering-intelligence doctor`)
Audits installed harnesses, engine capabilities, lifecycle hooks, and project context.
