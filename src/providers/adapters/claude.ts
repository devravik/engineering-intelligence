import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  ProviderAdapter,
  ProviderCapabilities,
  ProviderArtifact,
  ProviderInstallResult
} from '../types.js';
import { allDetectors } from '../../detectors/index.js';

export class ClaudeProviderAdapter implements ProviderAdapter {
  id = 'claude' as const;
  name = 'Claude Code';
  description = 'Provider adapter for Claude Code supporting project and global skills and slash commands.';

  detect(repoRoot: string): ProviderCapabilities {
    let claudeInstalled = false;
    let version: string | undefined;

    try {
      const res = spawnSync('claude', ['--version'], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      if (res.status === 0 && res.stdout) {
        claudeInstalled = true;
        version = res.stdout.trim();
      }
    } catch {
      // Claude binary not in PATH
    }

    const homeDir = process.env.HOME || '';
    const hasGlobalClaude = existsSync(join(homeDir, '.claude'));
    const hasProjectClaude = existsSync(join(repoRoot, '.claude'));

    const detected = claudeInstalled || hasGlobalClaude || hasProjectClaude;

    return {
      providerId: 'claude',
      detected,
      version,
      supportsSkills: true,
      supportsHooks: false,
      supportsRules: false,
      supportsSlashCommands: true,
      discoveryPaths: {
        skills: '.claude/skills/engineering-intelligence/SKILL.md',
        context: '.ei/'
      },
      fallbackMode: !claudeInstalled
    };
  }

  generateArtifacts(repoRoot: string): ProviderArtifact[] {
    const canonicalSkillPath = join(repoRoot, 'skills', 'engineering-intelligence', 'SKILL.md');
    const baseSkill = existsSync(canonicalSkillPath)
      ? readFileSync(canonicalSkillPath, 'utf-8').replace(/^---[\s\S]*?---\n*/, '')
      : '';

    const detectorCatalog = allDetectors
      .map(d => `- **${d.id}** (${d.category}): ${d.description}`)
      .join('\n');

    const skillContent = `---
name: engineering-intelligence
description: Engineering quality control for Claude Code (detect, attribute, prioritize, repair, verify).
---

# Engineering Intelligence (Claude Code Skill)

${baseSkill}

## Active Deterministic Rules
${detectorCatalog}
`;

    return [
      {
        relativePath: '.claude/skills/engineering-intelligence/SKILL.md',
        content: skillContent,
        description: 'Claude Code skill specification'
      }
    ];
  }

  install(repoRoot: string, options: { global?: boolean } = {}): ProviderInstallResult {
    const capabilities = this.detect(repoRoot);
    const warnings: string[] = [];
    const installedFiles: string[] = [];

    const homeDir = process.env.HOME || '';
    const baseDir = options.global ? join(homeDir, '.claude') : join(repoRoot, '.claude');

    const artifacts = this.generateArtifacts(repoRoot);

    for (const artifact of artifacts) {
      const stripped = artifact.relativePath.replace(/^\.claude\//, '');
      const targetPath = join(baseDir, stripped);
      const dir = join(targetPath, '..');

      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      writeFileSync(targetPath, artifact.content, 'utf-8');
      installedFiles.push(targetPath);
    }

    return {
      providerId: 'claude',
      installedFiles,
      capabilities,
      warnings
    };
  }

  getCommandMapping(): Record<string, string> {
    return {
      '/review': 'ei review',
      '/simplify': 'ei simplify',
      '/impact': 'ei impact',
      '/ship': 'ei ship',
      '/detect': 'ei detect'
    };
  }

  getAgentInstructions(): string {
    return 'Run `ei detect --changed` when modifying files, and execute `ei review` before concluding turns.';
  }

  getOutputFormat(): string {
    return 'Markdown discipline matrix with derived terminal disposition and file-level findings.';
  }

  getSafeFallbackInstructions(): string {
    return 'When Claude Code runs without local subshells, inspect deterministic findings via manual `ei detect` invocation.';
  }

  initContext(repoRoot: string): string[] {
    const claudeDir = join(repoRoot, '.claude', 'skills', 'engineering-intelligence');
    if (!existsSync(claudeDir)) mkdirSync(claudeDir, { recursive: true });
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

