import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

// Benign singleton patterns that are legitimate at the module level
const BENIGN_MODULE_CONTAINERS = [
  /cache/i,
  /memo/i,
  /lru/i,
  /metric/i,
  /stat/i,
  /telemetry/i,
  /pool/i,
  /client/i,
  /init/i,
  /lock/i,
  /config/i,
  /schema/i,
  /registry/i
];

function isBenignModuleState(name: string): boolean {
  return BENIGN_MODULE_CONTAINERS.some(p => p.test(name));
}

// Request / tenant / user scoped state variables (High risk when kept at module level)
const SUSPICIOUS_STATE_NAMES = [
  /user/i,
  /session/i,
  /request/i,
  /tenant/i,
  /auth/i,
  /cart/i,
  /order/i,
  /customer/i,
  /account/i,
  /profile/i,
  /token/i
];

function isRequestScopedStateName(name: string): boolean {
  return SUSPICIOUS_STATE_NAMES.some(p => p.test(name));
}

export const arch005: Detector = {
  id: 'ARCH-005',
  name: 'shared-mutable-state',
  category: 'Architecture',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects module-level request-specific mutable state in server routes mutated across concurrent requests.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const lower = file.path.toLowerCase();
      const isTargetedFixture = Boolean(context.targetPath && file.path.includes(context.targetPath));
      const isServerHandler =
        (lower.includes('/api/') ||
          lower.includes('/routes/') ||
          lower.includes('/controllers/') ||
          lower.includes('route.ts') ||
          lower.includes('route.js')) &&
        (isTargetedFixture || (!lower.includes('/tests/') && !lower.includes('/fixtures/'))) &&
        !lower.includes('/detectors/');

      if (!isServerHandler) continue;

      // 1. Identify module-level mutable variables declared outside any function
      const mutableVars = new Map<string, { line: number; declaration: string; isRequestScoped: boolean }>();

      let inFunction = 0;

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        const openBraces = (line.match(/\{/g) || []).length;
        const closeBraces = (line.match(/\}/g) || []).length;

        if (inFunction === 0) {
          // Top-level 'let' declaration: let requestCounter = 0; let activeUser;
          const letMatch = line.match(/^(?:export\s+)?let\s+([A-Za-z0-9_]+)\b/);
          if (letMatch) {
            const varName = letMatch[1];
            // Skip benign init flags: let initialized = false; let isReady = false;
            if (!isBenignModuleState(varName)) {
              mutableVars.set(varName, {
                line: i + 1,
                declaration: line.trim(),
                isRequestScoped: isRequestScopedStateName(varName)
              });
            }
          }

          // Top-level mutable containers: const activeSessions = new Map(); const userStore = [];
          const containerMatch = line.match(
            /^(?:export\s+)?const\s+([A-Za-z0-9_]+)\s*=\s*(?:new\s+(?:Map|Set)\b|\[\]|\{\})/
          );
          if (containerMatch) {
            const varName = containerMatch[1];
            // If it's a known cache, metric, or registry, treat as legitimate unless named with request/user scope
            if (!isBenignModuleState(varName) || isRequestScopedStateName(varName)) {
              mutableVars.set(varName, {
                line: i + 1,
                declaration: line.trim(),
                isRequestScoped: isRequestScopedStateName(varName)
              });
            }
          }
        }

        inFunction = Math.max(0, inFunction + openBraces - closeBraces);
      }

      if (mutableVars.size === 0) continue;

      // 2. Scan request handler functions for mutations of these module-level variables
      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        for (const [varName, meta] of mutableVars.entries()) {
          if (i + 1 === meta.line) continue;

          // Check for mutation operations
          const mutationRegex = new RegExp(
            `\\b${varName}\\s*(?:\\+\\+|--|\\+=|-=|=(?!=)|\\.set\\(|\\.add\\(|\\.delete\\(|\\.push\\(|\\.shift\\(|\\.pop\\()`,
            'g'
          );

          if (mutationRegex.test(line)) {
            const isCriticalScope = meta.isRequestScoped;
            findings.push({
              ruleId: 'ARCH-005',
              category: 'Architecture',
              title: `Module-level shared mutable state '${varName}' mutated in server request handler`,
              message: `Variable '${varName}' is declared at module level (line ${meta.line}) and mutated inside a server request handler. In serverless and concurrent runtimes, this risks cross-tenant data leaks and race conditions.`,
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: isCriticalScope ? 'HIGH' : 'MEDIUM',
              impact: 'HIGH',
              disposition: isCriticalScope ? 'FIX' : 'REVIEW',
              ruleClass: 'PROBABLE',
              suggestedFix:
                'Store tenant/user-scoped data in external persistence (Redis/database) or pass scoped context through the request object.'
            });
            break;
          }
        }
      }
    }

    return findings;
  }
};
