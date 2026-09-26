import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const code006: Detector = {
  id: 'CODE-006',
  name: 'type-safety-bypass',
  category: 'CodeQuality',
  severity: 'MEDIUM',
  ruleClass: 'CERTAIN',
  description: 'Detects compiler suppression directives (@ts-ignore, @ts-nocheck) and gratuitous "as any" type casts in application code.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.tsx')) continue;

      const lower = file.path.toLowerCase();
      const isTargetedFixture = Boolean(context.targetPath && file.path.includes(context.targetPath));
      if (!isTargetedFixture) {
        if (
          lower.includes('/tests/') ||
          lower.includes('/fixtures/') ||
          lower.includes('/detectors/') ||
          lower.endsWith('.test.ts') ||
          lower.endsWith('.spec.ts')
        ) {
          continue;
        }
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        // 1. Direct compiler suppression directives
        if (trimmed.includes('@ts-ignore') || trimmed.includes('@ts-nocheck')) {
          findings.push({
            ruleId: 'CODE-006',
            category: 'CodeQuality',
            title: 'TypeScript compiler suppression directive detected',
            message: `File utilizes compiler suppression directive (${trimmed.includes('@ts-ignore') ? '@ts-ignore' : '@ts-nocheck'}). Bypassing the compiler masks type safety regressions and runtime crashes.`,
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: 'HIGH',
            impact: 'MEDIUM',
            suggestedFix:
              'Remove suppression comment and supply proper type declarations, generics, or type narrowing.'
          });
          continue;
        }

        // Skip comments for the 'as any' check
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // 2. Unsafe 'as any' or '<any>' casts
        const hasAsAny = /\bas\s+any\b|<any>/.test(line);
        if (hasAsAny) {
          findings.push({
            ruleId: 'CODE-006',
            category: 'CodeQuality',
            title: 'Unsafe type assertion to "any"',
            message:
              'Expression is cast to "any", discarding static type checking. This weakens compiler guarantees and propagates untyped variables across the codebase.',
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: 'HIGH',
            impact: 'MEDIUM',
            suggestedFix:
              'Cast to unknown with type guard validation or specify a typed interface/discriminated union instead of any.'
          });
        }
      }
    }

    return findings;
  }
};
