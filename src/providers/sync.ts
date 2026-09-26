import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { AgyProviderAdapter } from './adapters/agy.js';
import { ClaudeProviderAdapter } from './adapters/claude.js';
import { CodexProviderAdapter } from './adapters/codex.js';
import {
  ALL_PROVIDERS,
  generateProviderArtifacts,
  ProviderMetadata
} from '../protocol/index.js';

export interface SyncOptions {
  repoRoot: string;
  installToWorkspace?: boolean;
  priorityFilter?: string[];
  providerFilter?: string[];
}

export function syncProviders(options: SyncOptions): { providersUpdated: string[] } {
  const {
    repoRoot,
    installToWorkspace = false,
    priorityFilter,
    providerFilter
  } = options;

  const updated: string[] = [];

  const agyAdapter = new AgyProviderAdapter();
  const claudeAdapter = new ClaudeProviderAdapter();
  const codexAdapter = new CodexProviderAdapter();

  // Filter providers if specified
  let targets = ALL_PROVIDERS;
  if (priorityFilter && priorityFilter.length > 0) {
    targets = targets.filter(p => priorityFilter.includes(p.priority));
  }
  if (providerFilter && providerFilter.length > 0) {
    targets = targets.filter(p => providerFilter.includes(p.id));
  }

  // Iterate across all protocol-defined providers
  for (const provider of targets) {
    const providerDir = join(repoRoot, 'providers', provider.id);
    if (!existsSync(providerDir)) {
      mkdirSync(providerDir, { recursive: true });
    }

    // 1. Generate multi-channel artifacts from Standard Protocol Drivers
    const artifacts = generateProviderArtifacts(provider, { repoRoot });

    for (const artifact of artifacts) {
      // Determine destination inside providers/<id>/
      let rel = artifact.relativePath;
      // Strip leading dot-directory prefix (e.g. .agents/, .claude/, .github/) for provider folder
      rel = rel.replace(/^\.[a-zA-Z0-9_-]+\//, '');
      if (!rel || rel === '.' || rel.endsWith('/')) {
        rel = `${provider.id}.json`;
      }
      const targetFile = join(providerDir, rel);
      const parentDir = join(targetFile, '..');
      if (!existsSync(parentDir)) {
        mkdirSync(parentDir, { recursive: true });
      }
      writeFileSync(targetFile, artifact.content, 'utf-8');


      // If installToWorkspace is enabled, install directly to repository paths
      if (installToWorkspace) {
        const workspaceTarget = join(repoRoot, artifact.relativePath);
        const wsParent = join(workspaceTarget, '..');
        if (!existsSync(wsParent)) {
          mkdirSync(wsParent, { recursive: true });
        }
        writeFileSync(workspaceTarget, artifact.content, 'utf-8');
      }
    }

    // 2. Generate detailed providers/<id>/README.md
    const readmeContent = generateProviderReadme(provider);
    writeFileSync(join(providerDir, 'README.md'), readmeContent, 'utf-8');

    // Special case: maintain legacy providers/antigravity/ mirror for AGY
    if (provider.id === 'agy') {
      const antiDir = join(repoRoot, 'providers', 'antigravity');
      if (!existsSync(antiDir)) mkdirSync(antiDir, { recursive: true });
      for (const artifact of artifacts) {
        let rel = artifact.relativePath.replace(/^\.[a-zA-Z0-9_-]+\//, '');
        const targetFile = join(antiDir, rel);
        const parentDir = join(targetFile, '..');
        if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
        writeFileSync(targetFile, artifact.content, 'utf-8');
      }
      writeFileSync(join(antiDir, 'README.md'), readmeContent, 'utf-8');
    }

    updated.push(`${provider.name} [${provider.priority}] (providers/${provider.id}/)`);
  }

  // If installToWorkspace is requested, run first-class typed adapters as well
  if (installToWorkspace) {
    agyAdapter.install(repoRoot);
    claudeAdapter.install(repoRoot);
    codexAdapter.install(repoRoot);
  }

  return { providersUpdated: updated };
}

function generateProviderReadme(provider: ProviderMetadata): string {
  const channelList = provider.channels.map(c => `- **${c}**`).join('\n');
  const pathEntries = Object.entries(provider.discoveryPaths)
    .map(([k, v]) => `- **${k}**: \`${v}\``)
    .join('\n');

  return `# ${provider.name} Provider Integration

**Category:** ${provider.category.toUpperCase()} | **Tier:** ${provider.priority}

${provider.description}

---

## Ecosystem Notes
${provider.ecosystemNotes || 'Standard provider integration via Engineering Intelligence protocol.'}

## Supported Protocol Channels
${channelList}

## Discovery & Configuration Paths
${pathEntries}

---

## Installation & Synchronization

\`\`\`bash
# Synchronize provider artifacts from canonical core
ei sync-providers

# Install configuration directly into project workspace
ei sync-providers --install
\`\`\`
`;
}
