# Claude Code Provider Adapter

This adapter maps Engineering Intelligence commands directly into Claude Code.

## Installation for Claude Code

From repository root:
```bash
mkdir -p ~/.claude/skills/engineering-intelligence
cp skills/engineering-intelligence/SKILL.md ~/.claude/skills/engineering-intelligence/SKILL.md
```

## Slash Command Mapping

| Claude Command | EI Core Execution |
| :--- | :--- |
| `/review` | `ei review` |
| `/simplify` | `ei simplify` |
| `/impact <target>` | `ei impact <target>` |
| `/ship` | `ei ship` |
