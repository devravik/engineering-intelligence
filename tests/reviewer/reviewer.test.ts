import { test } from 'node:test';
import assert from 'node:assert';
import { buildReviewMatrix } from '../../src/reviewer/index.js';
import { rawToFinding, RawFinding } from '../../src/findings/types.js';

test('Reviewer: derives BLOCK when BLOCKERS > 0', () => {
  const criticalRaw: RawFinding = {
    ruleId: 'DB-003',
    category: 'Database',
    title: 'Unsafe migration',
    message: 'Locks table',
    filePath: 'migrations/001.sql',
    line: 1,
    evidence: 'ADD COLUMN NOT NULL',
    confidence: 'HIGH',
    impact: 'CRITICAL'
  };

  const findings = [rawToFinding(criticalRaw)];
  const matrix = buildReviewMatrix(findings);

  assert.strictEqual(matrix.currentCounts.blockers, 1);
  assert.strictEqual(matrix.finalDisposition, 'BLOCK');
});

test('Reviewer: enforces UNKNOWN != PASS (derives BLOCK when UNKNOWN > 0)', () => {
  const findings: any[] = [];
  // 0 blockers, but 1 unknown verification
  const matrix = buildReviewMatrix(findings, { unknownCount: 1 });

  assert.strictEqual(matrix.currentCounts.unknown, 1);
  assert.strictEqual(matrix.finalDisposition, 'BLOCK');
});

test('Reviewer: derives FIX when high-impact issues exist without blockers', () => {
  const highRaw: RawFinding = {
    ruleId: 'ARCH-001',
    category: 'Architecture',
    title: 'Single-implementation interface',
    message: 'Unnecessary abstraction',
    filePath: 'src/service.ts',
    line: 1,
    evidence: 'interface IFoo',
    confidence: 'HIGH',
    impact: 'HIGH'
  };

  const findings = [rawToFinding(highRaw)];
  const matrix = buildReviewMatrix(findings);

  assert.strictEqual(matrix.currentCounts.blockers, 0);
  assert.strictEqual(matrix.currentCounts.fix, 1);
  assert.strictEqual(matrix.finalDisposition, 'FIX');
});

test('Reviewer: derives SHIP when zero blockers, zero fixes, zero unknowns', () => {
  const matrix = buildReviewMatrix([], { unknownCount: 0 });
  assert.strictEqual(matrix.finalDisposition, 'SHIP');
});
