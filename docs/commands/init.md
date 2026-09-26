# `/ei:init` — Project Context Initialization

The `/ei:init` command scans your repository, detects your tech stack, extracts existing architectural patterns, and generates a structured `.ei/` context folder.

Without project context, an AI coding agent defaults to generic internet best practices—frequently introducing mismatched patterns (such as adding Redux to an Zustand app, or creating Repository interfaces in an Eloquent codebase). `/ei:init` anchors the agent to the actual reality of your project.

---

## Invocation

```text
/ei:init
```

### Options & Flags

* `/ei:init`: Full repository scan and interactive confirmation of detected patterns.
* `/ei:init --quick`: Fast heuristic scan (scans root configs, dependencies, and top 20 recent commits).
* `/ei:init --deep`: Exhaustive scan (traverses dependency trees, schema files, API routers, and test suites).
* `/ei:init --force`: Overwrites existing `.ei/` context files with freshly analyzed state.

---

## Execution Protocol

When `/ei:init` is triggered, the agent executes the following multi-step discovery process:

```text
1. Ecosystem Discovery
   ├── Package manifests (package.json, composer.json, go.mod, Cargo.toml, pyproject.toml)
   ├── Build & configuration files (tsconfig.json, vite.config.ts, docker-compose.yml)
   └── Lockfiles to verify pinned versions

2. Architecture & Layering Discovery
   ├── Directory topology (e.g., src/features vs. app/Http/Controllers)
   ├── Routing conventions (file-based, declarative router, API gateways)
   └── Boundary isolation rules (monorepo packages, domain layers)

3. Data & Persistence Discovery
   ├── Database type (PostgreSQL, MySQL, SQLite, MongoDB)
   ├── ORM / Data mapper (Prisma, Drizzle, Eloquent, Hibernate, SQLx)
   └── Migration history and schema definitions

4. Conventions & Testing Discovery
   ├── Test framework (Vitest, Jest, PHPUnit, PyTest, Go test)
   ├── Linting and formatting rules (ESLint, Biome, Prettier, Pint, Ruff)
   └── Git history signals (recent commit conventions, active authors)

5. Artifact Generation
   └── Generates the structured `.ei/` context suite
```

---

## Generated Artifacts

`/ei:init` produces a modular `.ei/` directory at the root of your project:

```text
.ei/
├── context.md        # High-level mission, primary entities, core tech stack summary
├── architecture.md   # System topology, layering rules, persistence & state management
├── conventions.md    # Coding style, naming schemes, error handling, testing patterns
├── decisions.md      # Architectural Decision Records (ADRs) and deliberate trade-offs
├── constraints.md    # Invariants, performance budgets, compliance, forbidden dependencies
└── design.md         # Primary user personas, key workflows, UI design tokens (if frontend)
```

### Example: Generated `.ei/architecture.md`

```markdown
# Architecture Overview

## System Type
Modular Monolith (Next.js 15 App Router + Server Actions + Drizzle ORM)

## Boundary Rules
1. Server Actions reside strictly in `src/actions/` and must validate inputs using Zod.
2. Direct database access is restricted to Server Actions and background jobs; Client Components must not import `@/db`.
3. Do NOT introduce an abstract repository pattern or generic service interfaces. Drizzle query builder calls belong directly in action handlers.

## State Management
- Server State: React Query v5 / Server Components
- Local UI State: React `useState` / `useReducer`
- Forbidden: Redux, MobX, global singletons
```

---

## Real-World Output Example

```text
Engineering Intelligence: Initializing Project Context...

Scanning repository root: /workspace/billing-service

✓ Detected Environment: Node.js v22.4, TypeScript 5.6
✓ Detected Framework: Next.js 15 (App Router)
✓ Detected Data Layer: Drizzle ORM, PostgreSQL (pgvector)
✓ Detected Test Suite: Vitest (Unit), Playwright (E2E)
✓ Analyzed 184 source files across 12 modules
✓ Discovered 26 API routes and 41 Server Actions
✓ Extracted conventions from ESLint and Biome configuration

Generating context suite in .ei/:
  [CREATED] .ei/context.md
  [CREATED] .ei/architecture.md
  [CREATED] .ei/conventions.md
  [CREATED] .ei/decisions.md
  [CREATED] .ei/constraints.md
  [CREATED] .ei/design.md

Project initialized. All subsequent commands (/review, /simplify, /impact, etc.)
will now validate against these architectural baselines.
```

---

## Best Practices

1. **Commit `.ei/` to Git:**  
   Treat `.ei/` as first-class project documentation. When new team members or AI agents enter the codebase, they immediately inherit the project's engineering memory.
2. **Review After Refactors:**  
   If your team transitions architectures (e.g., migrating from REST to GraphQL, or adopting a new state library), run `/ei:init` or manually update the relevant `.ei/` markdown file to keep the agent in sync.
3. **Keep Files Dense & Concise:**  
   `.ei/` files are loaded into agent context windows. Focus on high-signal architectural constraints rather than pasting entire API documentations.
