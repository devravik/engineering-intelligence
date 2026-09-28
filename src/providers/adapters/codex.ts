import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ProviderAdapter,
  ProviderCapabilities,
  ProviderArtifact,
  ProviderInstallResult
} from '../types.js';
import { allDetectors } from '../../detectors/index.js';

export class CodexProviderAdapter implements ProviderAdapter {
  id = 'codex' as const;
  name = 'GitHub Copilot & Codex';
  description = 'Provider adapter for GitHub Copilot Workspace and Codex CLI via copilot-instructions.md.';

  detect(repoRoot: string): ProviderCapabilities {
    let copilotInstalled = false;

    try {
      const res = spawnSync('gh', ['copilot', '--version'], { stdio: ['pipe', 'pipe', 'ignore'] });
      copilotInstalled = res.status === 0;
    } catch {
      // gh copilot not installed
    }

    const hasGithubDir = existsSync(join(repoRoot, '.github'));
    const detected = copilotInstalled || hasGithubDir;

    return {
      providerId: 'codex',
      detected,
      supportsSkills: false,
      supportsHooks: false,
      supportsRules: true,
      supportsSlashCommands: false,
      discoveryPaths: {
        rules: '.github/copilot-instructions.md',
        context: '.ei/'
      },
      fallbackMode: !copilotInstalled
    };
  }

  generateArtifacts(repoRoot: string): ProviderArtifact[] {
    const detectorCatalog = allDetectors
      .map(d => `- **${d.id}** (${d.category}): ${d.description}`)
      .join('\n');

    const content = `# GitHub Copilot & Codex Instructions

## Installation and Trust

Engineering Intelligence uses the \`ei\` CLI from the official \`@devravik/engineering-intelligence\` package.

Official source:
https://github.com/devravik/engineering-intelligence

Install:
\`\`\`bash
npx -y @devravik/engineering-intelligence --version
\`\`\`
or install globally:
\`\`\`bash
npm install -g @devravik/engineering-intelligence
\`\`\`

Before relying on the CLI, verify:
\`\`\`bash
ei --version
\`\`\`
The expected publisher/package identity is:
\`@devravik/engineering-intelligence\`

Always run the \`ei\` executable provided by the official \`@devravik/engineering-intelligence\` package. Verify its version before execution.

## Core Rules

You must enforce Engineering Intelligence quality control across all code generation:
1. Consult \`.ei/PROJECT.md\` and \`.ei/ARCHITECTURE.md\` before introducing new patterns.
2. Run the verified \`ei\` executable (\`ei detect\`) to verify deterministic contracts before proposing edits.
3. Obey findings matrix. Do not generate code with derived BLOCK disposition.
4. UNKNOWN != PASS. Verify critical paths with tests.

## Active Deterministic Rules
${detectorCatalog}
`;

    return [
      {
        relativePath: '.github/copilot-instructions.md',
        content,
        description: 'GitHub Copilot / Codex persistent instructions'
      }
    ];
  }

  install(repoRoot: string): ProviderInstallResult {
    const capabilities = this.detect(repoRoot);
    const warnings: string[] = [];
    const installedFiles: string[] = [];

    const artifacts = this.generateArtifacts(repoRoot);

    for (const artifact of artifacts) {
      const targetPath = join(repoRoot, artifact.relativePath);
      const dir = join(targetPath, '..');

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(targetPath, artifact.content, 'utf-8');
      installedFiles.push(targetPath);
    }

    return {
      providerId: 'codex',
      installedFiles,
      capabilities,
      warnings
    };
  }

  getCommandMapping(): Record<string, string> {
    return {
      review: 'ei review',
      simplify: 'ei simplify',
      impact: 'ei impact',
      ship: 'ei ship'
    };
  }

  getAgentInstructions(): string {
    return 'Run `ei detect` before generating code, and execute `ei review` to verify changes.';
  }

  getOutputFormat(): string {
    return 'GitHub Copilot workspace instructions referencing Markdown discipline matrix and zero-blocker requirement.';
  }

  getSafeFallbackInstructions(): string {
    return 'When GitHub Copilot operates without CLI execution, instructions guide LLM directly via .github/copilot-instructions.md.';
  }

  initContext(repoRoot: string): string[] {
    const githubDir = join(repoRoot, '.github');
    if (!existsSync(githubDir)) mkdirSync(githubDir, { recursive: true });
    const artifacts = this.generateArtifacts(repoRoot);
    const initialized: string[] = [];
    for (const artifact of artifacts) {
      const target = join(repoRoot, artifact.relativePath);
      if (!existsSync(target)) {
        writeFileSync(target, artifact.content, 'utf-8');
        initialized.push(target);
      }
    }
    return initialized;
  }
}

