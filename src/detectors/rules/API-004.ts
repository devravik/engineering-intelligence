import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const api004: Detector = {
  id: 'API-004',
  name: 'duplicated-validation',
  category: 'CodeQuality',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects redundant validation checks performed immediately after schema parser validation.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js')) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        // Check for schema parse: const data = schema.parse(req.body);
        const schemaParse = line.match(/(?:const|let)\s+([A-Za-z0-9_]+)\s*=\s*(?:[A-Za-z0-9_]+Schema|[A-Za-z0-9_]+Validator)\.(?:parse|validate)\s*\(/);

        if (schemaParse) {
          const parsedVar = schemaParse[1];
          // Check following 10 lines for redundant manual null/undefined checks on parsedVar
          const nextLines = file.lines.slice(i + 1, Math.min(i + 12, file.lines.length));
          for (let j = 0; j < nextLines.length; j++) {
            const next = nextLines[j];
            const redundantCheck = next.match(new RegExp(`if\\s*\\(\\s*!${parsedVar}\\.([A-Za-z0-9_]+)\\s*\\)`));
            if (redundantCheck) {
              findings.push({
                ruleId: 'API-004',
                category: 'CodeQuality',
                title: `Duplicated validation on parsed property '${redundantCheck[1]}'`,
                message: `'${parsedVar}' was already validated and guaranteed by the schema parser on line ${i + 1}. The subsequent manual check 'if (!${parsedVar}.${redundantCheck[1]})' is redundant ceremony.`,
                filePath: file.path,
                line: i + 1 + j + 1,
                evidence: next.trim(),
                confidence: 'HIGH',
                impact: 'MEDIUM',
                suggestedFix: `Rely on the schema validation contract and remove the redundant manual check.`
              });
            }
          }
        }
      }
    }

    return findings;
  }
};
