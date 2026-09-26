import { test } from 'node:test';
import assert from 'node:assert';
import { checkIgnored, IgnoreConfig } from '../../src/ignores/index.js';
import { RawFinding } from '../../src/findings/types.js';

test('Ignores: respects rule-level waiver', () => {
  const config: IgnoreConfig = {
    rules: [
      {
        ruleId: 'ARCH-001',
        reason: 'Required for external plugin interface contract',
        date: '2026-09-26T00:00:00Z'
      }
    ],
    files: []
  };

  const finding: RawFinding = {
    ruleId: 'ARCH-001',
    category: 'Architecture',
    title: 'Single-implementation interface',
    message: 'test',
    filePath: 'src/plugins/IPlugin.ts',
    line: 5,
    evidence: 'interface IPlugin',
    confidence: 'HIGH',
    impact: 'HIGH'
  };

  const result = checkIgnored(finding, config);
  assert.strictEqual(result.ignored, true);
  assert.match(result.reason || '', /Required for external plugin/);
});

test('Ignores: respects inline disable comment', () => {
  const config: IgnoreConfig = { rules: [], files: [] };
  const fileLines = [
    '// line 1',
    '// ei-disable-next-line ARCH-001 -- Approved exception for mock factory',
    'export interface IService {'
  ];

  const finding: RawFinding = {
    ruleId: 'ARCH-001',
    category: 'Architecture',
    title: 'Single-implementation interface',
    message: 'test',
    filePath: 'src/service.ts',
    line: 3,
    evidence: 'interface IService',
    confidence: 'HIGH',
    impact: 'HIGH'
  };

  const result = checkIgnored(finding, config, fileLines);
  assert.strictEqual(result.ignored, true);
  assert.match(result.reason || '', /Approved exception/);
});
