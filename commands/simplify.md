---
description: Execute 8-step anti-entropy simplification loop to eliminate dead code and unnecessary abstraction
---

# `/simplify` — The 8-Step Anti-Entropy Loop

`/simplify` is a first-class detector-driven refactoring loop that eliminates artificial complexity, dead code, and speculative abstractions.

Instead of vague promises like *"I cleaned up the code"*, `/simplify` measures concrete structural reduction while verifying behavioral invariance.

---

## Execution Command

```bash
ei simplify [path]
```

*(Or issue `/simplify` in your agent session)*

---

## The 8-Step Simplification Protocol

```text
1. Detect Complexity
   └── Run `ei detect` targeting `ARCH-001`, `SLOP-001`, `CODE-002`, `CODE-005`.

2. Determine Real Value
   └── Apply the 3-Question Heuristic: Does this abstraction solve a problem that exists today?

3. Identify Removable Structure
   └── Pinpoint single-use interfaces, pass-through factories, redundant wrappers, and dead exports.

4. Estimate Regression Risk
   └── Run `ei impact <symbol>` to verify caller blast radius before touching code.

5. Propose Smallest Simplification
   └── Generate a minimal diff inlining helpers or collapsing indirection.

6. Apply Refactoring
   └── Execute direct structural reduction.

7. Verify Behavioral Invariance
   └── Execute test suite (`npm test`). Guarantee zero functional regressions.

8. Re-Run Detector
   └── Confirm 0 slop findings and measure structural delta.
```

---

## Verified Complexity Reduction Metric

Every `/simplify` pass outputs an objective before-and-after scorecard:

```text
================================================================
                    SIMPLIFICATION SCORECARD
================================================================
                    Before               After
----------------------------------------------------------------
Files:              27 files             14 files
Abstractions:       6 abstractions       2 abstractions
Factories:          3 factories          0 factories
Interfaces:         4 interfaces         1 interface
LOC Delta:          1,480 LOC            620 LOC (-58%)

Behavior:           UNCHANGED
Tests:              PASS (34/34 passing)
Entropy:            REDUCED
================================================================
```
