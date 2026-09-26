import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const code002: Detector = {
  id: 'CODE-002',
  name: 'dead-code',
  category: 'CodeQuality',
  severity: 'MEDIUM',
  description: 'Detects exported functions or classes that are never referenced across the codebase.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Find exports in non-entrypoint, non-test files
    const declaredExports: Array<{ name: string; file: string; line: number; type: string }> = [];

    for (const file of context.files) {
      if (
        file.path.includes('test') ||
        file.path.includes('spec') ||
        file.path.endsWith('index.ts') ||
        file.path.endsWith('index.js') ||
        file.path.endsWith('cli.ts') ||
        file.path.endsWith('cli.js') ||
        file.path.endsWith('.d.ts')
      ) {
        continue;
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const match = line.match(/^export\s+(?:async\s+)?(function|class|const)\s+([A-Za-z0-9_]+)/);
        if (match) {
          const type = match[1];
          const name = match[2];
          // Skip default conventions
          if (name !== 'default' && !name.startsWith('_')) {
            declaredExports.push({ name, file: file.path, line: i + 1, type });
          }
        }
      }
    }

    // Check all files for usage of these exports
    for (const exp of declaredExports) {
      let references = 0;
      const regex = new RegExp(`\\b${exp.name}\\b`);

      for (const file of context.files) {
        if (file.path === exp.file) {
          // Inside the declaring file, count occurrences beyond the export line
          const occurrences = file.content.split(regex).length - 1;
          if (occurrences > 1) {
            references++;
          }
        } else {
          if (regex.test(file.content)) {
            references++;
            break;
          }
        }
      }

      if (references === 0) {
        findings.push({
          ruleId: 'CODE-002',
          category: 'CodeQuality',
          title: `Dead or unreferenced export '${exp.name}'`,
          message: `The exported ${exp.type} '${exp.name}' is declared in '${exp.file}' but never imported or referenced anywhere in the repository.`,
          filePath: exp.file,
          line: exp.line,
          evidence: `export ${exp.type} ${exp.name}`,
          confidence: 'HIGH',
          impact: 'MEDIUM',
          suggestedFix: `Delete unreferenced export '${exp.name}' or mark it internal if only used within its module.`
        });
      }
    }

    return findings;
  }
};
