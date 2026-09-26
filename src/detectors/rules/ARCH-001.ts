import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const arch001: Detector = {
  id: 'ARCH-001',
  name: 'unnecessary-abstraction',
  category: 'Architecture',
  severity: 'HIGH',
  description: 'Detects single-implementation interfaces that add indirection without supporting variation.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    // Map all interfaces and their implementations
    const interfaceMap = new Map<string, { file: string; line: number; name: string }>();
    const implementationCount = new Map<string, number>();

    // 1. Find all interfaces
    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.tsx') && !file.path.endsWith('.java') && !file.path.endsWith('.cs')) {
        continue;
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        // Match interface declarations: interface IUserService or interface UserService
        const match = line.match(/\binterface\s+([A-Za-z0-9_]+)/);
        if (match && !match[1].startsWith('Props') && !match[1].endsWith('Props') && !match[1].endsWith('State')) {
          const ifaceName = match[1];
          interfaceMap.set(ifaceName, {
            file: file.path,
            line: i + 1,
            name: ifaceName
          });
          implementationCount.set(ifaceName, 0);
        }
      }
    }

    // 2. Count "implements <Interface>"
    for (const file of context.files) {
      for (const line of file.lines) {
        const implMatch = line.match(/\bimplements\s+([A-Za-z0-9_,\s]+)/);
        if (implMatch) {
          const implemented = implMatch[1].split(',').map(s => s.trim());
          for (const iface of implemented) {
            if (implementationCount.has(iface)) {
              implementationCount.set(iface, (implementationCount.get(iface) || 0) + 1);
            }
          }
        }
      }
    }

    // 3. Flag interfaces with exactly 1 implementation
    for (const [ifaceName, count] of implementationCount.entries()) {
      if (count === 1) {
        const info = interfaceMap.get(ifaceName);
        if (info) {
          findings.push({
            ruleId: 'ARCH-001',
            category: 'Architecture',
            title: `Single-implementation interface '${ifaceName}'`,
            message: `Interface '${ifaceName}' has exactly one concrete implementation. This introduces cognitive indirection without supporting polymorphism or variation.`,
            filePath: info.file,
            line: info.line,
            evidence: `interface ${ifaceName}`,
            confidence: 'HIGH',
            impact: 'HIGH',
            suggestedFix: `Collapse '${ifaceName}' directly into the concrete class until multiple distinct implementations are required.`
          });
        }
      }
    }

    return findings;
  }
};
