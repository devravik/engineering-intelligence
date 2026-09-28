# AI-Agent Error Handling Review: Swallowed Exceptions, Hung Connections, and Promise Leaks

Engineering Intelligence detects error handling anti-patterns in AI-generated code. It catches swallowed exceptions, empty catch blocks, HTTP calls without timeouts, and unawaited floating promises before they reach production systems.

Error handling is the category most systematically neglected by AI coding agents. Agents focus on the happy path — the code that works when every dependency is available and every input is valid. Error cases, timeouts, connection failures, and retry logic are underspecified in prompts and underrepresented in the training distribution of "working code."

---

## Error Handling Failures Engineering Intelligence Catches

### 1. Swallowed Exceptions (`API-002`)
* **The Failure**: Wrapping operations in `try/catch` that logs a warning and returns `null`, `undefined`, or a default value — silently hiding the failure from callers.
* **Real-World Impact**: A payment processing service silently returns `null` on a Stripe network timeout. Orders appear to complete. No alert fires. Revenue is lost.
* **Detection**: Identifies catch blocks that lack rethrow, error propagation, or structured error response construction.

```typescript
// What agents write:
try {
  await db.transaction(async (trx) => { ... });
} catch (err) {
  console.warn('Transaction failed', err); // ← swallowed, no rethrow
  return null;
}
```

### 2. HTTP Requests Without Timeouts (`API-005`)
* **The Failure**: Calling external services with `fetch()`, `axios.get()`, or `http.request()` without specifying a timeout or `AbortSignal`.
* **Real-World Impact**: One slow downstream API causes your worker threads to hang indefinitely, exhausting the connection pool and taking down the entire service.
* **Detection**: Scans HTTP call sites for missing `signal: AbortSignal.timeout(ms)` or equivalent timeout configuration.

```typescript
// What agents write:
const response = await fetch(`https://api.stripe.com/charges/${id}`);
// No timeout — hangs forever if Stripe is slow
```

### 3. Unawaited Floating Promises (`CODE-007`)
* **The Failure**: Calling `async` functions inside event handlers, route handlers, or loops without `await`, discarding both the result and any thrown errors.
* **Real-World Impact**: Background cache writes or audit log operations fail silently and the error is never observed.
* **Detection**: Flags `async` function calls in mutating contexts that are not `await`ed and not handled via `.catch()`.

```typescript
// What agents write:
router.post('/events', (req, res) => {
  auditLog.record(req.body); // async, not awaited — errors vanish
  res.json({ ok: true });
});
```

### 4. TypeScript `as any` Casts and `@ts-ignore` (`CODE-006`)
* **The Failure**: Suppressing TypeScript type errors instead of resolving the underlying type incompatibility.
* **Real-World Impact**: The type mismatch that was suppressed at compile time causes a runtime crash when the value is undefined at an unexpected access point.

---

## Installation

```bash
npx skills add devravik/engineering-intelligence
```

---

## Error Handling Review Workflow

```bash
$ ei detect --changed

Engineering Intelligence

NEW  API-002   Swallowed exception: catch block does not rethrow
     src/services/payments.ts:84

NEW  API-005   fetch() without timeout or AbortSignal
     src/integrations/github.ts:52

NEW  CODE-007  Unawaited async call in mutating handler
     src/routes/events.ts:29

3 error handling findings

$ ei ship
BLOCK: 3 findings require resolution
```

---

## Learn More

* [AI-Agent Security Review](ai-agent-security.md)
* [AI-Agent Testing Review](ai-agent-testing-review.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
