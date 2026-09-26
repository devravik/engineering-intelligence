# The Restraint Doctrine

The Restraint Doctrine is the philosophical bedrock of Engineering Intelligence:
**Agents must not invent complexity in anticipation of hypothetical requirements.**

---

## 1. Code Restraint Principles

1. **The Rule of Three for Abstraction:**
   Never introduce an abstract class, generic factory, plugin registry, or interface until 3+ concrete, diverging implementations exist in active production code.

2. **No Single-Implementation Interfaces:**
   In TypeScript/JavaScript, interfaces that map 1:1 with a single concrete class add indirection without polymorphism (`ARCH-001`). Write concrete functions and classes first.

3. **Code Over Comments:**
   Do not add comments that merely restate what the code clearly expresses (`SLOP-002`). Comments should explain *why* non-obvious constraints exist, not *what* `getUserById` does.

4. **Pass-Through Indirection Elimination:**
   Functions that merely delegate to an underlying method without transformation, validation, or boundary conversion should be flattened (`CODE-003`).

---

## 2. UI Restraint Principles

1. **Remove Before Adding:**
   When critiquing or improving an interface, always identify elements to remove or simplify before proposing new styling, cards, or micro-components (`distill`).

2. **Not Every Datum Needs a Container:**
   AI agents compulsively wrap every metric, paragraph, and form in a rounded card (`UI-SLOP-003`). Prefer inline layouts, definition lists, and flat tables.

3. **Restrained Token Extraction:**
   Do not tokenize every one-off color or margin value (`extract`). Extract only values with repeated intent (3+ usages). Premature tokenization leads to variable bloat.

4. **Surface-Appropriate Aesthetic:**
   Ground critique in the project's declared surface (`surface.ts`) and `DESIGN.md`. A developer CLI or data-dense admin interface should not look like a consumer landing page.
