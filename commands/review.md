# `/review` — Matrix-Based Engineering Review

In Engineering Intelligence, code review is an **evidence-driven matrix**, not an essay of generic opinions.

The final disposition is mechanically derived from verified detector findings and attribution against `.ei/state/baseline.json`.

---

## Execution Command

```bash
ei review
```

*(Or issue `/review` inside an agent session)*

---

## The Engineering Review Matrix

```text
================================================================
                     ENGINEERING REVIEW MATRIX                  
================================================================

Discipline      Evidence    Impact        Confidence    Disposition
----------------------------------------------------------------
Architecture    ✓           HIGH          HIGH          FIX
Security        ✓           CRITICAL      HIGH          BLOCK
Database        ✓           NONE          NONE          SHIP
CodeQuality     ✓           LOW           HIGH          IGNORE
Testing         ~           MEDIUM        MEDIUM        REVIEW
Slop            ✓           HIGH          HIGH          FIX
----------------------------------------------------------------
ATTRIBUTION:
  Baseline: 42 existing | New: 2 | Resolved: 1

CURRENT STATE:
  BLOCKERS:  1
  FIX:       2
  ADVISORY:  3
  UNKNOWN:   0

================================================================
FINAL DISPOSITION: BLOCK
================================================================
```

---

## Mechanical Disposition Derivation

The terminal verdict is strictly computed via deterministic logic:

| Condition | Derived Disposition | Action Required |
| :--- | :---: | :--- |
| Any `CRITICAL` finding or unverified security/migration | **`BLOCK`** | Immediate resolution required before any further code changes. |
| Any `UNKNOWN` on critical paths (`UNKNOWN != PASS`) | **`BLOCK`** | Verification test or runtime proof must be gathered. |
| Any `HIGH` impact finding (`ARCH-001`, `DB-002`, `SLOP-001`) | **`FIX`** | Refactoring required unless an explicit waiver is granted. |
| Only `MEDIUM` / `LOW` findings | **`REVIEW`** | Advisory findings; review trade-offs. |
| Clean state with verified evidence | **`SHIP`** | Ready for merge / release. |

---

## Evidence-Bound Finding Format

Every finding included in the review adheres to the deterministic schema:

```text
ARCH-001 Finding: Single-implementation interface 'IOrderService'
Evidence: src/services/OrderService.ts:12
Baseline: NEW
Confidence: HIGH
Impact: HIGH
Disposition: FIX
Suggested Fix: Collapse IOrderService directly into OrderService.
Verified: 2026-09-26T10:42:11Z
Evidence Hash: a8f41c9b20e1
```
