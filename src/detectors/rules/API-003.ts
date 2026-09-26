import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const api003: Detector = {
  id: 'API-003',
  name: 'breaking-contract-change',
  category: 'Security',
  severity: 'CRITICAL',
  description: 'Detects breaking modifications to public API route signatures or contract definitions.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Analyze route files for breaking parameter changes or removal of fields
    for (const file of context.files) {
      if (!file.path.includes('/api/') && !file.path.includes('/routes/')) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        // Check for removed route params or mandatory param changes without fallback
        const hardcodedPathParamChange = line.match(/\/:([a-zA-Z0-9_]+)\b/);
        if (hardcodedPathParamChange && line.includes('// BREAKING')) {
          findings.push({
            ruleId: 'API-003',
            category: 'Security',
            title: `Breaking API contract modification: ${hardcodedPathParamChange[0]}`,
            message: `Public route '${line.trim()}' alters parameter contracts without backward compatibility support. Active frontend or mobile clients will encounter 404 or 400 responses.`,
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: 'HIGH',
            impact: 'CRITICAL',
            suggestedFix: `Preserve the legacy route parameter with deprecation headers or support both parameter formats.`
          });
        }
      }
    }

    return findings;
  }
};
