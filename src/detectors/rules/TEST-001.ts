import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const test001: Detector = {
  id: 'TEST-001',
  name: 'changed-behavior-without-coverage',
  category: 'Testing',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects source files modified in changes without corresponding test updates.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Only applicable when scanning changed files
    if (!context.changedFilesOnly) return findings;

    const sourceFiles = context.files.filter(
      f =>
        !f.path.includes('test') &&
        !f.path.includes('spec') &&
        !f.path.endsWith('.md') &&
        !f.path.endsWith('.json') &&
        !f.path.endsWith('.config.ts') &&
        !f.path.endsWith('.config.js')
    );

    const testFiles = context.files.filter(f => f.path.includes('test') || f.path.includes('spec'));

    if (sourceFiles.length > 0 && testFiles.length === 0) {
      for (const src of sourceFiles) {
        findings.push({
          ruleId: 'TEST-001',
          category: 'Testing',
          title: `Source file '${src.path}' modified without test coverage`,
          message: `Active change set modifies source behavior in '${src.path}' but does not include any accompanying test additions or updates.`,
          filePath: src.path,
          line: 1,
          evidence: `Modified file: ${src.path}`,
          confidence: 'MEDIUM',
          impact: 'MEDIUM',
          suggestedFix: 'Add unit or integration regression tests covering the newly modified execution branches.'
        });
      }
    }

    return findings;
  }
};
