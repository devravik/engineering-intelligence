import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const code004: Detector = {
  id: 'CODE-004',
  name: 'unnecessary-dependency',
  category: 'CodeQuality',
  severity: 'MEDIUM',
  description: 'Detects production dependencies declared in package.json that are never imported anywhere in the project.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    const packageJsonFile = context.files.find(f => f.path === 'package.json');
    if (!packageJsonFile) return findings;

    let dependencies: Record<string, string> = {};
    try {
      const parsed = JSON.parse(packageJsonFile.content);
      dependencies = parsed.dependencies || {};
    } catch {
      return findings;
    }

    const depNames = Object.keys(dependencies);
    if (depNames.length === 0) return findings;

    // Check each dependency across all files
    for (const dep of depNames) {
      // Exclude build/type tools commonly in dependencies
      if (dep.startsWith('@types/') || dep.includes('plugin') || dep.includes('config')) {
        continue;
      }

      const importRegex = new RegExp(`(?:from|import|require\\s*\\()\\s*['"]${dep}(?:/.*)?['"]`);
      let isImported = false;

      for (const file of context.files) {
        if (file.path === 'package.json' || file.path === 'package-lock.json') continue;
        if (importRegex.test(file.content)) {
          isImported = true;
          break;
        }
      }

      if (!isImported) {
        findings.push({
          ruleId: 'CODE-004',
          category: 'CodeQuality',
          title: `Unused dependency '${dep}' in package.json`,
          message: `Package '${dep}' is declared under dependencies in package.json but is never imported or required across the codebase. Unused dependencies bloat container images and increase CVE attack surface.`,
          filePath: 'package.json',
          line: 1,
          evidence: `"${dep}": "${dependencies[dep]}"`,
          confidence: 'HIGH',
          impact: 'MEDIUM',
          suggestedFix: `Run \`npm uninstall ${dep}\` to remove the unreferenced package.`
        });
      }
    }

    return findings;
  }
};
