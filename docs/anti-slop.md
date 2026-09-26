# The Anti-Slop Specification

One of the defining pillars of Engineering Intelligence is **Anti-Slop**.

Modern Large Language Models are exceptionally skilled at writing syntactically valid code. However, left unguided, they exhibit a strong degenerative tendency to generate software that is **plausible, polished, technically functional, but fundamentally thoughtless**.

In Engineering Intelligence, we designate this phenomenon as **AI Slop**.

---

## What is AI Slop?

> **AI Slop is software output that is plausible, syntactically correct, and visually or structurally polished, but insufficiently deliberate, excessively complex, or ungrounded in real requirements.**

Slop is dangerous because unlike syntax errors or compilation failures, **slop looks correct**. It passes unit tests, compiles without errors, and passes superficial code reviews. Yet it quietly degrades codebase velocity, inflates cognitive load, and shifts engineering focus toward cosmetic trivia.

---

## The 5 Taxonomies of Slop

Engineering Intelligence categorizes slop into five distinct operational domains:

```text
                     THE 5 FORMS OF SLOP
                              │
     ┌──────────────┬─────────┴─────────┬──────────────┐
     ▼              ▼                   ▼              ▼
1. Code Slop   2. Architecture    3. UI Slop     4. Product Slop
     │              Slop                │              │
  Gratuitous     Clean Arch          Generic        Dashboard
  wrappers,      cosplay,            gradients,     before core
  echo comments, unnecessary         nested cards,  workflow,
  over-defensive indirection,        meaningless    speculative
  checks         mock factories      illustrations  features
     │              │                   │              │
     └──────────────┴─────────┬─────────┴──────────────┘
                              ▼
                    5. Test & Doc Slop
                              │
                       Testing mocks,
                       echo docstrings,
                       100% fake coverage
```

---

### 1. Code Slop (Ceremony Over Substance)

Code slop introduces layers of trivial ceremony that accomplish nothing functional:

* **Single-Implementation Interfaces:** Declaring `interface IUserService` when there is only ever one concrete `UserService`.
* **Gratuitous Wrapper Functions:** Wrapping standard library methods or ORM queries in identical helper functions (`async function findUserById(id) { return await db.user.findUnique({ where: { id } }); }`).
* **Echo Comments:** Auto-generated comments that restate the code:
  ```typescript
  // Set customer status to active
  customer.status = 'active';
  ```
* **Over-Defensive Null Gymnastics:** Adding 4 levels of optional chaining (`user?.profile?.settings?.theme?.mode`) in code paths where the type system and API already guarantee object presence.
* **Catch-and-Swallow Error Wrappers:** Wrapping calls in generic try-catches that log to `console.error` and return `null`, destroying root-cause stack traces.

---

### 2. Architecture Slop ("Clean Architecture" Cosplay)

Architecture slop occurs when an agent forces enterprise-scale architectural patterns into small or medium codebases where they provide negative ROI:

* **The Infinite Ladder of Indirection:**
  ```text
  Controller ➔ DTO ➔ InputBoundary ➔ Interactor ➔ Entity ➔ OutputBoundary ➔ Presenter ➔ ViewModel
  ```
  when the entire operation is simply fetching a row by primary key and displaying it.
* **Premature Microservices & Event Brokers:** Introducing RabbitMQ, Kafka, or decoupled microservices for systems handling 5 requests per second.
* **Speculative Plugin Architectures:** Designing extensible factory registries for features that have zero variations on the product roadmap.

---

### 3. UI Slop (The Generic AI SaaS Template)

When asked to build a user interface, AI agents default to an identical, commoditized aesthetic:

* **The Purple/Indigo Gradient Hero:** Every AI-generated landing page features the exact same dark violet/blue background gradient with blurry glassmorphism cards.
* **Meaningless Stat Badges:** Adding random "42% efficiency increase", "99.9% uptime", or "12,000+ active users" stat counters that have no basis in reality.
* **Nested Cards Inside Cards:** Placing a card inside a container, inside another bordered card with subtle shadows, creating visual noise without hierarchy.
* **Empty Generic Copy:** Sentences such as *"Unlock the ultimate potential of your workflow with our cutting-edge AI-powered platform."*

---

### 4. Product Slop (Building Peripheral Fluff First)

Product slop occurs when the agent expends effort on peripheral, shiny features rather than perfecting the core operational loop:

* **Dashboards Before Workflows:** Generating an elaborate analytics dashboard with 6 charts before the user can even create, edit, or delete the underlying business entity.
* **Speculative Configuration:** Creating extensive settings panels, theme switchers, and export dialogues before verifying that the main screen satisfies user intent.
* **AI Hallucinations as Features:** Slapping an "AI Summary" widget onto a simple data table where sorting or filtering is what the user actually needed.

---

### 5. Test & Documentation Slop (The Illusion of Quality)

* **Testing Mocks Instead of Behavior:** Writing unit tests where every single dependency is mocked to the point where the test simply verifies that mock functions were called, leaving real integration behavior completely unverified.
* **Docstring Restatements:**
  ```python
  def calculate_discount(price, rate):
      """
      Calculate discount.

      Args:
          price: The price.
          rate: The rate.

      Returns:
          The calculated discount.
      """
      return price * rate
  ```
  This adds 10 lines of vertical bloat without imparting a shred of domain context.

---

## Anti-Slop is Not a Dogmatic Blacklist

Anti-slop does **not** mean dogmatically banning modern features:

```text
Anti-slop does NOT mean: "Never use interfaces."
Anti-slop does NOT mean: "Never use gradients or cards."
Anti-slop does NOT mean: "Never write unit tests."
Anti-slop does NOT mean: "Never build dashboards."
```

Dogmatically banning patterns simply creates another form of dogmatic slop.

Instead, the core rule of Anti-Slop is:

> **Every significant architectural, visual, or structural decision must be justified by a concrete problem in the current project.**

---

## The 3-Question Senior Engineer Heuristic

Whenever an agent or engineer considers introducing an abstraction, component, or pattern, it must pass three tests:

```text
┌──────────────────────────────────────────────────────────────────┐
│              THE 3-QUESTION ANTI-SLOP HEURISTIC                  │
├──────────────────────────────────────────────────────────────────┤
│ 1. What concrete problem does this solve right now?              │
│    (If the answer begins with "In case we ever want to...",      │
│     reject it.)                                                  │
├──────────────────────────────────────────────────────────────────┤
│ 2. Does the benefit exceed the cognitive overhead of             │
│    understanding and maintaining this indirection?               │
│    (Indirection is debt unless it buys true isolation.)          │
├──────────────────────────────────────────────────────────────────┤
│ 3. Would a senior engineer who has to debug this at 2 AM         │
│    in 3 years be grateful for this structure?                    │
│    (If it obscures what is actually happening, delete it.)       │
└──────────────────────────────────────────────────────────────────┘
```

---

## How Engineering Intelligence Enforces Anti-Slop

Engineering Intelligence implements Anti-Slop across its command suite:

1. **[`/ei:simplify`](./commands/simplify.md):** Proactively hunts down single-implementation interfaces, redundant wrappers, and dead code, suggesting explicit deletions.
2. **[`/ei:review`](./commands/review.md):** Flags anti-slop violations with concrete evidence and replaces speculative abstractions with direct, cohesive implementations.
3. **[`/ei:audit`](./commands/audit.md):** Scans the entire repository for accumulated architectural erosion, dead files, and template slop.
4. **`.ei/conventions.md`:** Stores explicit project-level anti-patterns, ensuring the AI agent does not reintroduce patterns the team has deliberately rejected.
