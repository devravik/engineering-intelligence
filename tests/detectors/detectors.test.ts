import { test } from 'node:test';
import assert from 'node:assert';
import { resolve } from 'node:path';
import { runDetectors } from '../../src/detectors/index.js';
import { arch001 } from '../../src/detectors/rules/ARCH-001.js';
import { arch002 } from '../../src/detectors/rules/ARCH-002.js';
import { arch004 } from '../../src/detectors/rules/ARCH-004.js';
import { code003 } from '../../src/detectors/rules/CODE-003.js';
import { db001 } from '../../src/detectors/rules/DB-001.js';
import { db002 } from '../../src/detectors/rules/DB-002.js';
import { db003 } from '../../src/detectors/rules/DB-003.js';
import { api001 } from '../../src/detectors/rules/API-001.js';
import { test002 } from '../../src/detectors/rules/TEST-002.js';
import { slop001 } from '../../src/detectors/rules/SLOP-001.js';
import { slop002 } from '../../src/detectors/rules/SLOP-002.js';
import { slop003 } from '../../src/detectors/rules/SLOP-003.js';

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

