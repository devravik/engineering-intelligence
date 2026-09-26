import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

// User / request / external input indicators (Tier 1: High risk of SQL injection)
const UNTRUSTED_INPUT_PATTERNS = [
  /req\.(?:body|query|params|headers)/i,
  /userInput/i,
  /params\./i,
  /\bemail\b/i,
  /\busername\b/i,
  /\bsearch\b/i,
  /\bfilter\b/i,
  /\binput\b/i,
  /\bpayload\b/i,
  /\bsearchTerm\b/i,
  /\bkeyword\b/i,
  /\bformData\b/i
];

// Benign / numeric / configuration expressions in queries
const BENIGN_INTERPOLATIONS = [
  /^\s*\d+\s*$/,                                 // numeric literal: ${10}
  /^\s*(?:LIMIT|OFFSET|PAGE_SIZE|MAX_LIMIT)\s*$/i, // configuration constants
  /^\s*(?:asc|desc)\s*$/i,                        // sort order literal
  /^\s*schema\s*$/i                               // schema qualification
];

function isBenignInterpolation(expr: string): boolean {
  return BENIGN_INTERPOLATIONS.some(p => p.test(expr));
}

function isUntrustedInput(expr: string): boolean {
  return UNTRUSTED_INPUT_PATTERNS.some(p => p.test(expr));
}

export const sec002: Detector = {
  id: 'SEC-002',
  name: 'sql-injection',
  category: 'Security',
  severity: 'CRITICAL',
  ruleClass: 'CERTAIN',
  description: 'Detects raw SQL queries constructed using direct string interpolation with data-flow risk classification.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const lower = file.path.toLowerCase();
      const isTargetedFixture = Boolean(context.targetPath && file.path.includes(context.targetPath));
      if (!isTargetedFixture) {
        if (
          lower.includes('/tests/') ||
          lower.includes('/fixtures/') ||
          lower.includes('/docs/') ||
          lower.includes('/detectors/') ||
          lower.endsWith('.test.ts') ||
          lower.endsWith('.test.js') ||
          lower.endsWith('.spec.ts') ||
          lower.endsWith('.spec.js') ||
          lower.endsWith('.md')
        ) {
          continue;
        }
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // 1. Prisma $queryRawUnsafe with interpolation or concatenation
        const prismaUnsafeMatch = line.match(/\$queryRawUnsafe\s*\(\s*(?:`([^`]+)`|["']([^"']+)["']\s*\+\s*([a-zA-Z0-9_.]+))/);

        // 2. Generic raw SQL execution methods: db.query(`... ${expr} ...`)
        const rawSqlExecMatch = line.match(
          /(?:db|pool|client|connection|sql|knex|sequelize)\.(?:query|execute|raw)\s*\(\s*`([^`]*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|WHERE|FROM)[^`]*)`/i
        );

        // 3. String concatenation in query calls: db.query('SELECT ... ' + expr)
        const concatenatedQueryMatch = line.match(
          /(?:db|pool|client|connection)\.(?:query|execute)\s*\(\s*["']([^"']*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|WHERE|FROM)[^"']*)["']\s*\+\s*([a-zA-Z0-9_.]+)/i
        );

        // 4. Raw SQL string templates assigned to query variables: const query = `SELECT ... ${expr}`
        const rawSqlTemplateMatch = line.match(
          /`\s*(?:SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b([^`]*)`/i
        );

        if (prismaUnsafeMatch || rawSqlExecMatch || concatenatedQueryMatch || rawSqlTemplateMatch) {
          const sqlText =
            (prismaUnsafeMatch && (prismaUnsafeMatch[1] || prismaUnsafeMatch[2])) ||
            (rawSqlExecMatch && rawSqlExecMatch[1]) ||
            (concatenatedQueryMatch && concatenatedQueryMatch[1]) ||
            (rawSqlTemplateMatch && rawSqlTemplateMatch[1]) ||
            '';

          // Extract all interpolated expressions ${...}
          const interpolations = Array.from(line.matchAll(/\$\{([^}]+)\}/g)).map(m => m[1].trim());

          // If the only interpolation is benign (e.g. ${10} or ${PAGE_SIZE}), skip or downgrade
          if (interpolations.length > 0 && interpolations.every(isBenignInterpolation)) {
            continue;
          }

          // Evaluate provenance risk
          const hasExplicitUntrustedInput =
            interpolations.some(isUntrustedInput) ||
            (concatenatedQueryMatch && isUntrustedInput(concatenatedQueryMatch[2]));

          if (hasExplicitUntrustedInput) {
            findings.push({
              ruleId: 'SEC-002',
              category: 'Security',
              title: 'Unsanitized raw SQL query construction with request-derived input (SQL Injection risk)',
              message:
                'SQL query is constructed using direct string interpolation with untrusted or external input. Unsanitized inputs create critical SQL injection vulnerabilities.',
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'CRITICAL',
              disposition: 'BLOCK',
              ruleClass: 'CERTAIN',
              suggestedFix:
                'Use parameterized prepared statements (e.g. $1, $2 or prisma.$queryRaw tagged template) to ensure variable escaping.'
            });
          } else if (interpolations.length > 0 || concatenatedQueryMatch) {
            // Identifier or variable of ambiguous provenance: flag for REVIEW rather than hard BLOCK
            findings.push({
              ruleId: 'SEC-002',
              category: 'Security',
              title: 'Raw SQL query string interpolation with dynamic expression',
              message:
                'SQL query interpolates dynamic expression. If this variable is ever derived from client inputs, it introduces SQL injection risk.',
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'MEDIUM',
              impact: 'HIGH',
              disposition: 'REVIEW',
              ruleClass: 'PROBABLE',
              suggestedFix:
                'Replace dynamic string interpolation with parameterized query bindings.'
            });
          }
        }
      }
    }

    return findings;
  }
};
