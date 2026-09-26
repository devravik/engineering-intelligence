import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

// Non-critical sidecar entities where eventual consistency or partial failure is often intentional
const SIDECAR_ENTITY_PATTERNS = [
  /audit/i,
  /log/i,
  /metric/i,
  /telemetry/i,
  /analytics/i,
  /queue/i,
  /notification/i,
  /webhook/i,
  /event/i
];

function isSidecarEntity(name: string): boolean {
  return SIDECAR_ENTITY_PATTERNS.some(p => p.test(name));
}

export const db005: Detector = {
  id: 'DB-005',
  name: 'multi-mutation-without-transaction',
  category: 'Database',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects potential multi-mutation consistency boundaries across entities executed without an atomic transaction.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const lower = file.path.toLowerCase();
      const isTargetedFixture = Boolean(context.targetPath && file.path.includes(context.targetPath));
      if (!isTargetedFixture) {
        if (
          lower.includes('/tests/') ||
          lower.includes('/fixtures/') ||
          lower.includes('/detectors/') ||
          lower.endsWith('.test.ts') ||
          lower.endsWith('.test.js') ||
          lower.endsWith('.spec.ts') ||
          lower.endsWith('.spec.js') ||
          lower.endsWith('.md')
        ) {
          continue;
        }
      }

      // Check functions with sliding windows or block analysis
      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // Detect function declarations: async function foo( or async (req, res) => or foo: async () =>
        const isAsyncFn = /(?:async\s+function\b|async\s*\([^)]*\)\s*=>|\b\w+\s*:\s*async\s*\()/.test(line);
        if (!isAsyncFn) continue;

        // Examine the function block (up to 40 lines), stripping single-line comments
        const windowLines = file.lines.slice(i, Math.min(i + 40, file.lines.length));
        const codeOnlyLines = windowLines.filter(l => {
          const t = l.trim();
          return !t.startsWith('//') && !t.startsWith('/*') && !t.startsWith('*');
        });
        const windowContent = codeOnlyLines.join('\n');

        // If the block is already wrapped in a transaction, it is safe
        const hasTransactionBoundary =
          /\$transaction\b|\.transaction\b|BEGIN\b|startTransaction\b|runTransaction\b|tx\./i.test(
            windowContent
          );
        if (hasTransactionBoundary) continue;

        // Match distinct mutating database operations
        // Prisma: await prisma.model.create/update/delete/upsert
        const prismaMutations = Array.from(
          windowContent.matchAll(/await\s+prisma\.([a-zA-Z0-9_]+)\.(?:create|update|delete|upsert|createMany|deleteMany|updateMany)\b/g)
        ).map(m => m[1]);

        // Drizzle / Kysely / Generic DB: await db.insert(table).values(...)
        const genericMutations = Array.from(
          windowContent.matchAll(/await\s+db\.(?:insert|update|delete)\s*\(\s*([a-zA-Z0-9_]+)\s*\)/g)
        ).map(m => m[1]);

        const distinctPrismaModels = new Set(prismaMutations);
        const distinctGenericTables = new Set(genericMutations);

        const totalMutations = prismaMutations.length + genericMutations.length;
        const targetEntities = [...Array.from(distinctPrismaModels), ...Array.from(distinctGenericTables)];

        // If at least 2 writes occur across distinct targets
        if (totalMutations >= 2 && targetEntities.length >= 2) {
          // Check if all secondary mutations are sidecars (audit, queue, metrics)
          const coreEntities = targetEntities.filter(e => !isSidecarEntity(e));
          const hasMultipleCoreEntities = coreEntities.length >= 2;

          const targetNames = targetEntities.join(', ');

          findings.push({
            ruleId: 'DB-005',
            category: 'Database',
            title: `Potential multi-mutation consistency boundary across entities (${targetNames})`,
            message: `Function executes sequential database write mutations on multiple entities (${targetNames}) without an explicit transaction boundary. Verify whether partial write failure violates consistency invariants or if eventual consistency is intentional.`,
            filePath: file.path,
            line: i + 1,
            evidence: line.trim(),
            confidence: hasMultipleCoreEntities ? 'HIGH' : 'MEDIUM',
            impact: 'HIGH',
            disposition: hasMultipleCoreEntities ? 'FIX' : 'REVIEW',
            ruleClass: 'PROBABLE',
            suggestedFix:
              'If atomic consistency is required across these entities, wrap operations in a database transaction (e.g., await prisma.$transaction([...]) or db.transaction(async tx => ...)).'
          });
        }
      }
    }

    return findings;
  }
};
