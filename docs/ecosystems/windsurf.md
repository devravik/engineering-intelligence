# Engineering Intelligence for Windsurf & Devin Desktop

Stop Windsurf and Devin from shipping bad code. Enforce deterministic engineering contracts via `.windsurfrules` and the `ei` verification CLI.

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)

Windsurf's Cascade flow writes complex full-stack features. However, agentic flows often accumulate speculative abstractions, unbounded external API calls, and fragile database queries.

Engineering Intelligence provides Windsurf with `.windsurfrules` and the `ei` CLI verification suite.

---

## 1-Command Installation

Install into your Windsurf workspace:

```bash
npx skills add devravik/engineering-intelligence
```

Or install native Windsurf rules:

```bash
npx @devravik/engineering-intelligence install --provider windsurf
```

Verify your installation:

```bash
ei --version
```

---

## Windsurf Cascade Workflow

1. **Before Cascade starts**: Run `ei init` to establish architecture boundaries in `.ei/`.
2. **After Cascade proposes edits**: Run `ei detect --changed` in the terminal to verify zero regressions.
3. **Before merge**: Run `ei ship` to enforce the 10-point release gate.
