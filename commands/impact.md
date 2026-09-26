# `/impact` — Graph-Based Blast Radius Analysis

`/impact` replaces intuitive guesses with deterministic call-graph traversal to map the blast radius and regression risks of changing a symbol or file.

---

## Execution Command

```bash
ei impact <symbol-or-file>
```

*(Example: `ei impact User` or `/impact src/models/Order.ts`)*

---

## Output Dependency Graph

```text
================================================================
                   IMPACT DEPENDENCY GRAPH: User
================================================================

User
│
├── 14 API endpoints
├── 8 services
├── 5 jobs / queues
├── 12 frontend consumers
├── 19 tests
├── 3 migrations
└── 2 external integrations

----------------------------------------------------------------
CHANGE RISK:
  API:       HIGH
  DATABASE:  HIGH
  FRONTEND:  MEDIUM
  TESTS:     HIGH
  DEPLOY:    MEDIUM
================================================================
```

---

## Risk Derivations

* **API (HIGH):** Symbol is directly returned or accepted across > 5 public API routes. Contract changes require client versioning or backward compatibility.
* **DATABASE (HIGH):** Target is involved in migrations or database tables. Requires two-phase deploy (nullable column -> backfill -> constraint).
* **TESTS (CRITICAL if 0 tests exist for > 5 consumers):** Changing unverified critical dependencies triggers an automatic test blocker.
