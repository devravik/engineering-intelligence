import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const code003: Detector = {
  id: 'CODE-003',
  name: 'excessive-indirection',
  category: 'CodeQuality',
  severity: 'MEDIUM',
  description: 'Detects pass-through wrapper functions that merely delegate calls 1:1 without value-add.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js')) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        // Match one-line pass-through function:
        // function doFoo(a, b) { return otherFoo(a, b); }
        // or const doFoo = (a, b) => otherFoo(a, b);
        const arrowMatch = line.match(
          /(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*\(([^)]*)\)\s*=>\s*([A-Za-z0-9_.]+)\(\2\);?/
        );

        if (arrowMatch && arrowMatch[1] !== arrowMatch[3]) {
          findings.push({
            ruleId: 'CODE-003',
            category: 'CodeQuality',
            title: `Excessive indirection: pass-through wrapper '${arrowMatch[1]}'`,
            message: `Function '${arrowMatch[1]}' merely delegates 1:1 to '${arrowMatch[3]}' with identical arguments and zero transformation or logic. This adds a redundant layer to the call stack.`,
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: 'HIGH',
            impact: 'MEDIUM',
            suggestedFix: `Call '${arrowMatch[3]}' directly or inline the function call.`
          });
        }
      }
    }

    return findings;
  }
};
