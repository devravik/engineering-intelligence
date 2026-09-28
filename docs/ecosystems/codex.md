# Engineering Intelligence for GitHub Copilot & Codex

Stop GitHub Copilot and Codex from shipping bad code. Enforce deterministic engineering contracts, security boundaries, and anti-slop rules.

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)

GitHub Copilot and OpenAI Codex suggest code with high speed and velocity. However, they routinely introduce tautological echo comments, circular dependencies, skipped tests, and swallowed exceptions.

Engineering Intelligence provides GitHub Copilot with `.github/copilot-instructions.md` and the `ei` CLI verification suite.

---

## 1-Command Installation

Install into your repository:

```bash
npx skills add devravik/engineering-intelligence
```

Or provision GitHub Copilot instructions:

```bash
npx @devravik/engineering-intelligence install --provider copilot
```

Verify your installation:

```bash
ei --version
```

---

## Copilot & Codex Examples

### 1. Stopping Tautological Echo Comments (`SLOP-002`)

Copilot loves generating redundant line-by-line comments that merely restate the syntax:

```typescript
// ❌ Useless AI echo comments:
// Set user status to active
user.status = "active";

// If user is verified
if (user.isVerified) {
  // Send email to user
  await sendEmail(user.email);
}
```

Engineering Intelligence catches and flags them:
```bash
$ ei detect --changed
NEW  SLOP-002  Tautological echo comment verbatim restates code line without domain context
     src/services/userService.ts:18
```
Run `ei simplify src/services/userService.ts` to strip echo comments while preserving genuine architectural rationale.

---

### 2. Blocking Swallowed Exceptions in Empty Catch Blocks (`API-002`)

Copilot frequently "fixes" TypeScript try/catch blocks by catching and ignoring errors:

```typescript
// ❌ Destroying stack traces and hiding failures:
try {
  await analytics.track(event);
} catch (e) {
  // ignore error
}
```

Engineering Intelligence flags this pattern immediately:
```bash
$ ei detect --changed
NEW  API-002  Swallowed exception in empty or unhandled catch block destroys stack traces
     src/lib/tracking.ts:24
```

---

### 3. Detecting Skipped and Weak Tests (`TEST-002`, `TEST-004`)

When Copilot encounters complex test suites, it often writes tautological assertions or commits `.skip` / `.only`:

```typescript
// ❌ Fake test coverage:
it('should process payments', async () => {
  const result = await processPayment(payload);
  expect(true).toBe(true); // TEST-002: Tautological assertion!
});
```

Engineering Intelligence blocks fake tests:
```bash
$ ei detect --changed
NEW  TEST-002  Weak or tautological test assertion simulates coverage without verifying behavior
     tests/payments.test.ts:45
```
And running `ei review` blocks the PR with a derived `BLOCK` matrix until real assertions verify behavior.
