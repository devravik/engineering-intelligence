# Engineering Intelligence for Cursor

Stop Cursor from shipping bad code. Enforce deterministic architecture, security, API, database, and UI rules directly in your editor.

[![skills.sh](https://skills.sh/b/devravik/engineering-intelligence)](https://skills.sh/devravik/engineering-intelligence)

Cursor's Composer and Agent modes generate code fast. But AI-assisted refactoring frequently introduces pass-through abstractions, unindexed foreign keys, unbounded HTTP calls, and purple/blue card UI slop.

Engineering Intelligence integrates directly with Cursor using `.cursor/rules/` (`.mdc`), MCP servers, and the `ei` CLI.

---

## 1-Command Installation

Install into Cursor via skills.sh:

```bash
npx skills add devravik/engineering-intelligence
```

Or initialize Cursor rules directly:

```bash
npx @devravik/engineering-intelligence install --provider cursor
```

Verify your installation:

```bash
ei --version
```

This provisions `.cursor/rules/engineering-intelligence.mdc`, grounding Cursor in deterministic quality rules across all prompts and edits.

---

## Cursor Examples in Action

### 1. Eliminating Speculative Abstractions & Single-Use Interfaces (`ARCH-001`, `SLOP-001`)

Cursor frequently introduces speculative design patterns:

```typescript
// ❌ What Cursor might generate:
export interface IStripePaymentGateway { // ARCH-001: Only one implementation exists!
  charge(amount: number, token: string): Promise<ChargeResult>;
}

export class StripePaymentGatewayFactory { // SLOP-001: Pass-through factory for single class!
  static create(): IStripePaymentGateway {
    return new StripePaymentGateway();
  }
}
```

Engineering Intelligence catches the unnecessary complexity:
```bash
$ ei detect --changed
NEW  ARCH-001  Single-implementation interface adds indirection without polymorphism
     src/services/payments/types.ts:14
NEW  SLOP-001  Pass-through Factory class merely wraps single concrete instantiation
     src/services/payments/factory.ts:3
```
Running `ei simplify src/services/payments` collapses the indirection into a clean, direct service with zero unnecessary layers.

---

### 2. Preventing Table-Locking Migrations (`DB-003`)

When asking Cursor to write a Prisma or SQL migration:

```sql
-- ❌ What Cursor might write:
ALTER TABLE "users" ADD COLUMN "organization_id" UUID NOT NULL;
```

Engineering Intelligence catches the locking risk:
```bash
$ ei detect --changed
NEW  DB-003  Table-locking migration adds NOT NULL column without DEFAULT value
     prisma/migrations/20260928_add_org/migration.sql:1
```
Cursor modifies the migration to make the column nullable or provide a default value, preventing catastrophic table locks on production Postgres / MySQL databases.

---

### 3. Detecting Outbound HTTP Calls Without Timeouts (`API-005`)

Cursor often writes raw `fetch` calls:

```typescript
// ❌ Dangerous unbounded HTTP call:
const res = await fetch("https://api.partner.com/v1/sync", {
  method: "POST",
  body: JSON.stringify(data),
});
```

Engineering Intelligence flags the missing timeout:
```bash
$ ei detect --changed
NEW  API-005  Outbound HTTP request executed without timeout, AbortSignal, or client wrapper
     src/integrations/sync.ts:12
```

---

## Daily Cursor Workflow

1. **Ground your project memory**: `ei init`
2. **Review Cursor Composer diffs**: `ei detect --changed`
3. **Audit frontend changes against slop**: `ei ui critique`
4. **Enforce release readiness**: `ei ship`
