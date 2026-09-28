# Engineering Intelligence for Cline

Stop Cline from shipping bad code. Enforce deterministic engineering contracts, security boundaries, and anti-slop rules directly in VS Code.

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)

Cline (formerly Claude Dev) is an autonomous coding agent for VS Code with terminal and file system access. Engineering Intelligence provides Cline with `.clinerules`, skills definitions, and the `ei` CLI.

---

## 1-Command Installation

Install into your project via skills.sh:

```bash
npx skills add devravik/engineering-intelligence
```

Or install native Cline instructions:

```bash
npx @devravik/engineering-intelligence install --provider cline
```

Verify your installation:

```bash
ei --version
```

---

## Cline Integration & Commands

Cline automatically honors `.clinerules` in your workspace:
- Grounding in `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md`.
- Automatic detection verification before proposing diffs.
- `UNKNOWN != PASS` gate before concluding tasks.

```bash
# Terminal commands Cline can run directly:
ei detect --changed    # Fast verification on modified files
ei review              # Finding matrix and derived disposition
ei ship                # Pre-merge production readiness check
```
