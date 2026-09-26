import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const api001: Detector = {
  id: 'API-001',
  name: 'missing-authorization',
  category: 'Security',
  severity: 'CRITICAL',
  description: 'Detects mutating API endpoints or server actions that modify state without authorization checks.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const lowerPath = file.path.toLowerCase();
      const isRouteFile =
        lowerPath.includes('route') ||
        lowerPath.includes('api') ||
        lowerPath.includes('controller') ||
        lowerPath.includes('action');

      if (!isRouteFile) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        // Check for POST/PUT/DELETE/PATCH handlers
        const isMutatingHandler =
          line.match(/export\s+async\s+function\s+(POST|PUT|DELETE|PATCH)\b/) ||
          line.match(/(?:app|router|server|route|fastify)\.(post|put|delete|patch)\s*\(/i);

        if (isMutatingHandler) {
          // Look inside the function block (up to 30 lines) for auth/session checks
          const window = file.lines.slice(i, Math.min(i + 35, file.lines.length)).join('\n');

          const hasAuth =
            /auth\b|session\b|token\b|req\.user|currentUser|getUser\(|permission\b|role\b|requireAuth|authenticate|verifyToken/i.test(
              window
            );

          const hasDatabaseWrite =
            /insert|update|delete|save|destroy|create|prisma\.|drizzle|db\.|findAndModify/i.test(window);

          if (!hasAuth && hasDatabaseWrite) {
            findings.push({
              ruleId: 'API-001',
              category: 'Security',
              title: 'Mutating route handler missing authorization guard',
              message:
                'Endpoint performs database mutations without verifying user authentication, session, or role permissions.',
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'CRITICAL',
              suggestedFix:
                'Add authentication middleware or verify user permissions before executing mutations.'
            });
          }
        }
      }
    }

    return findings;
  }
};
