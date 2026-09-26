# Engineering Intelligence Commands Overview

Engineering Intelligence equips AI coding agents with a structured, senior-engineering command surface.

Rather than giving vague instructions like *"make this better"* or *"clean this up"*, these commands trigger deterministic inspection protocols, evidence-gathering routines, and rigorous engineering judgment.

---

## Command Matrix

| Command | Lifecycle Phase | Core Purpose | Typical Input | Output Artifact |
| :--- | :--- | :--- | :--- | :--- |
| [`/ei:init`](./init.md) | **Onboarding / Setup** | Scan repo, detect conventions, establish `.ei/` context | Repository root | `.ei/` context files |
| [`/ei:review`](./review.md) | **In-Flight / Pre-Commit** | Senior code review prioritized by impact and architectural fit | Staged files or Git diff | Ranked findings table & recommendations |
| [`/ei:simplify`](./simplify.md) | **Refinement / Anti-Entropy** | Eradicate unnecessary abstraction, boilerplate, and indirection | Target files or recent diff | Concrete deletion and refactoring plan |
| [`/ei:impact`](./impact.md) | **Planning / Pre-Merge** | Trace blast radius, breaking changes, and regression risks | Proposed change or branch diff | Dependency blast radius & test matrix |
| [`/ei:audit`](./audit.md) | **Maintenance / Health** | Deep repository-wide audit for tech debt, security, and performance | Subsystem or entire repo | Health scorecard & prioritized remediation roadmap |
| [`/ei:ship`](./ship.md) | **Release Gate** | Pre-release verification checklist for production readiness | Release branch or PR | Go / No-Go verdict & release checklist |

> **Note on Command Aliases:**  
> Depending on your agent harness (Claude Code, Cursor, Codex, etc.), commands can be invoked either with the namespace prefix (`/ei:review`, `/ei:simplify`) or the direct shorthand (`/review`, `/simplify`).

---

## Guiding Principles for All Commands

Every Engineering Intelligence command adheres to five operational constraints:

### 1. Evidence Before Judgment
The agent must never report a speculative defect without providing concrete file paths, line ranges, or runtime evidence. If a claim cannot be substantiated by inspecting the codebase or running a tool, it must not be presented as a finding.

### 2. Context Over Universal Dogma
A solution that is ideal for a distributed Go microservice may be toxic for a single-server Laravel monolith. Commands always check `.ei/` context and existing project conventions before judging code structure.

### 3. Finding Density Over Exhaustive Checklists
A review with 4 high-leverage architectural findings is infinitely more valuable than an automated dump of 87 superficial stylistic lints. Commands filter aggressively for signal-to-noise ratio.

### 4. Actionable Suggestions
Every flagged issue must include a concrete, runnable alternative—either as a code snippet, a refactored pattern, or a command to execute.

### 5. Local-First & Zero Extra Latency
Commands operate directly against the local workspace using tools already available to the agent (Git, search, file view, language compilers, test runners). No third-party cloud APIs or external telemetry are involved.

---

## The Standard Finding Format

All evaluation commands (`/review`, `/simplify`, `/impact`, `/audit`, `/ship`) format significant issues according to the standard Engineering Intelligence finding schema:

```markdown
### [SEVERITY] Finding Title

- **Category:** Architecture | Anti-Slop | Security | Performance | Correctness | Maintainability
- **Evidence:** `path/to/file.ext:L12-L34`
- **Why It Matters:** Clear explanation of operational risk, cognitive load, or architectural divergence.
- **Suggested Change:**
  ```diff
  - problematic_call(with_unnecessary_wrapper)
  + direct_call()
  ```
- **Confidence:** High | Medium | Low
- **Affected Surface:** List of downstream consumers or dependent modules.
```

---

## Next Steps

Explore the detailed specifications for each command:

* [**`/ei:init` Guide**](./init.md) — Establish repository baseline and ground truth context.
* [**`/ei:review` Guide**](./review.md) — Run senior architectural and code quality reviews.
* [**`/ei:simplify` Guide**](./simplify.md) — Remove artificial complexity and premature abstraction.
* [**`/ei:impact` Guide**](./impact.md) — Map blast radiuses and catch breaking changes early.
* [**`/ei:audit` Guide**](./audit.md) — Comprehensive repository health inspection.
* [**`/ei:ship` Guide**](./ship.md) — Production readiness verification and release gating.
