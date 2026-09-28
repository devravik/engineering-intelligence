# AI-Agent Database Review: N+1 Queries, Indexes, & Migration Gates

Engineering Intelligence provides deterministic database code review and query performance checks for AI coding agents. It prevents AI agents from introducing N+1 queries, unindexed foreign keys, unbounded table scans, and table-locking schema migrations.

When AI coding agents interact with databases via ORMs (Prisma, Drizzle, TypeORM, SQLAlchemy) or raw SQL, they write queries that function correctly on small development fixtures but collapse under production workloads. Engineering Intelligence evaluates data access patterns against your active schema.

---

## High-Risk Database Patterns Caught by Engineering Intelligence

### 1. N+1 Query Anti-Pattern (`DB-002`)
* **What Happens**: The agent queries a list of parent entities, then loops over the results (`.map()`, `for ... of`) issuing an individual query for each child record.
* **Production Impact**: A page requesting 100 items issues 101 database roundtrips, causing connection exhaustion and high latency.
* **Remediation**: Replaces iterative queries with batch joins, SQL `IN (...)` queries, or ORM eager-loading (`include: { author: true }`).

### 2. Unindexed Foreign Keys (`DB-001`)
* **What Happens**: An agent defines a relational column (e.g., `user_id` or `workspace_id`) or foreign key constraint without creating a corresponding index.
* **Production Impact**: Filtering, joining, or cascading deletes on the child table forces sequential table scans across millions of rows.
* **Remediation**: Enforces `CREATE INDEX idx_table_column ON table (column);`.

### 3. Destructive & Table-Locking Migrations (`DB-003`)
* **What Happens**: Adding a non-nullable (`NOT NULL`) column to an existing populated table without a default value or concurrent backfill.
* **Production Impact**: Acquires an exclusive `ACCESS EXCLUSIVE` table lock in PostgreSQL/MySQL, blocking all reads and writes and causing application downtime.
* **Remediation**: Enforces safe multi-phase migration patterns (add nullable column → backfill default → add constraint).

### 4. Unbounded Queries (`DB-004`)
* **What Happens**: Querying relational collections without a `LIMIT` clause or pagination bounds (`take`, `limit`).
* **Production Impact**: Memory bloat, Node.js process out-of-memory crashes, and database CPU spikes as tables grow.
* **Remediation**: Requires explicit limit bounds or cursor pagination.

---

## Quick Installation

Add the skill to your agent:

```bash
npx skills add devravik/engineering-intelligence
```

Or run the CLI directly:

```bash
npx @devravik/engineering-intelligence install
```

---

## Database Review Workflow

```bash
# Detect database problems across changed code and migrations
$ ei detect --changed

Engineering Intelligence

NEW  DB-002    N+1 query detected: query inside loop
     src/api/users.ts:84

NEW  DB-001    Foreign key 'project_id' lacks database index
     prisma/schema.prisma:48

NEW  DB-003    Table-locking migration: NOT NULL column without DEFAULT
     migrations/20260928_add_tier.sql:4

3 findings detected.

# Run review to inspect remediation steps
$ ei review
```

---

## Learn More

* [AI-Agent Security Review](ai-agent-security.md)
* [AI-Agent Architecture Review](ai-agent-architecture-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
