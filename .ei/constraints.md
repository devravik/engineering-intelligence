# System Constraints & Invariants

## Database & Schema Invariants
- All foreign key columns must have an accompanying index (DB-001).
- Adding NOT NULL columns to populated tables requires a DEFAULT value or multi-phase migration (DB-003).
- No table or column drops without an explicit approved waiver (DB-004).

## Security Invariants
- All mutating API route handlers must enforce authentication and permission verification (API-001).
