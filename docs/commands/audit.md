# `/ei:audit` — Repository-Wide Health & Architecture Audit

The `/ei:audit` command conducts an exhaustive, repository-wide architectural and quality audit.

While [`/ei:review`](./review.md) evaluates an active pull request or code diff, `/ei:audit` evaluates the **holistic health of the entire codebase**. It identifies accumulated technical debt, architectural erosion, latent security exposures, performance bottlenecks, and widespread AI slop.

---

## Invocation

```text
/ei:audit
```

### Options & Scopes

* `/ei:audit`: Complete repository audit across all engineering disciplines.
* `/ei:audit --security`: Deep scan for authorization gaps, unvalidated input surfaces, secret leakage, and dependency vulnerabilities.
* `/ei:audit --performance`: Audits database query efficiency (N+1 queries, missing indexes), heavy synchronous operations, and bundle sizes.
* `/ei:audit --architecture`: Maps layer boundary violations, circular imports, orphan files, and architectural drift against `.ei/architecture.md`.
* `/ei:audit --anti-slop`: Discovers dead abstractions, single-use interfaces, repetitive boilerplate, and hallucinated patterns across the repository.
* `/ei:audit src/modules/billing`: Restricts the audit to a specific subsystem or package.

---

## Audit Evaluation Pillars

```text
┌────────────────────────────────────────────────────────┐
│                   AUDIT PILLARS                        │
├───────────────────┬───────────────────┬────────────────┤
│ 1. Architecture   │ 2. Security       │ 3. Performance │
│ - Boundary drift  │ - Auth checks     │ - Query N+1s   │
│ - Circular deps   │ - Injection risks │ - Index health │
│ - Orphan code     │ - Secrets hygiene │ - Memory leaks │
├───────────────────┼───────────────────┼────────────────┤
│ 4. Anti-Slop      │ 5. Reliability    │ 6. Test Health │
│ - Dead interfaces │ - Error handling  │ - Flaky paths  │
│ - Speculative code│ - Race conditions │ - Mock hygiene │
│ - Echo comments   │ - Resource leaks  │ - Critical gaps│
└───────────────────┴───────────────────┴────────────────┘
```

---

## Output Structure: Scorecard & Remediation Roadmap

An `/ei:audit` report provides an overarching **Repository Health Score (0-100)**, followed by high-leverage findings and a sequenced **Remediation Roadmap**.

### Real-World Audit Output Example

```markdown
# Engineering Intelligence: Repository Audit Report

**Target:** `devravik/core-platform` (312 files, 48,200 LOC)  
**Overall Health Score:** 74 / 100  
**Status:** 🟡 Needs Refactoring (0 Critical, 3 High, 5 Medium)

---

## Scorecard by Discipline

| Discipline | Score | Key Takeaway |
| :--- | :--- | :--- |
| **Architecture** | 82/100 | Solid feature isolation; 2 circular dependencies between `auth` and `users`. |
| **Security** | 88/100 | Strong authentication; 1 missing permission check on tenant exports. |
| **Performance** | 68/100 | Severe N+1 query patterns in `OrderList` serialization; missing composite index. |
| **Anti-Slop** | 62/100 | 14 single-implementation interfaces and redundant factory layers detected. |
| **Test Coverage** | 71/100 | Critical checkout and refund paths well-tested; webhook retries untested. |

---

## Top Priority Findings

### [HIGH] N+1 Query in Customer Order Serializer
- **Category:** Performance / Database
- **Evidence:** `src/api/serializers/orderSerializer.ts:L24`
- **Issue:** The serializer queries `OrderItem.findAll()` individually for every order in a list query, causing 50+ database roundtrips on a single dashboard load.
- **Action:** Add eager loading (`include: [OrderItem]`) in the repository query.

### [HIGH] Circular Dependency Between Auth and User Subsystems
- **Category:** Architecture
- **Evidence:** `src/auth/tokenService.ts` ⇄ `src/users/userService.ts`
- **Issue:** Creates tight coupling, makes isolated unit testing impossible, and triggers bundler initialization warnings.
- **Action:** Extract user token validation into an independent `src/auth/contracts` domain.

### [HIGH] Widespread Single-Use Interface Slop
- **Category:** Anti-Slop / Maintainability
- **Evidence:** `src/services/interfaces/` (14 files)
- **Issue:** 14 interfaces define contracts with exactly 1 concrete implementation throughout the repository. Adds 28 redundant file hops for developers navigating code.
- **Action:** Collapse interfaces directly into their concrete implementations.

---

## Sequenced Remediation Roadmap

1. **Phase 1: Quick Wins (< 1 day)**
   - Eager-load `OrderItem` in order serializer (eliminates 90% of DB load on orders page).
   - Add missing tenant check to export endpoint (`src/api/routes/export.ts:L45`).

2. **Phase 2: Architectural Cleanup (2-3 days)**
   - Decouple `tokenService` from `userService` by introducing event-driven user lookup.
   - Run `/ei:simplify src/services/interfaces/` to collapse unused interfaces.

3. **Phase 3: Resilience Hardening (1 week)**
   - Implement idempotency key tracking for incoming webhooks.
   - Add database composite index on `orders(customer_id, created_at DESC)`.
```

---

## Best Practices

* **Run Monthly or Before Major Milestones:** Schedule `/ei:audit` prior to major version releases, funding rounds, or security compliance reviews.
* **Track the Health Score:** Use the health score in PR discussions to ensure new feature development does not steadily degrade system maintainability.
