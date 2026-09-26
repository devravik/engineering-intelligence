import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const test004: Detector = {
  id: 'TEST-004',
  name: 'disabled-or-focused-test',
  category: 'Testing',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects committed disabled or focused test cases (.skip, .only, xit, fit) that bypass or silence test suites.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const lower = file.path.toLowerCase();
      const isTargetedFixture = Boolean(context.targetPath && file.path.includes(context.targetPath));
      const isTestFile =
        (lower.includes('/tests/') ||
          lower.includes('/__tests__/') ||
          lower.endsWith('.test.ts') ||
          lower.endsWith('.test.js') ||
          lower.endsWith('.spec.ts') ||
          lower.endsWith('.spec.js')) &&
        (isTargetedFixture || (!lower.includes('/detectors/') && !lower.includes('/fixtures/'))) &&
        !lower.includes('node_modules/');

      if (!isTestFile) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // 1. Focused tests: test.only, it.only, describe.only, fit, fdescribe (CRITICAL / BLOCKER)
        const isFocused =
          /\b(?:test|it|describe)\.only\s*\(/.test(trimmed) ||
          /\b(?:fit|fdescribe)\s*\(/.test(trimmed);

        if (isFocused) {
          findings.push({
            ruleId: 'TEST-004',
            category: 'Testing',
            title: 'Committed focused test (.only / fit) silences full test suite',
            message:
              'Test case is declared with focused execution modifier (.only or fit). In CI/CD pipelines, focused tests cause all other test suites to be silently skipped, creating catastrophic false-positive test passes.',
            filePath: file.path,
            line: i + 1,
            evidence: trimmed,
            confidence: 'HIGH',
            impact: 'HIGH',
            disposition: 'BLOCK',
            ruleClass: 'CERTAIN',
            suggestedFix: 'Remove .only or fit modifier to restore complete test suite execution.'
          });
          continue;
        }

        // 2. Skipped tests: test.skip, it.skip, describe.skip, xit, xtest, xdescribe (MEDIUM / REVIEW)
        const isSkipped =
          /\b(?:test|it|describe)\.skip\s*\(/.test(trimmed) ||
          /\b(?:xit|xtest|xdescribe)\s*\(/.test(trimmed);

        if (isSkipped) {
          findings.push({
            ruleId: 'TEST-004',
            category: 'Testing',
            title: 'Committed skipped test (.skip / xit) bypasses regression coverage',
            message:
              'Test case is disabled via .skip or x-prefix. Agents must repair failing assertions rather than committing disabled tests to achieve simulated passes.',
            filePath: file.path,
            line: i + 1,
            evidence: trimmed,
            confidence: 'HIGH',
            impact: 'MEDIUM',
            disposition: 'REVIEW',
            ruleClass: 'CERTAIN',
            suggestedFix: 'Remove .skip or x-prefix and fix the underlying assertion or implementation.'
          });
        }
      }
    }

    return findings;
  }
};
