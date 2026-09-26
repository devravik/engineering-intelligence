import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const test002: Detector = {
  id: 'TEST-002',
  name: 'weak-assertion',
  category: 'Testing',
  severity: 'MEDIUM',
  description: 'Detects weak or tautological test assertions that simulate test coverage without verifying behavior.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.includes('test') && !file.path.includes('spec')) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i].trim();

        // Tautological assertions: expect(true).toBe(true) or assert(true)
        const isTautological =
          /expect\s*\(\s*true\s*\)\s*\.to(?:Be|Equal)\s*\(\s*true\s*\)/.test(line) ||
          /assert\s*\(\s*true\s*\)/.test(line) ||
          /expect\s*\(\s*1\s*\)\s*\.to(?:Be|Equal)\s*\(\s*1\s*\)/.test(line);

        // Vague existence-only assertions without data checks: expect(result).toBeDefined()
        const isOnlyDefinedCheck =
          /expect\s*\(\s*[a-zA-Z0-9_]+\s*\)\s*\.toBeDefined\s*\(\s*\)/.test(line) &&
          !file.lines.slice(i + 1, Math.min(i + 4, file.lines.length)).some(l => l.includes('expect('));

        if (isTautological) {
          findings.push({
            ruleId: 'TEST-002',
            category: 'Testing',
            title: 'Tautological test assertion (fake coverage)',
            message: `Assertion '${line}' asserts a tautology (true == true). This generates artificial test coverage metrics without exercising actual application state.`,
            filePath: file.path,
            line: i + 1,
            evidence: line,
            confidence: 'HIGH',
            impact: 'MEDIUM',
            suggestedFix: `Assert actual domain output and state changes instead of literal values.`
          });
        } else if (isOnlyDefinedCheck) {
          findings.push({
            ruleId: 'TEST-002',
            category: 'Testing',
            title: 'Weak assertion: only verifies object presence without asserting fields',
            message: `Assertion '${line}' merely checks that an object is defined, ignoring whether the object contains correct properties or values.`,
            filePath: file.path,
            line: i + 1,
            evidence: line,
            confidence: 'HIGH',
            impact: 'MEDIUM',
            suggestedFix: `Assert specific property values on the returned object (e.g., \`expect(result.status).toBe('active')\`).`
          });
        }
      }
    }

    return findings;
  }
};
