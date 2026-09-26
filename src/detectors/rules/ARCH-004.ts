import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const arch004: Detector = {
  id: 'ARCH-004',
  name: 'architecture-inconsistency',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects architectural boundary violations such as direct database persistence calls in client UI components.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const isClientComponent =
        file.content.includes("'use client'") ||
        file.content.includes('"use client"') ||
        file.path.includes('/components/') ||
        file.path.includes('/views/');

      if (!isClientComponent) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];

        // Check for direct database imports or query calls in client UI components
        const directDbCall =
          /import\s+.*?\s+from\s+['"].*?(?:db|prisma|drizzle|typeorm|database)['"]/i.test(line) ||
          /(?:await\s+)?(?:db|prisma|drizzle)\.[a-zA-Z0-9_]+\.(?:find[A-Za-z0-9_]*|create|update|delete|select|query)\b/.test(line);

        if (directDbCall) {
          findings.push({
            ruleId: 'ARCH-004',
            category: 'Architecture',
            title: 'Architectural boundary violation: direct database call in UI component',
            message: `Client UI component '${file.path}' directly accesses database persistence layers. This violates separation of concerns and risks leaking database credentials or internal schemas to client bundles.`,
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: 'HIGH',
            impact: 'HIGH',
            suggestedFix:
              'Move database access to a Server Action, API route handler, or dedicated backend service.'
          });
        }
      }
    }

    return findings;
  }
};
