# `/ei:impact` — Blast Radius & Dependency Impact Analysis

The `/ei:impact` command analyzes the upstream and downstream ripple effects of a proposed or active change before it causes production regressions.

AI coding agents excel at localized edits, but often suffer from **tunnel vision**: they modify a function signature, rename a database column, or alter a state structure without tracing the 12 other files, background jobs, or API clients that depend on that contract.

`/ei:impact` maps the full blast radius.

---

## Invocation

```text
/ei:impact
```

### Options & Scopes

* `/ei:impact`: Analyzes the blast radius of current uncommitted changes or active branch.
* `/ei:impact <symbol>`: Traces all callers and consumers of a specific function, class, or type (e.g., `/ei:impact calculateTax`).
* `/ei:impact <file>`: Traces all modules that import or interact with the specified file.
* `/ei:impact --schema`: Specifically evaluates database migration hazards, column renames, and table locks.
* `/ei:impact --breaking`: Filters report strictly to breaking changes that affect public APIs or client contracts.

---

## What `/ei:impact` Traces

```text
               PROPOSED CHANGE
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
1. Code Callers  2. Data Layer   3. External API
     │               │               │
  Direct          Database        HTTP/gRPC
  Imports,        Schemas,        Contracts,
  Class method    Migrations,     Payload shapes,
  invocations     Cache keys      Status codes
     │               │               │
     └───────────────┬───────────────┘
                     ▼
           4. Async & Background
                     │
              Queued jobs,
              Webhook subscribers,
              Event payloads
                     │
                     ▼
           5. Test Suite Matrix
                     │
              Impacted tests,
              Missing test paths
```

### 1. Direct Code Callers & Import Graphs
* Scans all files importing the modified symbol.
* Verifies parameter counts, types, and return value handling.
* Detects implicit dependencies (e.g. dynamic reflections or dependency injection lookups).

### 2. Database & Persistence Hazards
* Analyzes schema modifications (e.g., adding a `NOT NULL` column without a default).
* Checks table lock risks on large production tables during migrations.
* Identifies cache invalidation gaps (e.g., modifying an entity without clearing its Redis cache key).

### 3. API Contract Regressions
* Checks whether public REST, GraphQL, or RPC endpoints have altered payload structures.
* Detects unintentional changes to JSON serialization (e.g., camelCase vs snake_case).
* Verifies mobile and frontend client backwards compatibility.

### 4. Asynchronous Queues & Serialization
* Warns when modifying a data class that is serialized and stored in Redis/SQS/RabbitMQ.
* Flags deployment race conditions where worker nodes running old code process jobs sent by new code.

---

## Risk Tiers

`/ei:impact` assigns a risk rating to the change set:

| Tier | Definition | Action Required |
| :--- | :--- | :--- |
| **CRITICAL** | Breaking API change, non-zero downtime migration, or unhandled data loss risk. | Dual-write phase, multi-step migration, or explicit client versioning required. |
| **ELEVATED** | Affects core shared services, cache invalidation, or high-volume background jobs. | Comprehensive regression testing and targeted smoke test execution. |
| **CONTAINED** | Internal refactor or leaf-node modification; all callers isolated within current module. | Standard unit and integration test verification. |

---

## Real-World Impact Report Example

```markdown
# Engineering Intelligence: Impact Analysis Report

**Change Target:** `src/models/Organization.ts` (Renaming `tier` to `subscription_plan`)  
**Risk Level:** 🔴 ELEVATED (3 subsystems affected, 1 migration hazard)

---

### 1. Downstream Code Dependents
- `src/services/billing/limits.ts:L42` — Calls `org.tier` directly. Will throw `undefined` at runtime.
- `src/controllers/admin/orgController.ts:L89` — Serializes `org.tier` for admin dashboard UI.
- `src/middleware/featureFlags.ts:L15` — Checks `tier === 'enterprise'`.

### 2. Data & Persistence Hazards
- **Migration Warning:** Migration `20260926_rename_tier.sql` performs an `ALTER TABLE organizations RENAME COLUMN tier TO subscription_plan;`
  - *Hazard:* During a rolling deployment, existing running instances will fail when querying the old column name before all containers restart.
  - *Mitigation:* Use an alias or two-phase migration (add column -> backfill -> drop column).

### 3. Background Jobs & Caching
- Redis Cache Key: `cache:org:{id}:summary` stores cached organization JSON. Existing cached entries still have `{ "tier": "pro" }`.
  - *Mitigation:* Ensure cache bust logic is included in the migration or deployment script.

### 4. Required Test Matrix
To certify this change, run:
```bash
npm test tests/unit/billing/limits.test.ts
npm test tests/integration/adminOrg.test.ts
npm test tests/e2e/featureFlags.spec.ts
```
```

---

## Agent Usage Instructions

When executing `/ei:impact`:
1. Use `git diff` or search tools to extract all modified symbols, schemas, and routes.
2. Search globally across the project for all references, imports, and string occurrences of modified symbols.
3. Check database migrations in the active diff for table-locking or breaking schema operations.
4. Synthesize the findings into the standardized Impact Report.
