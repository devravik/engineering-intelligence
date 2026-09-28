# 81 Problems AI Coding Agents Introduce — And How Engineering Intelligence Catches Them

AI writes code faster. Engineering Intelligence checks whether it should ship.

Large Language Models generate working code that is frequently bad software. Below is the concrete catalog of problems AI coding agents introduce, mapped directly to Engineering Intelligence's deterministic detectors.

---

## 1. Database & ORM Failures

| What the AI generates | Why it breaks production | Detector Rule |
| :--- | :--- | :--- |
| **N+1 query loops** | Loops executing SQL queries inside array iteration instead of batching or joining | **`DB-002`** |
| **Table-locking migrations** | Adding `NOT NULL` columns to existing tables without `DEFAULT` values, locking production tables | **`DB-003`** |
| **Unindexed foreign keys** | Creating relational foreign key columns without secondary lookup indexes | **`DB-001`** |
| **Multi-mutation without transaction** | Performing multiple database updates sequentially without an atomic transaction boundary | **`DB-005`** |
| **Irreversible schema operations** | Dropping tables or columns without explicit data migration waivers | **`DB-004`** |

---

## 2. Security & Perimeter Vulnerabilities

| What the AI generates | Why it breaks production | Detector Rule |
| :--- | :--- | :--- |
| **Mutating endpoints without auth** | State-modifying API routes or server actions missing session/role authorization guards | **`API-001`** |
| **Raw SQL string interpolation** | Direct string interpolation (`SELECT ... ${input}`) susceptible to SQL injection | **`SEC-002`** |
| **Hardcoded secrets & private keys** | Committing API tokens, private keys, or passwords directly into source code | **`SEC-001`** |
| **Breaking API modifications** | Modifying public route parameters or contracts, breaking mobile and external consumers | **`API-003`** |

---

## 3. Architectural Decay & Over-Engineering

| What the AI generates | Why it breaks production | Detector Rule |
| :--- | :--- | :--- |
| **Single-implementation interfaces** | Adding speculative interfaces that have exactly one concrete implementation | **`ARCH-001`** |
| **Pass-through factories** | Writing Abstract Factory classes that merely wrap `new ClassName()` without value | **`SLOP-001`** |
| **Circular service dependencies** | Module A importing Module B which imports Module A, creating fragile runtime cycles | **`ARCH-003`** |
| **Overlapping service responsibilities**| Multiple services duplicating identical public methods and responsibilities | **`ARCH-002`** |
| **Shared mutable request state** | Mutating global/module-scoped variables across concurrent web requests | **`ARCH-005`** |
| **Boundary violations** | Direct database ORM calls inside client-side UI components | **`ARCH-004`** |

---

## 4. Code Quality & Error Handling

| What the AI generates | Why it breaks production | Detector Rule |
| :--- | :--- | :--- |
| **Swallowed exceptions** | Empty `catch (e) {}` blocks that discard stack traces and hide critical runtime failures | **`API-002`** |
| **Unbounded HTTP requests** | Calling external APIs using `fetch()` without timeouts, `AbortSignal`, or retry controls | **`API-005`** |
| **Floating unawaited promises** | Calling async APIs in mutating handlers without `await` or `.catch()` | **`CODE-007`** |
| **Compiler suppression abuse** | Spraying `@ts-ignore`, `@ts-nocheck`, and gratuitous `as any` type bypasses | **`CODE-006`** |
| **Tautological echo comments** | Comments that verbatim restate the syntax line without providing architectural rationale | **`SLOP-002`** |
| **Dead code & zombie exports** | Exporting functions or classes that are never referenced anywhere in the repository | **`CODE-002`** |
| **Unused npm dependencies** | Adding dependencies to `package.json` that are never imported | **`CODE-004`** |

---

## 5. Testing Anti-Patterns

| What the AI generates | Why it breaks production | Detector Rule |
| :--- | :--- | :--- |
| **Tautological test assertions** | Writing `expect(true).toBe(true)` or non-asserting tests to fake coverage metrics | **`TEST-002`** |
| **Committed skipped tests** | Leaving `.skip`, `.only`, `xit`, or `fit` in test suites to silence failing tests | **`TEST-004`** |
| **Happy-path only testing** | Services with critical throw statements tested with zero negative test cases | **`TEST-003`** |
| **Modified code without tests** | Modifying business logic files without accompanying updates to test files | **`TEST-001`** |

---

## 6. Frontend & AI UI Slop

| What the AI generates | Why it breaks production | Detector Rule |
| :--- | :--- | :--- |
| **AI purple/blue gradients** | Formulaic, repetitive `from-purple-600 to-indigo-600` aesthetic across every surface | **`UI-COLOR-001`** |
| **Card-in-card visual clutter** | Nesting containers within cards within sections, creating bloated UI noise | **`UI-SLOP-003`** |
| **Everything-centered layout** | Centering all text, buttons, headings, and data tables regardless of visual balance | **`UI-SPATIAL-001`** |
| **Color palette explosion** | Introducing 25+ ad-hoc hex codes instead of using design tokens | **`UI-COLOR-003`** |
| **Tiny touch targets on mobile** | Interactive buttons and icons smaller than the 44×44px mobile touch target | **`UI-RESP-005`** |
| **Missing accessible labels** | Form inputs and interactive icon buttons without labels or ARIA descriptions | **`UI-A11Y-002`, `UI-A11Y-003`** |
| **Broken mobile viewports** | Fixed desktop assumptions causing horizontal overflow and layout clipping on mobile | **`UI-RESP-001`, `UI-RESP-006`** |

---

## Catch All 81 Problems With One Command

```bash
npx skills add devravik/engineering-intelligence
```

Then in your repository:

```bash
ei detect --changed
```
