import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const api002: Detector = {
  id: 'API-002',
  name: 'inconsistent-error-contract',
  category: 'CodeQuality',
  severity: 'HIGH',
  ruleClass: 'HEURISTIC',
  description: 'Detects swallowed exceptions in empty or unhandled catch blocks that destroy stack traces.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js') && !file.path.endsWith('.tsx') && !file.path.endsWith('.jsx')) {
        continue;
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const catchMatch = line.match(/catch\s*(?:\([^)]*\))?\s*\{/);
        if (catchMatch) {
          // Check following 3 lines for empty catch or immediate silent return
          const nextLines = file.lines.slice(i + 1, Math.min(i + 4, file.lines.length));
          const joined = nextLines.join(' ').trim();

          const isSilentReturn = /^\s*return(?:\s+(?:null|undefined|false|\[\]|\{\}))?\s*;\s*\}\s*$/.test(joined);
          const isEmpty = /^\s*\}\s*$/.test(joined);

          if (isEmpty || isSilentReturn) {
            findings.push({
              ruleId: 'API-002',
              category: 'CodeQuality',
              title: 'Swallowed exception destroying error provenance',
              message:
                'Catch block silently swallows exceptions without logging context, recording telemetry, or rethrowing with domain details.',
              filePath: file.path,
              line: i + 1,
              evidence: `${line.trim()} ${joined}`,
              confidence: 'HIGH',
              impact: 'HIGH',
              suggestedFix:
                'Log the exception with operational metadata (logger.error(err)) or propagate a typed domain error.'
            });
          }
        }
      }
    }

    return findings;
  }
};
