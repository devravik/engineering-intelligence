import { test } from 'node:test';
import assert from 'node:assert';
import { FindingNormalizer } from '../../src/findings/normalizer.js';
import { RawFinding, computeEvidenceHash } from '../../src/findings/types.js';

test('FindingNormalizer: normalizes raw finding into canonical EIFinding contract', () => {
  const raw: RawFinding = {
    ruleId: 'DB-003',
    category: 'Database',
    title: 'Unsafe migration without default',
    message: 'Adding NOT NULL column without DEFAULT locks large tables in production',
    filePath: './src/database/migrations\\2026_09_order_col.sql',
    line: 14,
    lineEnd: 16,
    evidence: 'ALTER TABLE orders ADD COLUMN status VARCHAR(32) NOT NULL;',
    confidence: 'HIGH',
    impact: 'CRITICAL',
    suggestedFix: 'Add DEFAULT or perform multi-step backfill migration.'
  };

  const finding = FindingNormalizer.normalize(raw);

  // 1. Core identification
  assert.strictEqual(finding.ruleId, 'DB-003');
  assert.strictEqual(finding.category, 'Database');
  assert.strictEqual(finding.severity, 'CRITICAL');
  assert.strictEqual(finding.impact, 'CRITICAL');
  assert.strictEqual(finding.confidence, 'HIGH');
  assert.strictEqual(finding.disposition, 'BLOCK');

  // 2. Structured evidence contract
  assert.ok(finding.evidence, 'Finding must contain structured evidence object');
  assert.strictEqual(finding.evidence.file, 'src/database/migrations/2026_09_order_col.sql');
  assert.strictEqual(finding.evidence.line, 14);
  assert.strictEqual(finding.evidence.lineEnd, 16);
  assert.strictEqual(finding.evidence.snippet, 'ALTER TABLE orders ADD COLUMN status VARCHAR(32) NOT NULL;');

  // 3. Cryptographic hash determinism
  const expectedHash = computeEvidenceHash(
    'DB-003',
    'src/database/migrations/2026_09_order_col.sql',
    'ALTER TABLE orders ADD COLUMN status VARCHAR(32) NOT NULL;'
  );
  assert.strictEqual(finding.evidence.hash, expectedHash);
  assert.strictEqual(finding.id, `DB-003-${expectedHash}`);

  // 4. Attribution defaults to NEW
  assert.strictEqual(finding.attribution, 'NEW');

  // 5. Backward-compatible aliases
  assert.strictEqual(finding.filePath, finding.evidence.file);
  assert.strictEqual(finding.line, finding.evidence.line);
  assert.strictEqual(finding.evidenceHash, finding.evidence.hash);
  assert.strictEqual(finding.baselineStatus, 'NEW');
});

test('FindingNormalizer: batch normalizes multiple raw findings with path and line sanitization', () => {
  const rawBatch: RawFinding[] = [
    {
      ruleId: 'SLOP-002',
      category: 'Slop',
      title: 'Tautological comment',
      message: 'Comment restates code',
      filePath: '.\\src\\utils\\helper.ts',
      line: 0, // Should sanitize to 1
      evidence: '// returns true\nreturn true;',
      confidence: 'HIGH',
      impact: 'LOW'
    },
    {
      ruleId: 'ARCH-001',
      category: 'Architecture',
      title: 'Single impl interface',
      message: 'Unnecessary abstraction',
      filePath: 'src/core/service.ts',
      line: 42,
      evidence: 'interface IUserService',
      confidence: 'MEDIUM',
      impact: 'HIGH'
    }
  ];

  const batch = FindingNormalizer.normalizeBatch(rawBatch);

  assert.strictEqual(batch.length, 2);
  assert.strictEqual(batch[0].evidence.file, 'src/utils/helper.ts');
  assert.strictEqual(batch[0].evidence.line, 1);
  assert.strictEqual(batch[0].disposition, 'IGNORE');

  assert.strictEqual(batch[1].evidence.file, 'src/core/service.ts');
  assert.strictEqual(batch[1].evidence.line, 42);
  assert.strictEqual(batch[1].disposition, 'FIX');
});
