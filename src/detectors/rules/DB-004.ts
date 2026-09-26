import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const db004: Detector = {
  id: 'DB-004',
  name: 'destructive-migration',
  category: 'Database',
  severity: 'CRITICAL',
  description: 'Detects irreversible schema operations such as DROP TABLE or DROP COLUMN without explicit waivers.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const isMigration =
        file.path.endsWith('.sql') ||
        file.path.includes('/migrations/') ||
        file.path.includes('/migrate/');

      if (!isMigration) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        const dropMatch = line.match(/\b(DROP\s+TABLE|DROP\s+COLUMN)\s+([A-Za-z0-9_."]+)/i);

        if (dropMatch) {
          findings.push({
            ruleId: 'DB-004',
            category: 'Database',
            title: `Destructive schema operation: ${dropMatch[1].toUpperCase()}`,
            message: `Migration executes irreversible schema deletion '${dropMatch[0]}'. If deployed before code references are eliminated or without a backup snapshot, permanent data loss will occur.`,
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: 'HIGH',
            impact: 'CRITICAL',
            suggestedFix:
              'Deprecate column in application code first, verify zero running queries, and require an explicit waiver (--reason) to execute drop.'
          });
        }
      }
    }

    return findings;
  }
};
