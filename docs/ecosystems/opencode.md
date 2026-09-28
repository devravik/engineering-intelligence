# Engineering Intelligence for OpenCode

Stop OpenCode from shipping bad code. Deterministic architecture, security, database, API, and UI checks for OpenCode agents.

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)

OpenCode is a fully open-source terminal coding agent. Engineering Intelligence provides OpenCode with universal agent skills, standard plugin manifests, and deterministic CLI verification.

---

## 1-Command Installation

Install into OpenCode via skills.sh:

```bash
npx skills add devravik/engineering-intelligence
```

Or install native OpenCode plugin manifests:

```bash
npx @devravik/engineering-intelligence install --provider opencode
```

Verify your installation:

```bash
ei --version
```

---

## OpenCode Workflow

### 1. Detect Changes on Active Git Branch
```bash
$ ei detect --changed
```
Evaluates all 32 code detectors and 49 UI detectors strictly against modified lines using dynamic merge-base attribution (`BASELINE` vs `NEW`).

### 2. Run the Staff Engineer Review Matrix
```bash
$ ei review
```
Produces the 5-tier evidence matrix (Blockers, Fixes, Architecture, Security, UI) and derives mechanical release disposition (`BLOCK`, `FIX`, `SHIP`).

### 3. Simplify & Verify
```bash
$ ei simplify <path>
$ ei ship
```
Ensures your code is lean, un-bloated, and production-ready before you push.
