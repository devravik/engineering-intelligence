import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const db003: Detector = {
  id: 'DB-003',
  name: 'unsafe-migration',
  category: 'Database',
  severity: 'CRITICAL',
  ruleClass: 'CERTAIN',
  description: 'Detects table-locking migrations that add NOT NULL columns without DEFAULT values.',

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

        // SQL: ALTER TABLE ... ADD COLUMN ... NOT NULL without DEFAULT
        const sqlMatch = line.match(
          /ALTER\s+TABLE\s+([A-Za-z0-9_."]+)\s+ADD\s+(?:COLUMN\s+)?([A-Za-z0-9_]+)\s+([A-Za-z0-9_()]+)\s+NOT\s+NULL/i
        );

        if (sqlMatch && !/DEFAULT\b/i.test(line)) {
          findings.push({
            ruleId: 'DB-003',
            category: 'Database',
            title: 'Unsafe migration adds NOT NULL column without DEFAULT',
            message: `Migration adds NOT NULL column '${sqlMatch[2]}' to table '${sqlMatch[1]}' without a DEFAULT value. On tables with existing records, this migration will lock the table and fail immediately.`,
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: 'HIGH',
            impact: 'CRITICAL',
            suggestedFix:
              'Make the column nullable initially, backfill default data, and then apply NOT NULL constraint in a subsequent step.'
          });
        }
      }
    }

    return findings;
  }
};
