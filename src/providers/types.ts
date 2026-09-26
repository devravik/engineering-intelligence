export type ProviderId = 'agy' | 'claude' | 'codex' | 'cursor' | 'opencode';

export interface ProviderCapabilities {
  providerId: ProviderId;
  detected: boolean;
  version?: string;
  supportsSkills: boolean;
  supportsHooks: boolean;
  supportsRules: boolean;
  supportsSlashCommands: boolean;
  discoveryPaths: {
    skills?: string;
    hooks?: string;
    rules?: string;
    context?: string;
  };
  fallbackMode: boolean;
}

export interface ProviderArtifact {
  relativePath: string;
  content: string;
  description: string;
  isExecutable?: boolean;
}

export interface ProviderInstallResult {
  providerId: ProviderId;
  installedFiles: string[];
  capabilities: ProviderCapabilities;
  warnings: string[];
}

export interface ProviderAdapter {
  id: ProviderId;
  name: string;
  description: string;
  detect(repoRoot: string): ProviderCapabilities;
  generateArtifacts(repoRoot: string): ProviderArtifact[];
  install(repoRoot: string, options?: { global?: boolean }): ProviderInstallResult;
  getCommandMapping(): Record<string, string>;
  getAgentInstructions(): string;
  getOutputFormat?(): string;
  getSafeFallbackInstructions?(): string;
  initContext?(repoRoot: string): string[];
}

