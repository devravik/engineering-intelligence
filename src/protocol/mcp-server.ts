import readline from 'node:readline';
import { STANDARD_MCP_TOOLS } from './drivers/acp-mcp.js';
import { runDetectors } from '../detectors/index.js';
import {
  buildReviewMatrix,
  formatReviewMatrix,
  evaluateShipGate,
  formatShipGate
} from '../reviewer/index.js';
import { analyzeImpact } from '../impact/index.js';
import { Finding } from '../findings/types.js';

export function startMcpServer(repoRoot: string): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  function sendResponse(id: number | string | null, result: unknown, error?: unknown) {
    const payload: Record<string, unknown> = {
      jsonrpc: '2.0',
      id
    };
    if (error) {
      payload.error = error;
    } else {
      payload.result = result;
    }
    process.stdout.write(JSON.stringify(payload) + '\n');
  }

  rl.on('line', async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const msg = JSON.parse(trimmed);
      const { id, method, params } = msg;

      if (method === 'initialize') {
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'engineering-intelligence',
            version: '0.1.2'
          }
        });
        return;
      }

      if (method === 'notifications/initialized' || method === 'initialized') {
        // Notification, no response needed
        return;
      }

      if (method === 'tools/list') {
        sendResponse(id, {
          tools: STANDARD_MCP_TOOLS
        });
        return;
      }

      if (method === 'tools/call') {
        const toolName = params?.name;
        const args = params?.arguments || {};

        if (toolName === 'ei_detect') {
          const target = args.target;
          const result = await runDetectors(repoRoot, {
            targetSubpath: target,
            changedFilesOnly: Boolean(args.changed)
          });
          const text = JSON.stringify(result, null, 2);
          sendResponse(id, {
            content: [{ type: 'text', text }]
          });
          return;
        }

        if (toolName === 'ei_review') {
          const target = args.target;
          const result = await runDetectors(repoRoot, {
            targetSubpath: target,
            changedFilesOnly: true
          });
          const matrix = buildReviewMatrix(result.findings, {
            baselineCounts: {
              baseline: result.summary.baselineCount,
              new: result.summary.newCount,
              resolved: result.summary.resolvedCount
            }
          });
          const text = formatReviewMatrix(matrix, result.findings);
          sendResponse(id, {
            content: [{ type: 'text', text }]
          });
          return;
        }

        if (toolName === 'ei_impact') {
          const target = args.target || '';
          if (!target) {
            sendResponse(id, null, { code: -32602, message: 'Missing target argument' });
            return;
          }
          const graph = analyzeImpact(repoRoot, target);
          const text = JSON.stringify(graph, null, 2);
          sendResponse(id, {
            content: [{ type: 'text', text }]
          });
          return;
        }

        if (toolName === 'ei_simplify') {
          const target = args.target;
          const det = await runDetectors(repoRoot, { targetSubpath: target });
          const slopAndArch = det.findings.filter((f: Finding) =>
            f.ruleId.startsWith('SLOP') || f.ruleId.startsWith('ARCH') || f.ruleId.startsWith('CODE')
          );
          const text = JSON.stringify({ simplifications: slopAndArch }, null, 2);
          sendResponse(id, {
            content: [{ type: 'text', text }]
          });
          return;
        }

        if (toolName === 'ei_ship') {
          const det = await runDetectors(repoRoot, { changedFilesOnly: true });
          const matrix = buildReviewMatrix(det.findings, {
            baselineCounts: {
              baseline: det.summary.baselineCount,
              new: det.summary.newCount,
              resolved: det.summary.resolvedCount
            }
          });
          const gate = evaluateShipGate(matrix, det.findings);
          const text = formatShipGate(gate);
          sendResponse(id, {
            content: [{ type: 'text', text }]
          });
          return;
        }

        sendResponse(id, null, { code: -32601, message: `Tool not found: ${toolName}` });
        return;
      }

      if (id !== undefined) {
        sendResponse(id, null, { code: -32601, message: `Method not found: ${method}` });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      sendResponse(null, null, { code: -32700, message: `Parse error: ${errMsg}` });
    }
  });
}
