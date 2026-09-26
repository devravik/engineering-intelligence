import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const db001: Detector = {
  id: 'DB-001',
  name: 'missing-index',
  category: 'Database',
  severity: 'HIGH',
  description: 'Detects foreign key relation columns declared in SQL or schemas without accompanying indexes.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const isSql = file.path.endsWith('.sql');
      const isPrisma = file.path.endsWith('.prisma');

      if (isSql) {
        // Find CREATE TABLE statements
        let currentTable = '';
        const columns: Array<{ name: string; line: number }> = [];
        const indexedColumns = new Set<string>();

        for (let i = 0; i < file.lines.length; i++) {
          const line = file.lines[i];

          const tableMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z0-9_."]+)/i);
          if (tableMatch) {
            currentTable = tableMatch[1];
          }

          // Match foreign key columns: user_id INT, tenant_id UUID, etc.
          const fkMatch = line.match(/^\s*([A-Za-z0-9_]+_id)\s+[A-Za-z0-9_()]+/i);
          if (fkMatch && !line.includes('PRIMARY KEY')) {
            columns.push({ name: fkMatch[1], line: i + 1 });
          }

          // Match index definitions: CREATE INDEX ... ON table (column)
          const indexMatch = line.match(/(?:INDEX|KEY)\s*(?:\([A-Za-z0-9_,\s]+\)|[A-Za-z0-9_]+\s*\(([A-Za-z0-9_,\s]+)\))/i);
          if (indexMatch) {
            const cols = (indexMatch[1] || indexMatch[0]).replace(/[()]/g, '').split(',').map(s => s.trim());
            for (const c of cols) indexedColumns.add(c);
          }
        }

        for (const col of columns) {
          if (!indexedColumns.has(col.name) && !file.content.includes(`(${col.name})`)) {
            findings.push({
              ruleId: 'DB-001',
              category: 'Database',
              title: `Missing database index on foreign key column '${col.name}'`,
              message: `Column '${col.name}' in table '${currentTable}' is a relation foreign key but lacks an index. Unindexed foreign keys trigger full table scans during joins and delete cascades.`,
              filePath: file.path,
              line: col.line,
              evidence: `${col.name} in table ${currentTable}`,
              confidence: 'HIGH',
              impact: 'HIGH',
              suggestedFix: `Add \`CREATE INDEX idx_${currentTable}_${col.name} ON ${currentTable} (${col.name});\``
            });
          }
        }
      }
    }

    return findings;
  }
};
