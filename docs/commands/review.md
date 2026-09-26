# `/ei:review` — Senior Engineering Review

The `/ei:review` command performs a deep, senior-engineering review of active changes, pull requests, or specified subsystems.

Unlike standard static analysis tools that nitpick semicolons and formatting, `/ei:review` evaluates **architectural integrity, failure modes, anti-slop patterns, domain correctness, and maintainability**.

---

## Invocation

```text
/ei:review
```

### Options & Scopes

* `/ei:review`: Reviews uncommitted working tree changes (`git status` and working diff).
* `/ei:review --staged`: Reviews only changes currently staged in Git index (`git diff --cached`).
* `/ei:review --branch main`: Reviews the full diff between current branch and `main`.
* `/ei:review src/auth/`: Scopes review to a specific directory or file.
* `/ei:review --anti-slop`: Enforces extra scrutiny on generic AI patterns, premature abstraction, and bloated boilerplate.
* `/ei:review --security`: Focuses specifically on authorization boundaries, data sanitization, secrets, and OWASP risks.

---

## Review Evaluation Dimensions

Every review cross-references active changes against the project's `.ei/` context and evaluates across six core dimensions:

```text
1. Architectural Coherence
   ├── Does this respect established layering boundaries?
   ├── Does it introduce redundant patterns or conflicting paradigms?
   └── Does it honor the project's Architecture Decision Records (.ei/decisions.md)?

2. Anti-Slop & Simplicity
   ├── Are there empty interfaces, one-off factories, or pointless indirection?
   ├── Is there excessive defensive coding for impossible internal states?
   └── Are comments merely restating the code verbatim?

3. Failure Modes & Edge Cases
   ├── How does this fail when network timeouts, nulls, or 500s occur?
   ├── Are transactions or database locks properly managed?
   └── Are resources (connections, file descriptors, event listeners) leaked?

4. Security & Data Integrity
   ├── Are authentication and authorization checks enforced at domain boundaries?
   ├── Are inputs validated and sanitized at the perimeter?
   └── Are tenant boundaries strictly preserved?

5. Blast Radius & Regressions
   ├── Will changing this signature break callers elsewhere in the repository?
   ├── Do database schema alterations require zero-downtime migration steps?
   └── Are existing unit/integration tests updated or invalidated?

6. Performance & Efficiency
   ├── Are there hidden N+1 query patterns or unbounded in-memory loops?
   └── Are heavy operations performed synchronously inside request loops?
```

---

## Output Structure

Reviews present findings ordered strictly by **severity and leverage**, not line order.

Findings are categorized into four tiers:
* **CRITICAL**: Immediate blockers (data corruption risks, security bypasses, breaking API regressions).
* **HIGH**: Architectural violations, severe anti-slop, unhandled catastrophic failure modes.
* **MEDIUM**: Maintainability hazards, missing test coverage, subtle performance bottlenecks.
* **NIT**: Minor style or naming suggestions (kept minimal to preserve signal).

### Real-World Review Output Example

```markdown
# Engineering Intelligence Review Report

**Target:** `feature/stripe-webhooks` (Diff against `main`, 4 files changed, +148/-22)  
**Context:** Matched against `.ei/architecture.md` (Modular Monolith)

---

### [CRITICAL] Webhook signature verification missing replay attack protection
- **Category:** Security / Correctness
- **Evidence:** `src/webhooks/stripe.ts:L34-L46`
- **Why It Matters:** The webhook handler verifies the cryptographic signature but does not verify the timestamp tolerance header, leaving the endpoint vulnerable to replay attacks.
- **Suggested Change:**
  ```diff
  - const event = stripe.webhooks.constructEvent(body, sig, secret);
  + const event = stripe.webhooks.constructEvent(body, sig, secret, {
  +   tolerance: 300 // 5-minute replay window
  + });
  ```
- **Confidence:** High
- **Affected Surface:** Stripe billing reconciliation

---

### [HIGH] Premature AbstractFactory introduced for single webhook provider
- **Category:** Anti-Slop / Architecture
- **Evidence:** `src/webhooks/WebhookHandlerFactory.ts:L1-L58`
- **Why It Matters:** The implementation introduces an abstract generic factory, two interface definitions, and a provider registry, even though the application exclusively uses Stripe and has no roadmap for alternative billing providers. This introduces 4 files of indirection with zero operational benefit.
- **Suggested Change:**
  Delete `WebhookHandlerFactory.ts` and `IWebhookHandler.ts`. Route incoming Stripe events directly to `handleStripeEvent(req, res)` as specified in `.ei/architecture.md`.
- **Confidence:** High
- **Affected Surface:** Internal webhook routing

---

### [MEDIUM] Database write inside un-idempotent webhook handler
- **Category:** Correctness / Reliability
- **Evidence:** `src/webhooks/handlers/invoicePaid.ts:L18`
- **Why It Matters:** Stripe routinely retries webhooks on network drops. If the handler receives duplicate `invoice.paid` events, it will increment the user's credits twice.
- **Suggested Change:** Wrap the credit increment in a database transaction that first checks for existing `processed_webhook_events` record with the Stripe event ID.
- **Confidence:** High

---

## Summary Verdict
- **Status:** ⚠️ Changes Requested
- **Action Items:** 1 Critical fix, 1 Simplicity cleanup (delete factory), 1 Idempotency check.
```

---

## Agent Instructions for `/ei:review`

When you as an agent are instructed to run `/ei:review`:
1. Inspect `git status` and `git diff` using local tools.
2. Read `.ei/context.md` and `.ei/architecture.md` if they exist.
3. Verify claims by checking caller files or grepping for symbol usages.
4. Suppress superficial comments; only report issues that a Principal Engineer would stop a pull request for.
5. Provide precise, copy-pasteable diffs for all proposed fixes.
