import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const code001: Detector = {
  id: 'CODE-001',
  name: 'duplicated-logic',
  category: 'CodeQuality',
  severity: 'MEDIUM',
  description: 'Detects identical multi-line code blocks duplicated across multiple files.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];
    const blockMap = new Map<string, { file: string; line: number; snippet: string }>();

    const BLOCK_SIZE = 6;

    for (const file of context.files) {
      if (
        file.path.includes('test') ||
        file.path.includes('spec') ||
        file.path.endsWith('.json') ||
        file.path.endsWith('.d.ts')
      ) {
        continue;
      }

      for (let i = 0; i <= file.lines.length - BLOCK_SIZE; i++) {
        const slice = file.lines.slice(i, i + BLOCK_SIZE);
        // Normalize: strip leading/trailing whitespace and empty lines
        const normalized = slice
          .map(l => l.trim())
          .filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('*') && !l.startsWith('/*'))
          .join('\n');

        // Only check blocks with sufficient substance (not just closing brackets)
        if (normalized.length > 120 && normalized.includes('{') && normalized.includes('}')) {
          const existing = blockMap.get(normalized);
          if (existing && existing.file !== file.path) {
            findings.push({
              ruleId: 'CODE-001',
              category: 'CodeQuality',
              title: 'Duplicated logic block detected across files',
              message: `A ${BLOCK_SIZE}-line block of logic is duplicated between '${file.path}' and '${existing.file}'. Duplicating logic leads to diverging bug fixes and maintenance drag.`,
              filePath: file.path,
              line: i + 1,
              evidence: slice.slice(0, 3).join('\n') + '\n...',
              confidence: 'HIGH',
              impact: 'MEDIUM',
              suggestedFix: `Extract duplicated logic into a shared utility function or domain helper.`
            });
            break; // Report once per file to avoid noise
          } else if (!existing) {
            blockMap.set(normalized, {
              file: file.path,
              line: i + 1,
              snippet: slice.slice(0, 3).join('\n')
            });
          }
        }
      }
    }

    return findings;
  }
};
