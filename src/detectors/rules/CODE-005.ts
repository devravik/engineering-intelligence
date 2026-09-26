import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const code005: Detector = {
  id: 'CODE-005',
  name: 'overly-defensive-code',
  category: 'CodeQuality',
  severity: 'LOW',
  ruleClass: 'PROBABLE',
  description: 'Detects redundant optional chaining or null assertions immediately inside non-null guard blocks.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.tsx') && !file.path.endsWith('.js') && !file.path.endsWith('.jsx')) {
        continue;
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        // Match: if (varName) { followed closely by varName?.prop
        const guardMatch = line.match(/if\s*\(\s*([a-zA-Z0-9_]+)\s*\)/);
        if (guardMatch) {
          const varName = guardMatch[1];
          const optionalChainRegex = new RegExp(`\\b${varName}\\?\\.`);

          // Check subsequent 1-3 lines inside guard block
          for (let j = 1; j <= 3 && i + j < file.lines.length; j++) {
            const nextLine = file.lines[i + j];
            if (nextLine.includes('}') || nextLine.includes('else')) break;

            if (optionalChainRegex.test(nextLine)) {
              findings.push({
                ruleId: 'CODE-005',
                category: 'CodeQuality',
                title: `Redundant optional chaining on '${varName}'`,
                message: `'${varName}' is checked non-null by the if-guard on line ${i + 1}, making '${varName}?.' on line ${i + 1 + j} redundant defensive code.`,
                filePath: file.path,
                line: i + 1 + j,
                evidence: nextLine.trim(),
                confidence: 'HIGH',
                impact: 'LOW',
                suggestedFix: `Replace '${varName}?.' with '${varName}.' directly.`
              });
              break;
            }
          }
        }
      }
    }

    return findings;
  }
};
