import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const slop004: Detector = {
  id: 'SLOP-004',
  name: 'unnecessary-configuration',
  category: 'Slop',
  severity: 'LOW',
  description: 'Detects phantom environment variables used in code that are missing from .env.example documentation.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    const envExampleFile = context.files.find(f => f.path.includes('.env.example') || f.path === '.env.example');
    const documentedVars = new Set<string>();

    if (envExampleFile) {
      for (const line of envExampleFile.lines) {
        const match = line.match(/^([A-Z0-9_]+)=/);
        if (match) documentedVars.add(match[1]);
      }
    }

    // Standard runtime envs to ignore
    const standardEnvs = new Set(['NODE_ENV', 'PORT', 'USER', 'HOME', 'PATH', 'PWD']);

    for (const file of context.files) {
      if (file.path.includes('.env') || file.path.includes('test') || file.path.includes('spec')) continue;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const envMatches = line.matchAll(/process\.env\.([A-Z0-9_]+)/g);

        for (const match of envMatches) {
          const varName = match[1];
          if (!standardEnvs.has(varName) && envExampleFile && !documentedVars.has(varName)) {
            findings.push({
              ruleId: 'SLOP-004',
              category: 'Slop',
              title: `Undocumented environment variable '${varName}'`,
              message: `Code references 'process.env.${varName}' on line ${i + 1}, but '${varName}' is not documented in .env.example. Undocumented configuration causes production crashes during deployment.`,
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'LOW',
              suggestedFix: `Add '${varName}=' to .env.example or inline static configuration.`
            });
          }
        }
      }
    }

    return findings;
  }
};
