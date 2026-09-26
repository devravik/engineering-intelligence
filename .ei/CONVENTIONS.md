# Conventions & Idioms

## Error Handling
- Never silently swallow exceptions in empty catch blocks (API-002).
- Always attach operational context (userId, traceId) to error logs.

## Testing Standards
- Assert meaningful domain state; avoid tautological assertions (TEST-002).
- Test failure modes and exception branches, not only happy paths (TEST-003).

## Anti-Slop Policy
- Remove tautological echo comments that merely restate code (SLOP-002).
- Eliminate speculative plugin architectures that lack multiple active implementations (SLOP-003).
