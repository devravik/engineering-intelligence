import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

const GENERIC_CRUD_METHODS = new Set([
  'constructor',
  'render',
  'ngOnInit',
  'toString',
  'valueOf',
  'find',
  'findById',
  'findOne',
  'findAll',
  'findFirst',
  'findMany',
  'get',
  'getAll',
  'getById',
  'create',
  'save',
  'update',
  'delete',
  'remove',
  'destroy',
  'list',
  'count',
  'exists'
]);

interface ClassMethodEntry {
  className: string;
  file: string;
  line: number;
  methods: Set<string>;
}

export const arch002: Detector = {
  id: 'ARCH-002',
  name: 'duplicated-responsibility',
  category: 'Architecture',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects multiple services or modules with overlapping responsibilities and duplicated public methods.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Collect class definitions and their public methods across all files
    const classEntries: ClassMethodEntry[] = [];

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
            classEntries.push({
              className: currentClass,
              file: file.path,
              line: currentLine,
              methods
            });
          }
          currentClass = classMatch[1];
          currentLine = i + 1;
          methods = new Set<string>();
        } else if (currentClass) {
          // Detect method definitions: async methodName( or methodName(
          const methodMatch = line.match(/^\s*(?:async\s+)?([A-Za-z0-9_]+)\s*\([^)]*\)\s*[{:]/);
          if (methodMatch) {
            const name = methodMatch[1];
            if (!GENERIC_CRUD_METHODS.has(name)) {
              methods.add(name);
            }
          }
        }
      }

      if (currentClass && methods.size >= 3) {
        classEntries.push({
          className: currentClass,
          file: file.path,
          line: currentLine,
          methods
        });
      }
    }

    // Compare classes for overlapping domain responsibilities (>= 3 overlapping domain method names)
    const checkedPairs = new Set<string>();

    for (let i = 0; i < classEntries.length; i++) {
      for (let j = i + 1; j < classEntries.length; j++) {
        const entryA = classEntries[i];
        const entryB = classEntries[j];

        const pairKey = [
          `${entryA.className}:${entryA.file}`,
          `${entryB.className}:${entryB.file}`
        ]
          .sort()
          .join('<->');

        if (checkedPairs.has(pairKey)) continue;
        checkedPairs.add(pairKey);

        // Skip inheritance / subclass naming relations
        if (entryA.className.includes(entryB.className) || entryB.className.includes(entryA.className)) {
          continue;
        }

        // Skip polymorphic adapters, providers, drivers, or strategies implementing the same contract
        const isPolymorphic = (name: string, file: string) => {
          return (
            /(?:Adapter|Provider|Driver|Strategy|Plugin|Client)$/i.test(name) ||
            file.includes('/adapters/') ||
            file.includes('/providers/') ||
            file.includes('/drivers/')
          );
        };
        if (isPolymorphic(entryA.className, entryA.file) && isPolymorphic(entryB.className, entryB.file)) {
          continue;
        }

        const intersection = Array.from(entryA.methods).filter(m => entryB.methods.has(m));
        if (intersection.length >= 3) {
          findings.push({
            ruleId: 'ARCH-002',
            category: 'Architecture',
            title: `Duplicated responsibility between '${entryA.className}' and '${entryB.className}'`,
            message: `'${entryA.className}' and '${entryB.className}' share ${intersection.length} identical domain method responsibilities (${intersection.join(
              ', '
            )}). This creates split authority and architectural ambiguity.`,
            filePath: entryA.file,
            line: entryA.line,
            evidence: `Class ${entryA.className} in ${entryA.file} ⇄ Class ${entryB.className} in ${entryB.file}`,
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
