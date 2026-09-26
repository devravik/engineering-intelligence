import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';
import { dirname, join, normalize } from 'node:path';

export const arch003: Detector = {
  id: 'ARCH-003',
  name: 'circular-dependency',
  category: 'Architecture',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects direct circular dependencies between modules.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];
    const importMap = new Map<string, Set<string>>();

    // Helper to resolve relative imports
    function resolveImport(sourceFile: string, importPath: string): string | null {
      if (!importPath.startsWith('.')) return null;
      const dir = dirname(sourceFile);
      let target = normalize(join(dir, importPath));
      // Normalize extension
      target = target.replace(/\.(ts|js|tsx|jsx)$/, '');
      return target;
    }

    // Build normalized import graph
    for (const file of context.files) {
      const sourceNorm = file.path.replace(/\.(ts|js|tsx|jsx)$/, '');
      const deps = new Set<string>();

      for (const line of file.lines) {
        const importMatch = line.match(/(?:import|from)\s+['"]([^'"]+)['"]/);
        if (importMatch) {
          const resolved = resolveImport(file.path, importMatch[1]);
          if (resolved) {
            deps.add(resolved);
          }
        }
      }
      importMap.set(sourceNorm, deps);
    }

    // Detect A -> B and B -> A cycles
    const reportedCycles = new Set<string>();

    for (const [fileA, depsA] of importMap.entries()) {
      for (const fileB of depsA) {
        const depsB = importMap.get(fileB);
        if (depsB && depsB.has(fileA)) {
          const pairKey = [fileA, fileB].sort().join('<->');
          if (!reportedCycles.has(pairKey)) {
            reportedCycles.add(pairKey);
            const sourceEntry = context.files.find(f => f.path.replace(/\.(ts|js|tsx|jsx)$/, '') === fileA);
            findings.push({
              ruleId: 'ARCH-003',
              category: 'Architecture',
              title: `Circular dependency between '${fileA}' and '${fileB}'`,
              message: `Direct circular import cycle detected between '${fileA}' and '${fileB}'. This creates tight coupling, hampers modular testing, and risks runtime initialization errors.`,
              filePath: sourceEntry ? sourceEntry.path : `${fileA}.ts`,
              line: 1,
              evidence: `import from '${fileB}' ⇄ import from '${fileA}'`,
              confidence: 'HIGH',
              impact: 'HIGH',
              suggestedFix: `Extract shared types/logic into an independent leaf module or use event-driven communication.`
            });
          }
        }
      }
    }

    return findings;
  }
};
