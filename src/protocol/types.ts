export type ProviderPriority = 'P0' | 'P1' | 'P2' | 'P3';

export type ProviderCategory = 'terminal' | 'ide' | 'autonomous';

export type ProtocolChannel = 'skills' | 'hooks' | 'ide_rules' | 'cli' | 'acp_mcp';

export interface ProviderMetadata {
  id: string;
  name: string;
  category: ProviderCategory;
  priority: ProviderPriority;
  channels: ProtocolChannel[];
  description: string;
  ecosystemNotes?: string;
  discoveryPaths: {
    skills?: string;
    hooks?: string;
    rules?: string;
    config?: string;
    mcp?: string;
  };
  detection: {
    binary?: string;
    paths?: string[];
  };
}

export interface GeneratedArtifact {
  relativePath: string;
  content: string;
  description: string;
  channel: ProtocolChannel;
}

export interface StandardProtocolConfig {
  repoRoot: string;
  enableDetectors?: boolean;
  activeDetectorsSummary?: string;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}
