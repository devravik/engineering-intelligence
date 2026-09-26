import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Detector, DetectorContext } from './types.js';
import { RawFinding, Category, Severity, Confidence } from '../findings/types.js';

export interface DeclarativeRuleConfig {
  id: string;
  name: string;
  category: Category;
  severity: Severity;
  confidence?: Confidence;
  description: string;
  pattern: string;
  fileExtensions?: string[];
  suggestedFix?: string;
}

export function loadCustomRules(repoRoot: string): Detector[] {
  const customDir = join(repoRoot, '.ei', 'rules');
  if (!existsSync(customDir)) {
    return [];
  }

  const detectors: Detector[] = [];

  try {
    const files = readdirSync(customDir).filter(f => f.endsWith('.json'));
    for (const file of files) {
      try {
        const content = readFileSync(join(customDir, file), 'utf-8');
        const config: DeclarativeRuleConfig = JSON.parse(content);

        if (!config.id || !config.pattern || !config.category) {
          continue;
        }

        const regex = new RegExp(config.pattern, 'm');
        const extensions = config.fileExtensions || ['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs'];

        const detector: Detector = {
          id: config.id,
          name: config.name || config.id,
          category: config.category,
          severity: config.severity || 'MEDIUM',
          description: config.description || 'Custom team quality rule',
          run: async (context: DetectorContext): Promise<RawFinding[]> => {
            const findings: RawFinding[] = [];


            for (const file of context.files) {
              if (!extensions.some(ext => file.path.endsWith(ext))) {
                continue;
              }

              for (let i = 0; i < file.lines.length; i++) {
                const line = file.lines[i];
                if (regex.test(line)) {
                  findings.push({
                    ruleId: config.id,
                    category: config.category,
                    title: config.description,
                    message: `Custom rule violation '${config.id}' detected: matches pattern /${config.pattern}/`,
                    filePath: file.path,
                    line: i + 1,
                    evidence: line.trim(),
                    confidence: config.confidence || 'HIGH',
                    impact: config.severity || 'MEDIUM',
                    suggestedFix: config.suggestedFix
                  });
                }
              }
            }

            return findings;
          }
        };

        detectors.push(detector);
      } catch {
        // Skip invalid rule JSON files
      }
    }
  } catch {
    // Cannot read .ei/rules/
  }

  return detectors;
}
