# System Constraints & Invariants

Document non-negotiable boundaries, performance budgets, compliance requirements, and forbidden libraries.

## Forbidden Libraries & Patterns
- **[Library/Pattern]:** [Rationale for prohibition, e.g., "Do not use Moment.js; use native Intl/Date to save 70kb bundle size."]
- **[Library/Pattern]:** [Rationale, e.g., "Do not use raw SQL string concatenation; always use parameterized queries to prevent SQLi."]

## Performance Budgets
- **API Latency:** p95 < [e.g., 200ms]
- **Client Bundle Size:** Main chunk < [e.g., 180kb gzip]
- **Database Queries:** No queries with unindexed filters on production tables.

## Security & Compliance Invariants
- Multi-tenant data isolation must be enforced via [e.g., tenant_id column / RLS].
- Never log plain credentials, authorization tokens, or sensitive user PII.
- All mutating endpoints must enforce CSRF or bearer token authentication.
