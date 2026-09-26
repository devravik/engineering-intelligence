# `/ei:simplify` — Radical Code Simplification

The `/ei:simplify` command attacks artificial complexity, premature abstraction, and unnecessary code.

AI coding agents are naturally biased toward generative expansion: given a prompt, they create new interfaces, extra utility files, wrapper services, configuration objects, and defensive checks. Over time, this inflates codebase entropy.

`/ei:simplify` acts as an anti-entropy counterweight. Its objective is to **remove complexity that does not buy concrete value**.

---

## Invocation

```text
/ei:simplify
```

### Options & Scopes

* `/ei:simplify`: Analyzes the working tree diff or most recent commit for simplifications.
* `/ei:simplify <path/to/file_or_dir>`: Targets a specific file, module, or package.
* `/ei:simplify --aggressive`: Collapses single-use abstractions, inlines one-off helper functions, and merges split files.
* `/ei:simplify --dry-run`: Produces a simplification plan and diff preview without modifying files.

---

## What `/ei:simplify` Targets

### 1. Single-Implementation Interfaces & Indirection
* **Problem:** Creating `IUserService`, `UserServiceImpl`, and `UserServiceProvider` when there is only ever one user service.
* **Simplification:** Collapse into a single, cohesive `UserService` class or module. Remove the interface until a second concrete implementation actually exists.

### 2. Gratuitous SDK & ORM Wrappers
* **Problem:** Wrapping an existing, well-designed ORM or SDK query builder in a custom "clean" wrapper that simply delegates calls 1:1.
* **Simplification:** Use the ORM or SDK directly at the domain boundary.

### 3. Premature Generics & Speculative Flexibility
* **Problem:** Designing generic `<T, K extends keyof T>` type abstractions or configurable plugin systems for code that only handles one data structure.
* **Simplification:** Replace generic type gymnastics with concrete, readable types.

### 4. Over-Defensive Code for Impossible States
* **Problem:** Wrapping already-validated inputs in layers of redundant null checks, nested try-catches, and fallback defaults that mask bugs.
* **Simplification:** Fail fast at the perimeter. Trust internal invariants.

### 5. AI Commentary & Echo Comments
* **Problem:** Auto-generated comments that restate the code line-by-line:
  ```typescript
  // Get the user by ID
  const user = await getUserById(id);
  // Return the user
  return user;
  ```
* **Simplification:** Delete comments that explain *what* the code does. Keep only comments that explain non-obvious *why*.

### 6. Unnecessary State & Derived Properties
* **Problem:** Storing calculated values in React state or database columns and adding synchronization logic.
* **Simplification:** Compute derived values on the fly. Eliminate the synchronization overhead.

---

## Simplification Protocol

When executing `/ei:simplify`, the agent adheres to this discipline:

```text
1. Identify Candidate Surface
   ├── New classes, functions, or abstractions introduced in the scope
   └── High cyclomatic complexity or deep indirection chains

2. Test the Justification
   ├── "Does this abstraction support at least two distinct, active callers?"
   ├── "Would removing this layer make the execution flow easier to trace?"
   └── "Is this safety check guarding against an impossible scenario?"

3. Formulate the Reduction
   ├── Inline single-use helpers
   ├── Collapse pass-through wrappers
   └── Strip echo comments and dead branches

4. Verify Behavioral Invariance
   ├── Ensure public API contracts remain identical
   ├── Run existing test suites to guarantee zero regression
   └── Measure deleted lines of code (LOC delta)
```

---

## Real-World Before / After Example

### Before: Over-Engineered AI Generation (63 lines, 3 files)

```typescript
// src/services/email/IEmailSender.ts
export interface IEmailSender {
  send(to: string, subject: string, body: string): Promise<boolean>;
}

// src/services/email/EmailSenderFactory.ts
export class EmailSenderFactory {
  static createSender(type: 'resend'): IEmailSender {
    if (type === 'resend') return new ResendEmailSender();
    throw new Error('Unsupported sender');
  }
}

// src/services/email/ResendEmailSender.ts
export class ResendEmailSender implements IEmailSender {
  private client: Resend;
  constructor() {
    this.client = new Resend(process.env.RESEND_API_KEY);
  }
  async send(to: string, subject: string, body: string): Promise<boolean> {
    try {
      const res = await this.client.emails.send({ from: 'noreply@app.com', to, subject, html: body });
      return !!res.data;
    } catch (e) {
      console.error(e);
      return false;
    }
  }
}
```

### After: Simplified Implementation (14 lines, 1 file)

```typescript
// src/services/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const { data, error } = await resend.emails.send({
    from: 'noreply@app.com',
    to,
    subject,
    html,
  });
  if (error) throw new Error(`Email delivery failed: ${error.message}`);
  return data;
}
```

**Result:**  
* 49 lines of code deleted (78% reduction).  
* 2 files deleted.  
* Proper error propagation restored (no swallowed exceptions).  
* Identical functionality with dramatically lower cognitive load.

---

## Summary Metrics

Every `/ei:simplify` report concludes with a **Simplicity Delta**:

```text
Simplicity Delta:
  Files: -2
  Lines: -49 (+14 / -63)
  Cognitive Layers Removed: Factory, Interface
  Status: All 18 existing tests passing
```
