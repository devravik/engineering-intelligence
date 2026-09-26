import { ProviderAdapter, ProviderId, ProviderCapabilities, ProviderInstallResult } from './types.js';
import { AgyProviderAdapter } from './adapters/agy.js';
import { ClaudeProviderAdapter } from './adapters/claude.js';
import { CodexProviderAdapter } from './adapters/codex.js';

export * from './types.js';
export * from '../protocol/index.js';
export { AgyProviderAdapter } from './adapters/agy.js';
export { ClaudeProviderAdapter } from './adapters/claude.js';
export { CodexProviderAdapter } from './adapters/codex.js';
export { syncProviders } from './sync.js';

export const registeredProviders: ProviderAdapter[] = [
  new AgyProviderAdapter(),
  new ClaudeProviderAdapter(),
  new CodexProviderAdapter()
];

export function getProvider(id: ProviderId): ProviderAdapter | undefined {
  return registeredProviders.find(p => p.id === id);
}

export function getAllProviders(): ProviderAdapter[] {
  return registeredProviders;
}

export function detectAvailableProviders(
  repoRoot: string
): Array<{ provider: ProviderAdapter; capabilities: ProviderCapabilities }> {
  return registeredProviders.map(p => ({
    provider: p,
    capabilities: p.detect(repoRoot)
  }));
}

export function installProvider(
  providerId: ProviderId,
  repoRoot: string,
  options: { global?: boolean } = {}
): ProviderInstallResult {
  const provider = getProvider(providerId);
  if (!provider) {
    throw new Error(
      `Unsupported direct adapter for '${providerId}'. Use \`ei sync-providers\` to generate artifacts for all 16 providers.`
    );
  }
  return provider.install(repoRoot, options);
}

