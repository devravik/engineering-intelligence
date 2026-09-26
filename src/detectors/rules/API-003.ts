import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const api003: Detector = {
  id: 'API-003',
  name: 'breaking-contract-change',
  category: 'Security',
  severity: 'CRITICAL',
  ruleClass: 'PROBABLE',
  description: 'Detects breaking modifications to public API route signatures or contract definitions.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Analyze route files for breaking parameter changes or removal of fields
    for (const file of context.files) {
      if (!file.path.includes('/api/') && !file.path.includes('/routes/') && !file.path.includes('/controllers/')) {
        continue;
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        // 1. Mandatory new parameter without optionality or default in route handler
        // e.g. export async function POST(req: Request, { params }: { params: { id: string; orgId: string } })
        const mandatoryParamMatch = line.match(
          /export\s+async\s+function\s+(?:POST|PUT|PATCH|DELETE|GET)\s*\([^)]*\{\s*params\s*\}\s*:\s*\{\s*params\s*:\s*\{([^}]+)\}/
        );
        if (mandatoryParamMatch) {
          const paramsStr = mandatoryParamMatch[1];
          // Check if multiple params are declared without optional (?) flag
          const rawParams = paramsStr.split(';').map(p => p.trim()).filter(Boolean);
          const nonOptional = rawParams.filter(p => !p.includes('?:'));
          if (nonOptional.length >= 2) {
            findings.push({
              ruleId: 'API-003',
              category: 'Security',
              title: 'Breaking API route contract: mandatory non-optional path parameters',
              message: `Route handler introduces multiple mandatory non-optional path parameters (${nonOptional.join(
                ', '
              )}) without backward-compatible defaults. Existing API callers will receive 400/404 errors.`,
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'CRITICAL',
              suggestedFix:
                'Mark newly added route parameters as optional (param?: type) or provide a fallback route.'
            });
          }
        }

        // 2. Detection of hardcoded route path pattern mutations or breaking parameter shifts
        const routePathMatch = line.match(/(?:app|router|route)\.(?:get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/i);
        if (routePathMatch) {
          const pathPattern = routePathMatch[1];
          // Flag route patterns that require multi-segment mandatory params without wildcard or versioning
          const paramSegments = pathPattern.match(/:[a-zA-Z0-9_]+/g);
          if (paramSegments && paramSegments.length >= 3 && !pathPattern.startsWith('/v')) {
            findings.push({
              ruleId: 'API-003',
              category: 'Security',
              title: `High-coupling breaking route pattern: '${pathPattern}'`,
              message: `Unversioned API endpoint '${pathPattern}' mandates ${paramSegments.length} required URL parameters. Modifying unversioned route parameter patterns breaks existing clients.`,
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'CRITICAL',
              suggestedFix:
                'Prefix public APIs with versioning (/v1/...) or make nested parameters optional query parameters.'
            });
          }
        }
      }
    }

    return findings;
  }
};
