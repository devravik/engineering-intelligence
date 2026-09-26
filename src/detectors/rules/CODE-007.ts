import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const code007: Detector = {
  id: 'CODE-007',
  name: 'floating-promise',
  category: 'CodeQuality',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects floating, unawaited asynchronous promises on known async APIs in mutating handlers.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js')) continue;

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
          lower.endsWith('.spec.js')
        ) {
          continue;
        }
      }

      // Collect names of functions declared as `async` in this file
      const localAsyncFunctions = new Set<string>();
      for (const line of file.lines) {
        const asyncFnMatch = line.match(/\basync\s+function\s+([A-Za-z0-9_]+)\b/);
        if (asyncFnMatch) {
          localAsyncFunctions.add(asyncFnMatch[1]);
        }
        const asyncArrowMatch = line.match(/\bconst\s+([A-Za-z0-9_]+)\s*=\s*async\s*\(/);
        if (asyncArrowMatch) {
          localAsyncFunctions.add(asyncArrowMatch[1]);
        }
      }

      let inAsyncFunction = false;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        if (/\basync\s+(?:function|\([^)]*\)|[a-zA-Z0-9_]+\s*\([^)]*\))/.test(line)) {
          inAsyncFunction = true;
        }

        if (!inAsyncFunction) continue;

        // Reset state on function boundary closing
        if (trimmed === '}' || trimmed === '};') {
          inAsyncFunction = false;
        }

        // Exclude lines with: await, return, void, const, let, var, yield
        if (
          trimmed.startsWith('await ') ||
          trimmed.startsWith('return ') ||
          trimmed.startsWith('void ') ||
          trimmed.startsWith('const ') ||
          trimmed.startsWith('let ') ||
          trimmed.startsWith('var ') ||
          trimmed.startsWith('yield ')
        ) {
          continue;
        }

        // CRITICAL: If the promise attaches .catch(...) or .then(...), it is safely handled!
        const forwardWindow = file.lines.slice(i, Math.min(i + 8, file.lines.length)).join('\n');
        if (forwardWindow.includes('.catch(') || forwardWindow.includes('.then(')) {
          continue;
        }

        // Only detect KNOWN async APIs to eliminate false positives on synchronous methods
        // 1. Prisma model queries/mutations (always return Promise)
        const floatingPrisma =
          /^(?:this\.)?prisma\.[a-zA-Z0-9_]+\.(?:create|update|delete|upsert|findMany|findUnique|deleteMany|updateMany)\s*\(/.test(
            trimmed
          );

        // 2. Database queries (always return Promise)
        const floatingDb =
          /^(?:this\.)?db\.(?:query|execute|insert|update|delete|transaction)\s*\(/.test(trimmed);

        // 3. Raw fetch(...) as an unawaited standalone statement
        const floatingFetch = /^fetch\s*\([^)]*\)\s*;?$/.test(trimmed);

        // 4. Calls to locally declared async functions
        let floatingLocalAsync = false;
        for (const fnName of localAsyncFunctions) {
          if (new RegExp(`^${fnName}\\s*\\(`).test(trimmed)) {
            floatingLocalAsync = true;
            break;
          }
        }

        if (floatingPrisma || floatingDb || floatingFetch || floatingLocalAsync) {
          findings.push({
            ruleId: 'CODE-007',
            category: 'CodeQuality',
            title: 'Floating, unawaited promise on known asynchronous operation',
            message:
              'Known asynchronous operation returns a Promise that is neither awaited nor handled with .catch() or void. In serverless and containerized runtimes, the runtime may terminate before the operation completes, losing mutations or leaking unhandled rejections.',
            filePath: file.path,
            line: i + 1,
            evidence: trimmed,
            confidence: 'HIGH',
            impact: 'HIGH',
            disposition: 'FIX',
            ruleClass: 'PROBABLE',
            suggestedFix:
              'Prepend with "await", use "void op().catch(...)" for fire-and-forget, or collect into a Promise.all() barrier.'
          });
        }
      }
    }

    return findings;
  }
};
