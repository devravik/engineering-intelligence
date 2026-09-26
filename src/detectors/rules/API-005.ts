import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

// Recognized custom clients or wrapper functions that manage timeouts centrally
const WRAPPER_OR_CLIENT_PATTERNS = [
  /\b(?:apiClient|httpClient|fetchWithTimeout|safeFetch|requestWithTimeout|axiosInstance|httpService)\b/,
  /\bfunction\s+(?:fetchWithTimeout|safeFetch|customFetch)\b/,
  /\bconst\s+(?:apiClient|httpClient|axiosInstance)\s*=/
];

export const api005: Detector = {
  id: 'API-005',
  name: 'unbounded-http-request',
  category: 'Architecture',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects outgoing raw HTTP requests executed without an explicit timeout, AbortSignal, or configured client wrapper.',

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

      // Check if file defines or imports a configured client wrapper
      const hasLocalWrapper = WRAPPER_OR_CLIENT_PATTERNS.some(p => p.test(file.content));

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // 1. Raw fetch(...) call
        const fetchMatch = line.match(/\b(?:await\s+)?fetch\s*\(([^)]*)\)/);
        if (fetchMatch) {
          // If the file itself is the implementation of a fetch wrapper (e.g. function fetchWithTimeout), don't flag the internal fetch call
          if (/function\s+fetchWithTimeout|const\s+fetchWithTimeout\s*=/.test(file.content) && file.path.includes('fetch')) {
            continue;
          }

          // Look forward 12 lines in case options object spans multiple lines
          const window = file.lines.slice(i, Math.min(i + 12, file.lines.length)).join('\n');

          const hasSignalOrTimeout =
            /signal\s*:|AbortSignal\b|timeout\s*:|AbortController\b/i.test(window);

          // Check if parent function signature accepts a signal parameter that might be passed through
          const parentFnWindow = file.lines.slice(Math.max(0, i - 10), i + 1).join('\n');
          const hasOuterSignalParam = /\bsignal\s*:\s*AbortSignal|\boptions\s*:\s*RequestInit/i.test(parentFnWindow);

          if (!hasSignalOrTimeout && !hasOuterSignalParam) {
            findings.push({
              ruleId: 'API-005',
              category: 'Architecture',
              title: 'Outgoing raw HTTP fetch request lacking timeout or AbortSignal',
              message:
                'Fetch call is executed without a timeout configuration, AbortSignal, or centralized HTTP client wrapper. Stalled upstream connections risk socket pool exhaustion and event-loop hang.',
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: hasLocalWrapper ? 'MEDIUM' : 'HIGH',
              impact: 'HIGH',
              disposition: 'FIX',
              ruleClass: 'PROBABLE',
              suggestedFix:
                'Provide AbortSignal.timeout(ms) or { signal: controller.signal }, or route through a configured client instance.'
            });
            continue;
          }
        }

        // 2. Raw axios.get/post/put/delete/request without timeout
        const axiosMatch = line.match(/\b(?:await\s+)?axios\.(?:get|post|put|patch|delete|request)\s*\(/);
        if (axiosMatch) {
          const window = file.lines.slice(i, Math.min(i + 10, file.lines.length)).join('\n');
          const hasTimeout = /timeout\s*:|signal\s*:/i.test(window);

          if (!hasTimeout) {
            findings.push({
              ruleId: 'API-005',
              category: 'Architecture',
              title: 'Outgoing Axios HTTP request lacking explicit timeout configuration',
              message:
                'Axios request is dispatched without an explicit timeout option. Unbounded requests risk cascading connection pool exhaustion during upstream latency spikes.',
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'HIGH',
              disposition: 'FIX',
              ruleClass: 'PROBABLE',
              suggestedFix: 'Configure an explicit timeout: { timeout: 5000 } or pass an AbortSignal.'
            });
          }
        }
      }
    }

    return findings;
  }
};
