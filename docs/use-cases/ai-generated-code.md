# AI-Generated Code: Quality, Risks, and Deterministic Verification

AI can write working code that is still bad engineering.

Large Language Models (LLMs) used in coding agents are trained to satisfy the immediate user prompt with syntactically valid code. However, models optimize for local completion, not long-term codebase health. This creates a systematic blind spot: code that passes tests and runs in a sandbox, but introduces severe operational liabilities in production.

Engineering Intelligence provides the deterministic quality control layer that catches these risks before code reaches staging or production.

---

## The Hidden Failure Modes of AI-Generated Code

AI coding agents consistently generate the same high-frequency anti-patterns across web and backend applications:

### 1. Database Performance Disasters
* **N+1 Queries (`DB-002`)**: Agents iterate over list elements and perform database lookups per item instead of using JOINs or eager batching.
* **Unindexed Foreign Keys (`DB-001`)**: Creating relational foreign keys without supporting indices, causing table scans under load.
* **Unbounded Table Queries (`DB-004`)**: Executing `SELECT * FROM table` without pagination or `LIMIT` clauses.

### 2. Security & Perimeter Gaps
* **Omitted Authorization (`API-001`)**: Authenticating that a user is logged in, but failing to verify that they own the requested resource ID (IDOR / BOLA vulnerabilities).
* **String Concatenation in SQL (`SEC-001`)**: Constructing SQL queries with template literals rather than parameterized query drivers.
* **Command Injection (`SEC-002`)**: Using `child_process.exec()` with unescaped user-supplied inputs.

### 3. Structural Over-Engineering
* **Single-Implementation Interfaces (`ARCH-001`)**: Introducing speculative abstract classes and interfaces for simple functions where no alternative implementation exists.
* **God Files (`ARCH-002`)**: Continuously appending new helper methods to existing utility files until single modules exceed 1,000+ lines.
* **Circular Dependencies (`ARCH-003`)**: Connecting disparate modules with mutual imports that lead to initialization deadlocks.

### 4. Fragile Error Handling
* **Swallowed Exceptions (`API-002`)**: Wrapping critical logic in `try ... catch` blocks that log to console or return `null`, silently dropping database transaction errors.
* **Hung Connections (`API-005`)**: Using `fetch()` without a timeout, causing worker threads to hang indefinitely when third-party APIs experience latency.

### 5. AI Slop & Aesthetic Degradation
* **AI UI Slop (`UI-COLOR-001`, `UI-SLOP-003`)**: Clichéd purple/indigo gradients, nested card wrappers, and lack of design system token discipline.
* **Tautological Comments (`SLOP-002`)**: Line-by-line comments that merely repeat what the syntax already states.

---

## The Solution: Deterministic Pre-Commit & Pre-Merge Gate

LLM code review tools evaluate code with probabilistic reasoning—they can hallucinate, overlook patterns, or give contradictory advice across runs.

Engineering Intelligence uses **deterministic static analysis, AST inspection, and project context**:

```bash
# Install into your agent
npx skills add devravik/engineering-intelligence

# Detect issues on changed files
ei detect --changed

# Executive review with attribution & blast radius
ei review

# Enforce quality gate
ei ship
```

---

## Learn More

* [AI-Generated Code Review Guide](ai-code-review.md)
* [AI-Agent Security Review](ai-agent-security.md)
* [AI-Agent Database Review](ai-agent-database-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
