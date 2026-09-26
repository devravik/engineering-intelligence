---
description: Pre-merge release gate verifying 10 production checks and enforcing UNKNOWN != PASS
---

# `/ship` — The Deterministic Release Gate

`/ship` is an uncompromising pre-release gate. It does not simply display an advisory checklist; it executes verification preconditions and produces a binding **SHIP** or **DO NOT SHIP** verdict.

---

## Execution Command

```bash
ei ship
```

---

## The Core Invariants of the Ship Gate

1. **`UNKNOWN != PASS`**  
   If an authorization boundary, error handler, or test has not been executed and proven by evidence, it is an automatic blocker. Silence or absence of test output is never assumed to be clean.
2. **`No Evidence != Clean`**  
   Stale approval hashes from a previous commit do not carry forward. All checks must be verified against current Git HEAD.
3. **Explicit Waivers Required**  
   Any advisory or exception must have an explicit entry in `.ei/ignores.json` accompanied by a mandatory `--reason`.

---

## Example Ship Gate Output

```text
Verifying release readiness preconditions...

================================================================
                     ENGINEERING REVIEW MATRIX                  
================================================================

Discipline      Evidence    Impact        Confidence    Disposition
----------------------------------------------------------------
Architecture    ✓           NONE          NONE          SHIP
Security        ✓           CRITICAL      HIGH          BLOCK
Database        ✓           HIGH          HIGH          FIX
CodeQuality     ✓           NONE          NONE          SHIP
Testing         ✓           NONE          NONE          SHIP
Slop            ✓           NONE          NONE          SHIP
----------------------------------------------------------------
ATTRIBUTION:
  Baseline: 18 existing | New: 1 | Resolved: 2

CURRENT STATE:
  BLOCKERS:  1
  FIX:       1
  ADVISORY:  0
  UNKNOWN:   1

================================================================
FINAL DISPOSITION: BLOCK
================================================================

🛑 SHIP GATE: REJECTED
Unresolved BLOCKERS prevent release. UNKNOWN != PASS.
```
