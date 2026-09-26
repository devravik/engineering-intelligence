import { test } from 'node:test';
import assert from 'node:assert';
import {
  buildReviewMatrix,
  formatReviewMatrix,
  evaluateShipGate,
  formatShipGate
} from '../../src/reviewer/index.js';
import { rawToFinding, RawFinding } from '../../src/findings/types.js';

test('Reviewer: buildReviewMatrix compiles evidence, attribution, confidence, recommendations, and unknowns', () => {
  const highRaw: RawFinding = {
    ruleId: 'ARCH-001',
    category: 'Architecture',
    title: 'Single-implementation interface',
    message: 'Unnecessary abstraction introducing single-use interface',
    filePath: 'src/service.ts',
    line: 10,
    evidence: 'interface IFooService',
    confidence: 'HIGH',
    impact: 'HIGH',
    suggestedFix: 'Inline interface directly into FooService class.'
  };

  const testRaw: RawFinding = {
    ruleId: 'TEST-001',
    category: 'Testing',
    title: 'Modified behavior without test coverage',
    message: 'Changed logic without accompanying unit tests',
    filePath: 'src/service.ts',
    line: 25,
    evidence: 'export function processPayment()',
    confidence: 'HIGH',
    impact: 'HIGH'
  };

  const findings = [rawToFinding(highRaw), rawToFinding(testRaw)];
  const matrix = buildReviewMatrix(findings, {
    baselineCounts: {
      baseline: 0,
      new: 2,
      resolved: 0
    }
  });

  // Verify recommendations populated
  assert.strictEqual(matrix.recommendations.length, 1);
  assert.strictEqual(matrix.recommendations[0].ruleId, 'ARCH-001');
  assert.strictEqual(matrix.recommendations[0].action, 'Inline interface directly into FooService class.');

  // Verify UNKNOWN areas detected (TEST-001 creates an unverified surface)
  assert.ok(matrix.unknowns.length >= 1);
  assert.ok(matrix.unknowns.some(u => u.area.includes('Test Coverage')));

  // Verify diagnostic formatting
  const formatted = formatReviewMatrix(matrix, findings);
  assert.ok(formatted.includes('ENGINEERING REVIEW MATRIX'));
  assert.ok(formatted.includes('ACTIONABLE RECOMMENDATIONS'));
  assert.ok(formatted.includes('UNKNOWN / UNVERIFIED SURFACES'));
  assert.ok(formatted.includes('DETAILED FINDINGS & PHYSICAL EVIDENCE'));
});

test('Ship Gate: enforces UNKNOWN != PASS (evaluates to BLOCK when UNKNOWN > 0)', () => {
  const findings: any[] = [];
  // 0 blockers, but 1 unknown verification area
  const matrix = buildReviewMatrix(findings, { unknownCount: 1 });
  const gate = evaluateShipGate(matrix, findings);

  assert.strictEqual(gate.unknowns, 1);
  assert.strictEqual(gate.terminalDisposition, 'BLOCK');
  assert.strictEqual(gate.passed, false);
  assert.ok(gate.reasons.some(r => r.includes('UNKNOWN != PASS')));

  const formatted = formatShipGate(gate);
  assert.ok(formatted.includes('RELEASE GATE VERDICT: BLOCKED'));
  assert.ok(formatted.includes('UNKNOWN != PASS'));
});

test('Ship Gate: evaluates to BLOCK when BLOCKERS > 0', () => {
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
  const gate = evaluateShipGate(matrix, findings);

  assert.strictEqual(gate.blockers, 1);
  assert.strictEqual(gate.terminalDisposition, 'BLOCK');
  assert.strictEqual(gate.passed, false);
});

test('Ship Gate: evaluates to FIX when high-impact issues exist without blockers', () => {
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
  const gate = evaluateShipGate(matrix, findings);

  assert.strictEqual(gate.blockers, 0);
  assert.strictEqual(gate.fixes, 1);
  assert.strictEqual(gate.terminalDisposition, 'FIX');
  assert.strictEqual(gate.passed, false);

  const formatted = formatShipGate(gate);
  assert.ok(formatted.includes('RELEASE GATE VERDICT: ACTION REQUIRED'));
});

test('Ship Gate: evaluates to SHIP when zero blockers, zero fixes, zero unknowns', () => {
  const matrix = buildReviewMatrix([], { unknownCount: 0 });
  const gate = evaluateShipGate(matrix, []);

  assert.strictEqual(gate.terminalDisposition, 'SHIP');
  assert.strictEqual(gate.passed, true);
  assert.strictEqual(gate.blockers, 0);
  assert.strictEqual(gate.fixes, 0);
  assert.strictEqual(gate.unknowns, 0);

  const formatted = formatShipGate(gate);
  assert.ok(formatted.includes('RELEASE GATE VERDICT: APPROVED (SHIP)'));
});
