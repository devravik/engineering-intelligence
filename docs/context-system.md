# The `.ei/` Project Context System

AI coding agents are inherently stateless across conversations. When starting a new session or entering an unfamiliar codebase, they rely on generic training priors—often hallucinating architectural patterns that conflict with your team's established practices.

The **`.ei/` Project Context System** solves this by establishing an explicit, version-controlled source of engineering truth directly inside the repository.

---

## The `.ei/` Directory Layout

Running [`/ei:init`](./commands/init.md) initializes a dedicated `.ei/` folder at the repository root:

```text
.ei/
├── context.md        # Mission, core entities, tech stack summary
├── architecture.md   # System boundaries, layering rules, persistence
├── conventions.md    # Code style, error handling, naming idioms
├── decisions.md      # Architecture Decision Records (ADRs)
├── constraints.md    # Hard invariants, compliance, forbidden patterns
└── design.md         # UI/UX philosophy, key workflows, design tokens
```

---

## Detailed File Specifications

### 1. `.ei/context.md` (Domain & Tech Stack Baseline)
Captures what the project actually does, who uses it, and the foundational technologies.

**Sections:**
* **Project Mission:** 1-2 sentence description of the system's core purpose.
* **Primary Domain Entities:** Core models and concepts (e.g., `Tenant`, `Subscription`, `Invoice`).
* **Technology Stack:** Languages, runtime, major frameworks, and pinned versions.
* **Repository Structure:** Top-level directory mappings.

---

### 2. `.ei/architecture.md` (System Topology & Boundaries)
Defines how modules interact and where boundaries lie.

**Key Questions Answered:**
* What is the overarching architecture (Modular Monolith, Hexagonal, Event-Driven, Simple MVC)?
* How does data flow from HTTP/RPC request to persistence?
* What are the strict boundary rules (e.g., "Controllers may never invoke queries directly; they must call Domain Services")?
* How is state managed on client and server?

---

### 3. `.ei/conventions.md` (Patterns & Idioms)
Codifies the project's consensus on code structure so the AI produces code indistinguishable from senior team members.

**Key Content:**
* **Error Handling Idioms:** Does the project throw exceptions, return Result objects, or use Go-style `(val, err)` tuples?
* **Naming Schemes:** Database column conventions (snake_case), API keys (camelCase), test file suffixes (`.test.ts` vs `.spec.ts`).
* **Validation Patterns:** Where are inputs validated (Zod, Pydantic, FormRequests)?
* **Testing Conventions:** Are unit tests colocated with source files or located in a separate `/tests` directory?

---

### 4. `.ei/decisions.md` (Architecture Decision Records)
Maintains a log of deliberate engineering choices and trade-offs. This prevents agents from proposing "improvements" that the team has already explicitly rejected.

**ADR Format:**
```markdown
## ADR-003: Direct Drizzle ORM Queries Over Repository Pattern
- **Date:** 2026-04-12
- **Context:** We evaluated creating a repository abstraction layer over Drizzle.
- **Decision:** Rejected the repository pattern. We query Drizzle directly inside Server Actions.
- **Rationale:** We have a single PostgreSQL database and will not switch persistence layers. Adding repositories doubled the number of files without providing mocking or flexibility benefits.
- **Consequence:** Do not introduce generic repository interfaces.
```

---

### 5. `.ei/constraints.md` (Invariants & Guardrails)
Documents hard limits, performance budgets, compliance mandates, and forbidden dependencies.

**Examples:**
* **Forbidden Dependencies:** `Moment.js` (use native `Date` or `date-fns`), `Redux` (use `Zustand`), `Axios` (use native `fetch`).
* **Performance Ceilings:** API response times must remain under 150ms for p95; database queries must never perform full table scans on tables > 10,000 rows.
* **Security & Compliance:** Tenant isolation must be enforced via PostgreSQL Row-Level Security (RLS); plaintext secrets in source files are strictly forbidden.

---

### 6. `.ei/design.md` (User Experience & UI Hierarchy)
If the repository contains a user interface, this file establishes the visual and functional guidelines.

**Core Sections:**
* **Target User & Device:** e.g., "Mobile-first inspection workers on iPads in outdoor lighting."
* **Primary User Workflow:** The critical path through the application that must never be disrupted.
* **Design Philosophy:** e.g., "High-density data tables over spaced-out cards; high contrast over subtle pastels."
* **Design System & Tokens:** Typography scales, primary palette, component library (e.g., Radix UI, Tailwind CSS).

---

## Token Budget & Context Efficiency

Large context documents degrade agent attention. Engineering Intelligence adheres to strict **Context Density Guidelines**:

1. **Information Density Over Length:** Use concise bullet points, markdown tables, and code snippets instead of verbose essays.
2. **Target File Sizes:** Each `.ei/*.md` file should ideally remain between 50 and 200 lines. The entire `.ei/` directory should fit comfortably within ~5,000 tokens.
3. **No Code Dumps:** Link to canonical source files (`src/auth/session.ts`) as reference implementations rather than copying entire classes into `.ei/`.

---

## Context Lifecycle

```text
       Onboarding               Development                Evolution
           │                         │                         │
     Run `/ei:init`           Agent consults            Team updates
           │                  .ei/ during all           .ei/decisions.md
           ▼                  prompts & reviews         on major refactors
     Generates .ei/                  │                         │
     context files                   ▼                         ▼
     committed to Git         Zero generic slop         AI stays aligned
```

By maintaining `.ei/` in Git, your entire team—human engineers and AI coding agents alike—operates with continuous shared architectural clarity.
