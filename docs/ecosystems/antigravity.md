# Engineering Intelligence for Antigravity (AGY)

Stop Antigravity agents from shipping bad code. First-class support for AGY progressive disclosure skills, lifecycle hooks, and workspace rules.

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)

Antigravity CLI (AGY) is Google's advanced agentic coding environment. Engineering Intelligence was designed from day one with first-class Antigravity support, leveraging lifecycle hooks (`PostToolUse`, `Stop`) to automatically audit files after edits and verify release readiness before concluding turns.

---

## 1-Command Installation

Install into your Antigravity project:

```bash
npx skills add devravik/engineering-intelligence
```

Or install native AGY skills, hooks, and rules:

```bash
npx @devravik/engineering-intelligence install --provider agy
```

Verify your installation:

```bash
ei --version
```

This provisions:
- `.agents/skills/engineering-intelligence/SKILL.md` (progressive disclosure skill)
- `.agents/hooks.json` (auto-detect on `replace_file_content` & `write_to_file`)
- `.agents/rules/engineering-intelligence.md` (workspace-level engineering directives)

---

## Automated Lifecycle Hooks

Antigravity executes hooks automatically:

1. **On Every Tool Edit (`PostToolUse`)**:
   Runs `ei detect --changed` in the background after any file modification. If an architectural boundary or security rule is broken, the agent sees the finding immediately in the next step.

2. **On Agent Turn Completion (`Stop`)**:
   Runs `ei review` to ensure no unresolved blockers exist before the agent returns control to the user.

---

## Antigravity Slash Commands

You can invoke Engineering Intelligence commands directly in chat:

- `/ei init`: Initialize project memory in `.ei/`
- `/ei detect --changed`: Run deterministic detection on changed files
- `/ei review`: Generate structured finding matrix
- `/ei simplify <path>`: Anti-entropy simplification loop
- `/ei impact <symbol>`: Change risk and dependency analysis
- `/ei ship`: Pre-merge production readiness check
- `/ei ui audit`: Rendered interface and accessibility audit
