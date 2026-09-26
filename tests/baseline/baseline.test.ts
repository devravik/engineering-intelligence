import { test } from 'node:test';
import assert from 'node:assert';
import { attributeFindings } from '../../src/baseline/index.js';
import { RawFinding, computeEvidenceHash } from '../../src/findings/types.js';

test('Baseline Attribution: distinguishes BASELINE vs NEW findings', () => {
  const existingFinding: RawFinding = {
    ruleId: 'DB-002',
    category: 'Database',
    title: 'N+1 query',
    message: 'N+1 in legacy order service',
    filePath: 'src/legacy/orders.ts',
    line: 12,
    evidence: 'await db.items.find()',
    confidence: 'HIGH',
    impact: 'HIGH'
  };

  const newFinding: RawFinding = {
    ruleId: 'API-001',
    category: 'Security',
    title: 'Missing auth',
    message: 'Payment route missing auth',
    filePath: 'src/api/pay.ts',
    line: 4,
    evidence: 'export async function POST()',
    confidence: 'HIGH',
    impact: 'CRITICAL'
  };

  const hash = computeEvidenceHash(
    existingFinding.ruleId,
    existingFinding.filePath,
    existingFinding.evidence
  );

  // Create baseline containing only existingFinding
  const mockBaseline = {
    version: '1.0.0',
    createdAt: '2026-09-01T00:00:00Z',
    updatedAt: '2026-09-01T00:00:00Z',
    entries: {
      [hash]: {
        ruleId: 'DB-002',
        filePath: 'src/legacy/orders.ts',
        evidenceHash: hash,
        firstSeen: '2026-09-01T00:00:00Z',
        category: 'Database'
      }
    }
  };

  // Run attribution on both findings
  const { activeFindings, summary } = attributeFindings([existingFinding, newFinding], mockBaseline);

  assert.strictEqual(activeFindings.length, 2);
  assert.strictEqual(summary.newCount, 1);
  assert.strictEqual(summary.baselineCount, 1);
  assert.strictEqual(summary.resolvedCount, 0);

  const baselineItem = activeFindings.find(f => f.ruleId === 'DB-002');
  const newItem = activeFindings.find(f => f.ruleId === 'API-001');

  assert.strictEqual(baselineItem?.baselineStatus, 'BASELINE');
  assert.strictEqual(newItem?.baselineStatus, 'NEW');
});
