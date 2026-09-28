# Engineering Intelligence for Claude Code

Stop Claude Code from shipping bad code. Catch architecture, security, database, API, and UI problems before they reach production.

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)

Claude Code writes code rapidly. But like all LLMs, it can cheerfully introduce single-implementation interfaces, N+1 query loops, missing authentication checks, and swallowed exceptions. 

Engineering Intelligence equips Claude Code with **81 deterministic engineering detectors** (32 code + 49 UI) and the **Staff Engineer verification protocol**.

---

## 1-Command Installation

Install Engineering Intelligence directly into Claude Code:

```bash
npx skills add devravik/engineering-intelligence
```

Or install via the official npm package:

```bash
npx @devravik/engineering-intelligence install --provider claude
```

Verify your installation:

```bash
ei --version
```

---

## How Claude Code Uses Engineering Intelligence

Once installed, Claude Code has access to the `/ei` slash commands and active skill instructions.

### 1. Catching N+1 Queries Before PR (`DB-002`)

When you ask Claude Code to build a feature that iterates over records:

```text
User: "Add an endpoint that returns all active users and their latest invoice."
```

Instead of generating an N+1 query loop:
```typescript
// ❌ What Claude Code might generate without EI:
const users = await db.users.findMany();
const result = await Promise.all(users.map(async u => ({
  ...u,
  latestInvoice: await db.invoices.findFirst({ where: { userId: u.id } }) // DB-002 N+1!
})));
```

Running `ei detect --changed` immediately catches it:
```bash
$ ei detect --changed
NEW  DB-002  Database or ORM query invoked synchronously inside iteration loop
     src/api/users.ts:84
```
Claude Code automatically refactors to a single joined query or batch `DataLoader` before presenting the solution.

---

### 2. Guarding Mutating Endpoints (`API-001`)

Claude Code often writes convenient API endpoints without checking authorization:

```typescript
// ❌ Missing authorization guard:
export async function POST(req: Request) {
  const { projectId, role } = await req.json();
  await db.projectMembers.create({ data: { projectId, role } }); // API-001!
  return NextResponse.json({ ok: true });
}
```

Engineering Intelligence blocks the change:
```bash
$ ei detect --changed
NEW  API-001  Mutating API endpoint or server action modifies state without authorization check
     src/routes/projects.ts:42
```

Claude Code adds the required session authorization check before proposing the commit.

---

### 3. Pre-Merge Ship Gate (`ei ship`)

Before opening a pull request, run the 10-point release gate:

```bash
$ ei ship
```

```text
══════════════════════════════════════════════════════════════
  ENGINEERING INTELLIGENCE · PRODUCTION READINESS SHIP GATE
══════════════════════════════════════════════════════════════

  [✓] Zero Blocker Findings
  [✓] Zero Fix-Required Findings
  [✓] Zero Critical Vulnerabilities
  [✓] Behavioral Invariance (120 tests passed)
  [✓] Architectural Boundaries Honored
  [✓] UI Visual Restraint & Accessibility (WCAG AA)
  [✓] Zero Unknown Verification States

  TERMINAL DISPOSITION: SHIP
  All production readiness preconditions satisfied.
```

---

## Daily Claude Code Workflow

```bash
# 1. Start a project with durable memory
ei init

# 2. Check changes Claude Code just made
ei detect --changed

# 3. Get the staff-level review matrix
ei review

# 4. Remove single-use abstractions and echo comments
ei simplify src/services/

# 5. Verify production readiness
ei ship
```
