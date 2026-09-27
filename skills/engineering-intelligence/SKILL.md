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
