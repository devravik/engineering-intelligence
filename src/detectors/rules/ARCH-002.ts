import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const arch002: Detector = {
  id: 'ARCH-002',
  name: 'duplicated-responsibility',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects multiple services or modules with overlapping responsibilities and duplicated public methods.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Collect class definitions and their public methods
    const classMethods = new Map<string, { file: string; line: number; methods: Set<string> }>();

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js')) continue;

      let currentClass: string | null = null;
      let currentLine = 1;
      let methods = new Set<string>();

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const classMatch = line.match(/class\s+([A-Za-z0-9_]+)\b/);
        if (classMatch) {
          if (currentClass && methods.size >= 3) {
            classMethods.set(currentClass, { file: file.path, line: currentLine, methods });
          }
          currentClass = classMatch[1];
          currentLine = i + 1;
          methods = new Set<string>();
        } else if (currentClass) {
          // Detect method definitions: async methodName( or methodName(
          const methodMatch = line.match(/^\s*(?:async\s+)?([A-Za-z0-9_]+)\s*\([^)]*\)\s*[{:]/);
          if (methodMatch) {
            const name = methodMatch[1];
            if (!['constructor', 'render', 'ngOnInit', 'toString'].includes(name)) {
              methods.add(name);
            }
          }
        }
      }

      if (currentClass && methods.size >= 3) {
        classMethods.set(currentClass, { file: file.path, line: currentLine, methods });
      }
    }

    // Compare classes for overlapping responsibilities (>= 3 overlapping method names)
    const classNames = Array.from(classMethods.keys());
    const checkedPairs = new Set<string>();

    for (let i = 0; i < classNames.length; i++) {
      for (let j = i + 1; j < classNames.length; j++) {
        const classA = classNames[i];
        const classB = classNames[j];
        const pairKey = [classA, classB].sort().join('<->');
        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        const infoA = classMethods.get(classA)!;
        const infoB = classMethods.get(classB)!;

        // Skip subclasses
        if (classA.includes(classB) || classB.includes(classA)) continue;

        const intersection = Array.from(infoA.methods).filter(m => infoB.methods.has(m));
        if (intersection.length >= 3) {
          findings.push({
            ruleId: 'ARCH-002',
            category: 'Architecture',
            title: `Duplicated responsibility between '${classA}' and '${classB}'`,
            message: `'${classA}' and '${classB}' share ${intersection.length} identical method responsibilities (${intersection.join(
              ', '
            )}). This creates split authority and architectural ambiguity.`,
            filePath: infoA.file,
            line: infoA.line,
            evidence: `Class ${classA} in ${infoA.file} ⇄ Class ${classB} in ${infoB.file}`,
            confidence: 'HIGH',
            impact: 'HIGH',
            suggestedFix: `Consolidate overlapping methods into a single authoritative domain service.`
          });
        }
      }
    }

    return findings;
  }
};
