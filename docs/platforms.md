# Cross-Platform Installation & Setup Guide

Engineering Intelligence is designed to be cross-platform and agent-agnostic. Whether you use **Claude Code**, **Cursor**, **Codex**, **GitHub Copilot**, **Google Antigravity**, or **OpenCode**, you can install and run Engineering Intelligence natively.

---

## Quick Install (Recommended)

The fastest way to install Engineering Intelligence across all your coding environments is via the CLI installer:

```bash
npx engineering-intelligence install
```

The installer automatically detects the AI coding harnesses present on your machine, prompts you for target environments, and configures the relevant skill files and slash command aliases.

```text
Engineering Intelligence Installer

Detected Coding Environments:
  [x] Claude Code        (~/.claude/skills)
  [x] Cursor             (~/.cursor/rules)
  [x] Google Antigravity (~/.gemini/config/skills)
  [ ] OpenCode

Configuring skills...
✓ Installed /ei:init
✓ Installed /ei:review
✓ Installed /ei:simplify
✓ Installed /ei:impact
✓ Installed /ei:audit
✓ Installed /ei:ship

Installation complete!
```

---

## Manual Installation by Platform

If you prefer to configure your environments manually or need project-specific isolation, follow the instructions below.

---

### 1. Claude Code

Claude Code supports custom skills located in user-level or project-level skill directories.

#### Project-Level Setup:
From your repository root:
```bash
mkdir -p .claude/skills/engineering-intelligence
cp SKILL.md .claude/skills/engineering-intelligence/SKILL.md
```

#### Global Setup:
```bash
mkdir -p ~/.claude/skills/engineering-intelligence
cp SKILL.md ~/.claude/skills/engineering-intelligence/SKILL.md
```

Once installed, reload Claude Code. You can invoke commands directly as:
```text
/review
/simplify
/impact
/audit
/ship
```

---

### 2. Cursor

Cursor utilizes `.cursor/rules` to govern agent reasoning across a workspace.

#### Setup:
1. Create a rule file in your project:
   ```bash
   mkdir -p .cursor/rules
   ```
2. Create `.cursor/rules/engineering-intelligence.mdc`:
   ```markdown
   ---
   description: Senior Engineering Intelligence reasoning layer and anti-slop rules
   globs: *
   ---

   # Engineering Intelligence Active Rules

   Always load and respect .ei/context.md and .ei/architecture.md if present.
   Enforce the Anti-Slop Specification:
   - Reject single-implementation interfaces.
   - Disallow gratuitous wrapper functions.
   - Delete echo comments that restate code.
   - Follow importance over cosmetic polish.
   ```
3. Copy command instructions into your Cursor prompts or agent commands.

---

### 3. Google Antigravity / Gemini CLI

Google Antigravity natively loads skills containing a `SKILL.md` file.

#### Project Setup:
```bash
mkdir -p .agents/skills/engineering-intelligence
cp SKILL.md .agents/skills/engineering-intelligence/SKILL.md
```

#### Global Setup:
```bash
mkdir -p ~/.gemini/config/skills/engineering-intelligence
cp SKILL.md ~/.gemini/config/skills/engineering-intelligence/SKILL.md
```

Antigravity will automatically index the skill and provide the full command suite.

---

### 4. GitHub Copilot & Codex

For GitHub Copilot Workspace and Codex CLI, add the core reasoning directives to your repository's custom instructions:

```bash
mkdir -p .github
```

Create or append to `.github/copilot-instructions.md`:
```markdown
# Engineering Intelligence Instructions

Before implementing solutions:
1. Consult .ei/architecture.md and .ei/conventions.md.
2. Formulate the smallest coherent solution.
3. Eliminate unnecessary abstractions and boilerplate (Anti-Slop).
4. Verify blast radius before altering shared data structures or APIs.
```

---

### 5. OpenCode & Windsurf

In OpenCode or Windsurf, include the root `SKILL.md` inside your agent's system prompt or global knowledge directory (`~/.opencode/skills/engineering-intelligence/SKILL.md`).

---

## Verifying Your Installation

To confirm that Engineering Intelligence is active in any agent:

1. Open a workspace and send:
   ```text
   /ei:init
   ```
2. The agent should respond by scanning the repository and offering to generate the `.ei/` context suite.
3. Test a review command:
   ```text
   /ei:review
   ```
4. The agent should perform an evidence-based review adhering to the standardized finding format.
