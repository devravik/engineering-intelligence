# Static Analysis for AI Agents: Deterministic vs. LLM-Based Code Review

Engineering Intelligence is an open-source static analysis tool built specifically for AI coding agents. Unlike LLM-based PR review bots, it provides deterministic, reproducible, zero-cost analysis of architecture, security, database, API, and UI quality for every change an agent makes.

---

## The Problem with LLM-Based AI Code Review

Several tools use a secondary LLM to review code written by a primary LLM. This creates fundamental limitations:

| Problem | Impact |
|---|---|
| **Non-determinism** | The same code gets different review results on different runs |
| **Hallucination** | The reviewer invents issues that don't exist or misses real ones |
| **Latency** | LLM review adds 30–120 seconds per PR |
| **Cost** | Token consumption scales with codebase size |
| **Context limits** | Cannot hold full codebase context — misses cross-file patterns |
| **No exit code** | Comment-only systems don't block CI pipelines |

---

## Deterministic Static Analysis: How Engineering Intelligence Works

Engineering Intelligence uses AST-based static analysis, schema introspection, and project context inference:

### What "Deterministic" Means
* Running `ei detect --changed` on the same codebase always returns the same findings
* No randomness, no token sampling, no variation between runs
* Findings are identical locally, in CI, and on any team member's machine

### What "Project Context Aware" Means
* Reads `prisma/schema.prisma` to verify which columns have indexes before flagging `DB-001`
* Parses migration history to understand if a destructive change is net-new
* Reads ORM query builders to identify N+1 patterns across file boundaries

### What "Zero API Cost" Means
* No API keys, no cloud calls, no egress
* Runs in airgapped environments, on offline laptops, and in restrictive enterprise CI
* No per-seat pricing: install once, run everywhere

---

## Rule Classification System

Every detector is classified by confidence level:

| Class | Meaning |
|---|---|
| `CERTAIN` | Pattern is always a defect (e.g., SQL string concatenation, empty catch) |
| `PROBABLE` | Pattern is almost always a defect, context considered (e.g., N+1 in loops) |
| `HEURISTIC` | Pattern is often a defect but has legitimate uses (e.g., large files, interface counts) |

HEURISTIC findings require human attribution to count as `PASS`. This is the foundation of the `UNKNOWN != PASS` ship gate.

---

## Comparison: Deterministic vs. LLM Code Review

| Dimension | Engineering Intelligence | LLM PR Review |
|---|---|---|
| **Reproducibility** | ✅ Deterministic | ❌ Non-deterministic |
| **Speed** | ✅ 2–5s for changed files | ❌ 30–120s per call |
| **Cost** | ✅ Free (local) | ❌ Per-token billing |
| **CI blocking** | ✅ Exit code on BLOCK | ❌ Comments only |
| **False positives** | ✅ Restraint Doctrine filtered | ❌ Hallucinated findings |
| **Cross-file analysis** | ✅ Full project context | ❌ Context window limited |
| **Airgap support** | ✅ Full offline | ❌ API dependency |
| **Schema awareness** | ✅ Reads Prisma/SQL schemas | ❌ No schema introspection |

---

## Installation

```bash
npx skills add devravik/engineering-intelligence
```

---

## The 32 + 49 Rule Catalog

Engineering Intelligence runs:

* **32 backend detectors**: Database, security, architecture, error handling, testing, API resilience, code quality
* **49 UI detectors**: Typography, color, spatial layout, design system, accessibility, responsive, AI slop signals

👉 **[Full 81 Problem & Rule Catalog](../problems.md)**

---

## Learn More

* [CI/CD Quality Gate](ci-cd-quality-gate.md)
* [AI-Generated Code Review](ai-code-review.md)
* [Vibe Coding Quality Control](vibe-coding-quality-control.md)
