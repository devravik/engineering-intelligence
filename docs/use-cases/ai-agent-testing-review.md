# AI-Agent Testing Review: Fake Assertions, Skipped Suites, and Coverage Fraud

Engineering Intelligence detects testing anti-patterns introduced by AI coding agents. It catches fake test assertions, committed skip markers, zero-assertion test bodies, and TypeScript compiler suppression directives that inflate test coverage metrics while providing no actual safety guarantee.

AI agents write tests to satisfy the requirement "add tests," not to provide genuine behavioral coverage. When you ask an agent to "add tests for this function," it commonly writes tests that assert nothing meaningful, immediately pass, and make the test suite green without catching any future regressions.

---

## Testing Anti-Patterns Engineering Intelligence Catches

### 1. Fake Assertions (`TEST-002`)
* **The Failure**: Writing tautological assertions that always pass regardless of behavior.
* **Examples**:
  ```typescript
  expect(response).toBeDefined();           // Always true unless null
  expect(result).not.toBeNull();            // Always true for any value
  expect(true).toBe(true);                  // Trivially true
  expect(items.length).toBeGreaterThan(-1); // Always true
  ```
* **Impact**: Gives false confidence in test coverage. Regressions are not caught.

### 2. Committed Skipped Tests (`TEST-004`)
* **The Failure**: Leaving `.skip` or `.only` markers in committed test files.
* **Examples**:
  ```typescript
  it.skip('handles unauthorized access', ...);
  describe.skip('payment processing', ...);
  test.only('basic creation', ...);  // .only silently disables all other tests
  ```
* **Impact**: Removes real tests from execution without any warning in CI.

### 3. Zero-Assertion Test Bodies (`TEST-001`)
* **The Failure**: Creating `it()` blocks with setup and execution but no `expect()` calls.
* **Examples**:
  ```typescript
  it('processes the request', async () => {
    const result = await processRequest(payload);
    // No assertion — test always passes
  });
  ```
* **Impact**: Tests run and pass while asserting nothing about correctness.

### 4. TypeScript Compiler Suppression (`CODE-006`)
* **The Failure**: Using `// @ts-ignore` or `as any` casts to silence type errors that would otherwise surface real type incompatibilities.
* **Impact**: Hides type errors that often correlate with runtime bugs.

---

## Installation

```bash
npx skills add devravik/engineering-intelligence
```

---

## Testing Review Workflow

```bash
$ ei detect --changed

Engineering Intelligence

NEW  TEST-002   Fake assertion: expect(response).toBeDefined()
     src/__tests__/api/users.test.ts:18

NEW  TEST-004   Committed skip: it.skip('handles auth failure', ...)
     src/__tests__/auth.test.ts:42

NEW  TEST-001   Zero-assertion test body
     src/__tests__/reports.test.ts:67

3 testing findings

$ ei ship
BLOCK: 3 findings require resolution
```

---

## Why AI Agents Produce Bad Tests

AI agents are trained to satisfy the surface structure of a test file (imports, describe blocks, it blocks, expect calls) rather than the semantic content of the assertions. When writing tests:

1. The agent matches the syntactic pattern of existing test files
2. It imports the function under test and calls it
3. It adds a minimal assertion that always passes to make the test "green"
4. It reports: "I've added comprehensive test coverage"

Engineering Intelligence evaluates the *substance* of assertions, not just their presence.

---

## Learn More

* [AI-Generated Code: Risks & Patterns](ai-generated-code.md)
* [AI-Agent Error Handling Review](ai-agent-error-handling.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
