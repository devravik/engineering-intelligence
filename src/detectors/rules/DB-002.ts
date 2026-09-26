import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const db002: Detector = {
  id: 'DB-002',
  name: 'n-plus-one',
  category: 'Database',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects database or ORM queries invoked synchronously inside iteration loops.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js') && !file.path.endsWith('.tsx') && !file.path.endsWith('.jsx')) {
        continue;
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        // Check for loop start: for (const item of items) or items.map(async ...
        const isLoop =
          /for\s*\(\s*(?:const|let|var)\s+.*?\s+of\s+.*?\)/.test(line) ||
          /\.map\s*\(\s*async\b/.test(line) ||
          /forEach\s*\(\s*async\b/.test(line);

        if (isLoop) {
          // Look inside loop body (next 20 lines) for await db/query calls
          const bodyLines = file.lines.slice(i + 1, Math.min(i + 25, file.lines.length));
          for (let j = 0; j < bodyLines.length; j++) {
            const bodyLine = bodyLines[j];
            // Check for exit of loop block early if possible
            if (/^\s*\}\s*\)?\s*;?\s*$/.test(bodyLine) && j > 3) break;

            const isDbCall =
              /await\s+(?:db|prisma|drizzle|repository|em|connection)\./i.test(bodyLine) ||
              /await\s+[A-Za-z0-9_]+Repository\./.test(bodyLine) ||
              /await\s+[A-Za-z0-9_]+\.(?:findById|findOne|findFirst|findMany|query)\(/.test(bodyLine);

            if (isDbCall) {
              findings.push({
                ruleId: 'DB-002',
                category: 'Database',
                title: 'N+1 database query loop pattern detected',
                message:
                  'Database query is executed iteratively inside a loop. Under production scale, this causes 1+N database roundtrips and severe latency degradation.',
                filePath: file.path,
                line: i + 1 + j + 1,
                evidence: bodyLine.trim(),
                confidence: 'HIGH',
                impact: 'HIGH',
                suggestedFix:
                  'Batch queries using `WHERE id IN (...)`, join tables eagerly, or use a DataLoader pattern.'
              });
              break; // avoid duplicate flags for same loop
            }
          }
        }
      }
    }

    return findings;
  }
};
