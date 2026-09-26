import { test } from 'node:test';
import assert from 'node:assert';
import { resolve } from 'node:path';
import { runDetectors } from '../../src/detectors/index.js';
import { arch001 } from '../../src/detectors/rules/ARCH-001.js';
import { arch002 } from '../../src/detectors/rules/ARCH-002.js';
import { arch004 } from '../../src/detectors/rules/ARCH-004.js';
import { arch005 } from '../../src/detectors/rules/ARCH-005.js';
import { code003 } from '../../src/detectors/rules/CODE-003.js';
import { code006 } from '../../src/detectors/rules/CODE-006.js';
import { code007 } from '../../src/detectors/rules/CODE-007.js';
import { db001 } from '../../src/detectors/rules/DB-001.js';
import { db002 } from '../../src/detectors/rules/DB-002.js';
import { db003 } from '../../src/detectors/rules/DB-003.js';
import { db005 } from '../../src/detectors/rules/DB-005.js';
import { api001 } from '../../src/detectors/rules/API-001.js';
import { api005 } from '../../src/detectors/rules/API-005.js';
import { test002 } from '../../src/detectors/rules/TEST-002.js';
import { test004 } from '../../src/detectors/rules/TEST-004.js';
import { slop001 } from '../../src/detectors/rules/SLOP-001.js';
import { slop002 } from '../../src/detectors/rules/SLOP-002.js';
import { slop003 } from '../../src/detectors/rules/SLOP-003.js';
import { sec001 } from '../../src/detectors/rules/SEC-001.js';
import { sec002 } from '../../src/detectors/rules/SEC-002.js';

const repoRoot = resolve(process.cwd());

test('ARCH-001: detects single-implementation interface', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/architecture/unnecessary-abstraction.ts',
    detectors: [arch001]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'ARCH-001');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /Single-implementation interface/);
});

test('ARCH-002: detects duplicated responsibility across classes', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/architecture/duplicated-responsibility.ts',
    detectors: [arch002]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'ARCH-002');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /Duplicated responsibility/);
});

test('ARCH-004: detects direct database access in UI client component', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/architecture/boundary-violation.tsx',
    detectors: [arch004]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'ARCH-004');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /boundary violation/i);
});

test('CODE-003: detects excessive indirection and pass-through functions', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/code-quality/pass-through-indirection.ts',
    detectors: [code003]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'CODE-003');
  assert.strictEqual(result.findings[0].impact, 'MEDIUM');
});

test('DB-001: detects missing database index on foreign key column', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/database/unindexed-fk.sql',
    detectors: [db001]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'DB-001');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /customer_id/);
});

test('DB-003: detects unsafe migration adding NOT NULL without DEFAULT', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/database/unsafe-migration.sql',
    detectors: [db003]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'DB-003');
  assert.strictEqual(result.findings[0].impact, 'CRITICAL');
  assert.strictEqual(result.findings[0].disposition, 'BLOCK');
});

test('DB-002: detects N+1 database queries in loop', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/database/n-plus-one.ts',
    detectors: [db002]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'DB-002');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
});

test('API-001: detects missing authorization guard on mutating handler', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/security/missing-auth-route.ts',
    detectors: [api001]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'API-001');
  assert.strictEqual(result.findings[0].impact, 'CRITICAL');
  assert.strictEqual(result.findings[0].disposition, 'BLOCK');
});

test('TEST-002: detects weak tautological assertions', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/testing/weak-assertion.test.ts',
    detectors: [test002]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'TEST-002');
  assert.match(result.findings[0].title, /Tautological test assertion/);
});

test('SLOP-001: detects speculative pass-through factory', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/slop/generic-factory.ts',
    detectors: [slop001]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'SLOP-001');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
});

test('SLOP-002: detects tautological echo comments', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/slop/echo-comments.ts',
    detectors: [slop002]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'SLOP-002');
});

test('SLOP-003: detects speculative plugin registries with 1 registration', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/slop/speculative-registry.ts',
    detectors: [slop003]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'SLOP-003');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
});

test('SARIF: exports valid SARIF v2.1.0 schema with rule annotations', async () => {
  const { formatSarif } = await import('../../src/detectors/sarif.js');
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/architecture/unnecessary-abstraction.ts',
    detectors: [arch001]
  });

  const sarifString = formatSarif(result);
  const sarif = JSON.parse(sarifString);

  assert.strictEqual(sarif.version, '2.1.0');
  assert.ok(sarif.runs[0].tool.driver.name.includes('Engineering Intelligence'));
  assert.strictEqual(sarif.runs[0].results.length, 1);
  assert.strictEqual(sarif.runs[0].results[0].ruleId, 'ARCH-001');
  assert.strictEqual(sarif.runs[0].results[0].level, 'error');
});

test('Custom Rules: loads declarative rules from .ei/rules/', async () => {
  const { loadCustomRules } = await import('../../src/detectors/custom.js');
  const custom = loadCustomRules(repoRoot);
  assert.ok(Array.isArray(custom));
});

test('SEC-001: detects hardcoded secrets and live API credentials', async () => {
  const { writeFileSync, mkdirSync } = await import('node:fs');
  const { join } = await import('node:path');
  const fixtureDir = join(repoRoot, 'fixtures', 'security');
  mkdirSync(fixtureDir, { recursive: true });
  // Construct dummy live Stripe key at runtime so raw secret is not committed in git
  const stripeKey = ['sk', 'live', '51OzK92F8q1N7vL3mX8jK2p4Rw9T1aB'].join('_');
  writeFileSync(
    join(fixtureDir, 'hardcoded-secret.ts'),
    `// Fixture: Hardcoded live payment credentials committed in source\nexport const paymentConfig = {\n  stripeSecretKey: '${stripeKey}',\n  merchantId: 'acct_1032D82eZvKYlo2C'\n};\n`
  );

  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/security/hardcoded-secret.ts',
    detectors: [sec001]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'SEC-001');
  assert.strictEqual(result.findings[0].impact, 'CRITICAL');
  assert.strictEqual(result.findings[0].disposition, 'BLOCK');
  assert.match(result.findings[0].title, /Hardcoded Stripe Live Secret Key/);
});

test('SEC-002: detects unsanitized raw SQL query string interpolation', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/security/sql-injection.ts',
    detectors: [sec002]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'SEC-002');
  assert.strictEqual(result.findings[0].impact, 'CRITICAL');
  assert.strictEqual(result.findings[0].disposition, 'BLOCK');
  assert.match(result.findings[0].title, /SQL Injection risk/);
});

test('ARCH-005: detects module-level shared mutable state in server routes', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/architecture/routes/shared-mutable-route.ts',
    detectors: [arch005]
  });

  assert.ok(result.findings.length >= 1);
  assert.strictEqual(result.findings[0].ruleId, 'ARCH-005');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /shared mutable state/i);
});

test('DB-005: detects sequential multi-table mutations lacking transaction boundary', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/database/multi-mutation-no-tx.ts',
    detectors: [db005]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'DB-005');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /multi-mutation consistency boundary/i);
});

test('API-005: detects unbounded HTTP request lacking timeout or AbortSignal', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/api/unbounded-http.ts',
    detectors: [api005]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'API-005');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /lacking timeout/i);
});

test('CODE-006: detects TypeScript compiler suppression directive and any casts', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/code-quality/type-bypass.ts',
    detectors: [code006]
  });

  assert.strictEqual(result.findings.length, 2);
  assert.strictEqual(result.findings[0].ruleId, 'CODE-006');
  assert.strictEqual(result.findings[0].impact, 'MEDIUM');
});

test('CODE-007: detects floating unawaited promises in mutating handlers', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/code-quality/floating-promise.ts',
    detectors: [code007]
  });

  assert.strictEqual(result.findings.length, 1);
  assert.strictEqual(result.findings[0].ruleId, 'CODE-007');
  assert.strictEqual(result.findings[0].impact, 'HIGH');
  assert.match(result.findings[0].title, /Floating, unawaited promise/);
});

test('TEST-004: detects and distinguishes committed focused and skipped test cases', async () => {
  const result = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/testing/skipped-test.test.ts',
    detectors: [test004]
  });

  assert.strictEqual(result.findings.length, 2);
  assert.strictEqual(result.findings[0].ruleId, 'TEST-004');
  assert.strictEqual(result.findings[0].disposition, 'REVIEW');
  assert.match(result.findings[0].title, /skipped test/i);

  assert.strictEqual(result.findings[1].ruleId, 'TEST-004');
  assert.strictEqual(result.findings[1].impact, 'HIGH');
  assert.strictEqual(result.findings[1].disposition, 'BLOCK');
  assert.match(result.findings[1].title, /focused test/i);
});

test('False-Positive Trap: SEC-001 & SEC-002 ignore placeholders and benign numeric SQL interpolation', async () => {
  const secResult = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/security/benign-secrets-and-sql.ts',
    detectors: [sec001, sec002]
  });

  assert.strictEqual(secResult.findings.length, 0, 'Should produce zero findings on non-secret placeholders and benign SQL');
});

test('False-Positive Trap: ARCH-005 ignores legitimate memoization caches, metrics, and init locks', async () => {
  const archResult = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/architecture/routes/legitimate-cache-route.ts',
    detectors: [arch005]
  });

  assert.strictEqual(archResult.findings.length, 0, 'Should produce zero findings on legitimate caching/metrics in routes');
});

test('False-Positive Trap: CODE-007 ignores synchronous calls and handled .catch() promise chains', async () => {
  const codeResult = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/code-quality/handled-async-and-sync.ts',
    detectors: [code007]
  });

  assert.strictEqual(codeResult.findings.length, 0, 'Should produce zero findings on synchronous helpers and .catch() chains');
});

test('False-Positive Trap: ARCH-001 restraint doctrine respects intentional dependency inversion interfaces', async () => {
  const ifaceResult = await runDetectors(repoRoot, {
    targetSubpath: 'fixtures/architecture/architectural-boundary.ts',
    detectors: [arch001]
  });

  assert.strictEqual(ifaceResult.findings.length, 0, 'Should not flag deliberate UserRepository dependency inversion boundary');
});

test('Rule Classification: all 32 detectors declare CERTAIN, PROBABLE, or HEURISTIC classification', async () => {
  const { allDetectors } = await import('../../src/detectors/index.js');
  assert.strictEqual(allDetectors.length, 32);

  for (const detector of allDetectors) {
    assert.ok(
      detector.ruleClass === 'CERTAIN' || detector.ruleClass === 'PROBABLE' || detector.ruleClass === 'HEURISTIC',
      `Detector ${detector.id} must declare valid ruleClass, received: ${detector.ruleClass}`
    );
  }
});


