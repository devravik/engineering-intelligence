# `/ei:ship` — Production Readiness Verification

The `/ei:ship` command serves as the final, rigorous release gate before deploying code to production.

AI-generated features often pass local unit tests but fail disastrously upon release due to **unmigrated database schemas, missing environment variables, absent telemetry, unhandled edge-case timeouts, or security regressions**.

`/ei:ship` executes a systematic 10-point production readiness protocol and issues an explicit **Go / No-Go** deployment verdict.

---

## Invocation

```text
/ei:ship
```

### Options & Scopes

* `/ei:ship`: Full production readiness verification of current branch and release candidate.
* `/ei:ship --checklist`: Generates a structured release verification checklist for team sign-off.
* `/ei:ship --dry-run`: Runs test suites, builds, and migration dry-runs without making remote calls.
* `/ei:ship --fast`: Skips extended integration tests and validates configuration, schema, and security invariants.

---

## The 10-Point Production Verification Protocol

```text
1. Test Verification
   ├── Are all unit, integration, and E2E tests passing without flake?
   └── Are newly introduced critical paths backed by regression tests?

2. Migration & Schema Safety
   ├── Are database migrations reversible (down migration exists and verified)?
   ├── Will adding indexes or columns cause table locking in production?
   └── Are database seeds idempotent?

3. Environment & Secrets Hygiene
   ├── Are all newly required environment variables documented in `.env.example`?
   ├── Are API keys, secrets, or internal URLs hardcoded anywhere in the diff?
   └── Are production fallback defaults safe?

4. Security & Permissions Gate
   ├── Are newly introduced endpoints protected by authentication & authorization policies?
   ├── Are user inputs sanitized to prevent SQLi, XSS, and prototype pollution?
   └── Are rate limits applied to public or compute-heavy endpoints?

5. Observability & Logging
   ├── Are critical errors logged with structured context (userId, orgId, traceId)?
   ├── Are sensitive customer data (passwords, PII, payment info) excluded from logs?
   └── Are APM or error monitoring breadcrumbs intact?

6. Performance & Scale Check
   ├── Are queries bounded with `LIMIT` and pagination?
   ├── Are database queries utilizing proper indexes?
   └── Are frontend production bundles optimized (no uncompressed assets)?

7. Error Resilience & Recovery
   ├── Do external HTTP/RPC calls define explicit timeouts and retry policies?
   ├── Does the UI gracefully handle 4xx/5xx network failures?
   └── Are database connections safely pooled and closed?

8. Contract & Backwards Compatibility
   ├── Does this change maintain compatibility with active mobile/frontend clients?
   └── Will queued background jobs from the previous release succeed under new code?

9. User Flow & State Completeness
   ├── Are empty states, loading skeletons, and error screens implemented?
   └── Are keyboard navigation and accessibility standards respected?

10. Deploy & Infrastructure Parity
    ├── Does the production build command (`npm run build`, `go build`, etc.) succeed?
    └── Are container healthcheck endpoints functional?
```

---

## Output Format & Verdict

`/ei:ship` outputs an uncompromising assessment that categorizes findings into **Blockers** (must be resolved before deploy) and **Advisories** (can be resolved post-launch).

### Real-World Ship Report Example

```markdown
# Engineering Intelligence: Ship Verification Gate

**Target Branch:** `release/v2.4.0`  
**Commit:** `7a8f1b2` (Deploying to Staging/Production)  
**Overall Verdict:** 🛑 NO-GO (2 Blockers identified)

---

## Verification Matrix

| Check | Status | Notes |
| :--- | :---: | :--- |
| **1. Test Suite** | PASS | 142/142 tests passing (9.4s). |
| **2. Migrations** | 🛑 FAIL | Migration `0042_add_phone.sql` adds `NOT NULL` without a default value. |
| **3. Env Config** | 🛑 FAIL | `STRIPE_WEBHOOK_SECRET` added in code but missing in `.env.example`. |
| **4. Security** | PASS | All 4 new routes verified against authorization middleware. |
| **5. Observability** | PASS | Sentry error boundaries and structured logs verified. |
| **6. Performance** | PASS | Build artifact size within budget; queries indexed. |
| **7. Error Handling** | PASS | External SMS gateway call configured with 3000ms timeout. |
| **8. Backwards Compat**| PASS | API payload changes are non-breaking. |
| **9. Build Sanity** | PASS | Production compilation finished with 0 errors. |

---

## 🛑 Release Blockers

### Blocker 1: Database Migration Locks Table
- **File:** `migrations/0042_add_phone.sql`
- **Issue:** Adding `phone_number VARCHAR NOT NULL` on a table with 2,000,000 rows will lock the table and fail immediately because existing rows cannot satisfy the `NOT NULL` constraint.
- **Required Fix:** Make column nullable or provide a default value, then backfill.

### Blocker 2: Missing Environment Variable Documentation
- **File:** `src/config/billing.ts:L12`
- **Issue:** Code references `process.env.STRIPE_WEBHOOK_SECRET` with no fallback. Deploying this without configuring CI/CD secrets will crash the server on boot.
- **Required Fix:** Add `STRIPE_WEBHOOK_SECRET=` to `.env.example` and verify deployment pipeline secrets.

---

## Pre-Release Sign-Off Checklist
- [ ] Fix migration `0042_add_phone.sql` to allow nulls
- [ ] Add `STRIPE_WEBHOOK_SECRET` to `.env.example` and production secret manager
- [ ] Re-run `/ei:ship` to confirm GREEN status before promoting to production
```

---

## Summary

Use `/ei:ship` as your pull request gate or release sign-off step. It ensures that code produced with AI assistance is not merely syntactically functional, but truly ready for real-world traffic, security adversaries, and scale.
