import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const test003: Detector = {
  id: 'TEST-003',
  name: 'missing-failure-path-coverage',
  category: 'Testing',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects services with critical error throws whose test files test only happy paths.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Find services with explicit error throws
    for (const file of context.files) {
      if (file.path.includes('test') || file.path.includes('spec')) continue;
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js')) continue;

      const hasThrows = file.lines.some(l => /throw\s+new\s+[A-Za-z0-9_]*Error\b/.test(l));
      if (!hasThrows) continue;

      // Find corresponding test file
      const baseName = file.path.replace(/\.[^/.]+$/, '');
      const fileNameWithoutExt = baseName.split('/').pop()!;
      const testFile = context.files.find(
        f =>
          (f.path.includes('test') || f.path.includes('spec')) &&
          (f.path.includes(baseName.replace(/^src\//, '')) || f.path.includes(fileNameWithoutExt))
      );

      if (testFile) {
        const testsErrorPath =
          testFile.content.includes('toThrow') ||
          testFile.content.includes('rejects') ||
          testFile.content.includes('catch') ||
          testFile.content.includes('throws') ||
          testFile.content.includes('assert.throws') ||
          testFile.content.includes('assert.rejects');

        if (!testsErrorPath) {
          findings.push({
            ruleId: 'TEST-003',
            category: 'Testing',
            title: `Missing failure-path test coverage for '${file.path}'`,
            message: `'${file.path}' defines explicit exception handling and error throws, but its test file '${testFile.path}' only tests happy paths with zero assertion for failure modes.`,
            filePath: testFile.path,
            line: 1,
            evidence: `Test file: ${testFile.path} has 0 error assertions for throws in ${file.path}`,
            confidence: 'HIGH',
            impact: 'MEDIUM',
            suggestedFix: `Add regression tests verifying expected exception throws and error payloads.`
          });
        }
      }
    }

    return findings;
  }
};
