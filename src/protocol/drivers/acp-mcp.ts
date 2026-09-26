import { GeneratedArtifact, McpToolDefinition } from '../types.js';

export const STANDARD_MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'ei_detect',
    description: 'Runs deterministic engineering quality control detectors on codebase files, reporting exact lines, evidence, and SHA-256 evidence hashes.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target directory or file to inspect. Defaults to current workspace.'
        },
        changed: {
          type: 'boolean',
          description: 'Only inspect files changed in active git working tree.'
        }
      }
    }
  },
  {
    name: 'ei_review',
    description: 'Generates structured discipline finding matrix and derives mechanical terminal disposition (BLOCK, FIX, REVIEW, IGNORE, SHIP). Enforces UNKNOWN != PASS.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Optional target path to review.'
        }
      }
    }
  },
  {
    name: 'ei_simplify',
    description: 'Executes the 8-step anti-entropy simplification loop to detect and eradicate unnecessary indirection and pass-through abstractions.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Target directory or file to simplify.'
        }
      }
    }
  },
  {
    name: 'ei_impact',
    description: 'Calculates the dependency graph and blast radius across APIs, background jobs, database schemas, and test suites for a given symbol or file.',
    inputSchema: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Symbol, function, class, or file to calculate impact for.'
        }
      },
      required: ['target']
    }
  },
  {
    name: 'ei_ship',
    description: 'Enforces the 10-point production readiness release gate. Verifies tests, migrations, authorization, and zero blocker issues.',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  }
];

export interface AcpMcpOptions {
  providerName: string;
  targetPath: string;
  format: 'zed' | 'generic_mcp' | 'openhands';
}

export class AcpMcpDriver {
  static getTools(): McpToolDefinition[] {
    return STANDARD_MCP_TOOLS;
  }

  static generate(options: AcpMcpOptions): GeneratedArtifact {
    const { providerName, targetPath, format } = options;

    if (format === 'zed') {
      const zedConfig = {
        context_servers: {
          'engineering-intelligence': {
            command: 'ei',
            args: ['mcp'],
            settings: {
              activeRules: 'all',
              enforceBlockers: true
            }
          }
        }
      };

      return {
        relativePath: targetPath,
        content: JSON.stringify(zedConfig, null, 2),
        description: `Zed editor Agent Client Protocol (ACP) & MCP server integration configuration`,
        channel: 'acp_mcp'
      };
    }

    if (format === 'openhands') {
      const openHandsConfig = {
        mcpServers: {
          'engineering-intelligence': {
            command: 'ei',
            args: ['mcp']
          }
        }
      };

      return {
        relativePath: targetPath,
        content: JSON.stringify(openHandsConfig, null, 2),
        description: `OpenHands autonomous agent MCP integration configuration`,
        channel: 'acp_mcp'
      };
    }

    // Generic MCP server configuration
    const mcpConfig = {
      mcpServers: {
        'engineering-intelligence': {
          command: 'ei',
          args: ['mcp'],
          env: {}
        }
      },
      tools: STANDARD_MCP_TOOLS.map(t => t.name)
    };

    return {
      relativePath: targetPath,
      content: JSON.stringify(mcpConfig, null, 2),
      description: `Model Context Protocol (MCP) server integration for ${providerName}`,
      channel: 'acp_mcp'
    };
  }
}
