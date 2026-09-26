import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const slop001: Detector = {
  id: 'SLOP-001',
  name: 'generic-abstraction',
  category: 'Slop',
  severity: 'HIGH',
  ruleClass: 'HEURISTIC',
  description: 'Detects pass-through Factory classes that merely wrap single concrete class instantiations.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js')) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        // Match: class XFactory
        const factoryMatch = line.match(/class\s+([A-Za-z0-9_]*Factory)\b/);
        if (factoryMatch) {
          const factoryName = factoryMatch[1];
          // Check class body (next 15 lines)
          const body = file.lines.slice(i, Math.min(i + 15, file.lines.length)).join('\n');
          const instantiationMatches = body.match(/new\s+([A-Za-z0-9_]+)\s*\(/g);

          // If factory contains exactly one single "new" call and no switch/if branches
          if (instantiationMatches && instantiationMatches.length === 1 && !/switch\b|\bif\s*\(/.test(body)) {
            findings.push({
              ruleId: 'SLOP-001',
              category: 'Slop',
              title: `Speculative Factory slop in '${factoryName}'`,
              message: `'${factoryName}' is an abstract factory that instantiates only a single hardcoded concrete class without branching or configuration logic.`,
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'HIGH',
              suggestedFix:
                `Eliminate '${factoryName}' and instantiate the concrete class directly.`
            });
          }
        }
      }
    }

    return findings;
  }
};
