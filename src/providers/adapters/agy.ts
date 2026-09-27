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

export class AgyProviderAdapter implements ProviderAdapter {
  id = 'agy' as const;
  name = 'Antigravity CLI (AGY)';
  description =
    'First-class adapter for Google Antigravity CLI (AGY) supporting skills, lifecycle hooks, rules, and progressive disclosure.';

  detect(repoRoot: string): ProviderCapabilities {
    let agyInstalled = false;
    let version: string | undefined;

    try {
      const res = spawnSync('agy', ['--version'], { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] });
      if (res.status === 0 && res.stdout) {
        agyInstalled = true;
        version = res.stdout.trim();
      }
    } catch {
      // AGY CLI binary not found in PATH
    }

    const homeDir = process.env.HOME || '';
    const hasGlobalConfig = existsSync(join(homeDir, '.gemini', 'config'));
    const hasWorkspaceAgents = existsSync(join(repoRoot, '.agents'));

    const detected = agyInstalled || hasGlobalConfig || hasWorkspaceAgents;

    return {
      providerId: 'agy',
      detected,
      version,
      supportsSkills: true,
      supportsHooks: true,
      supportsRules: true,
      supportsSlashCommands: true,
      discoveryPaths: {
        skills: '.agents/skills/engineering-intelligence/SKILL.md',
        hooks: '.agents/hooks.json',
        rules: '.agents/rules/engineering-intelligence.md',
        context: '.ei/'
      },
      fallbackMode: !agyInstalled
    };
  }

  generateArtifacts(repoRoot: string): ProviderArtifact[] {
    const canonicalSkillPath = join(repoRoot, 'skills', 'engineering-intelligence', 'SKILL.md');
    const baseSkill = existsSync(canonicalSkillPath)
      ? readFileSync(canonicalSkillPath, 'utf-8')
      : '';

    const detectorCatalog = allDetectors
      .map(d => `- **${d.id}** (${d.category}): ${d.description}`)
      .join('\n');

    // 1. Skill definition with YAML frontmatter for progressive disclosure
    const skillContent = `---
name: engineering-intelligence
description: Senior engineering quality control for Antigravity agents (detect, attribute, prioritize, repair, verify).
---

# Engineering Intelligence (AGY Active Skill)

You are operating with **Engineering Intelligence** enabled under Antigravity CLI.

${baseSkill}

## Active Deterministic Rules
${detectorCatalog}
`;

    // 2. Lifecycle hooks configuration (hooks.json)
    const hooksContent = JSON.stringify(
      {
        'ei-quality-guard': {
          enabled: true,
          PostToolUse: [
            {
              matcher: 'replace_file_content',
              hooks: [
                {
                  type: 'command',
                  command: 'ei detect --changed',
                  timeout: 15
                }
              ]
            },
            {
              matcher: 'write_to_file',
              hooks: [
                {
                  type: 'command',
                  command: 'ei detect --changed',
                  timeout: 15
                }
              ]
            }
          ],
          Stop: [
            {
              type: 'command',
              command: 'ei review',
              timeout: 20
            }
          ]
        }
      },
      null,
      2
    );

    // 3. AGY Workspace Rule
    const ruleContent = `# Engineering Intelligence Active Rule

Apply strict senior engineering quality control to all actions:
1. Always ground decisions in \`.ei/PROJECT.md\` and \`.ei/ARCHITECTURE.md\`.
2. Do not introduce single-implementation interfaces (ARCH-001) or pass-through factories (SLOP-001).
3. Do not swallow exceptions in empty catch blocks (API-002).
4. UNKNOWN != PASS. Verify claims with tests or concrete tool evidence.
`;

    return [
      {
        relativePath: '.agents/skills/engineering-intelligence/SKILL.md',
        content: skillContent,
        description: 'Antigravity on-demand progressive skill specification'
      },
      {
        relativePath: '.agents/hooks.json',
        content: hooksContent,
        description: 'AGY Lifecycle hooks for edit-time detection and Stop-time review'
      },
      {
        relativePath: '.agents/rules/engineering-intelligence.md',
        content: ruleContent,
        description: 'Hierarchical workspace rule enforced across all turns'
      }
    ];
  }

  install(repoRoot: string, options: { global?: boolean } = {}): ProviderInstallResult {
    const capabilities = this.detect(repoRoot);
    const warnings: string[] = [];
    const installedFiles: string[] = [];

    if (capabilities.fallbackMode) {
      warnings.push(
        'Antigravity CLI binary `agy` was not detected in PATH. Installing file artifacts in fallback mode; manual CLI execution may be required.'
      );
    }

    const homeDir = process.env.HOME || '';
    const baseDir = options.global
      ? join(homeDir, '.gemini', 'config')
      : repoRoot;

    const artifacts = this.generateArtifacts(repoRoot);

    for (const artifact of artifacts) {
      let targetPath = join(baseDir, artifact.relativePath);
      if (options.global) {
        // Map .agents/skills/... to skills/...
        const stripped = artifact.relativePath.replace(/^\.agents\//, '');
        targetPath = join(baseDir, stripped);
      }

      const dir = join(targetPath, '..');
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // If hooks.json already exists, merge safely
      if (artifact.relativePath.endsWith('hooks.json') && existsSync(targetPath)) {
        try {
          const existing = JSON.parse(readFileSync(targetPath, 'utf-8'));
          const incoming = JSON.parse(artifact.content);
          const merged = { ...existing, ...incoming };
          writeFileSync(targetPath, JSON.stringify(merged, null, 2), 'utf-8');
          installedFiles.push(targetPath);
          continue;
        } catch {
          // Overwrite if corrupt
        }
      }

      writeFileSync(targetPath, artifact.content, 'utf-8');
      installedFiles.push(targetPath);
    }

    return {
      providerId: 'agy',
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
      '/detect': 'ei detect',
      '/init': 'ei init',
      '/baseline': 'ei baseline',
      '/ignores': 'ei ignores'
    };
  }

  getAgentInstructions(): string {
    return [
      '### Antigravity (AGY) Integration Directives',
      '1. **Skill Discovery**: Antigravity discovers this skill under `.agents/skills/engineering-intelligence/SKILL.md` (workspace) or `~/.gemini/config/skills/engineering-intelligence/SKILL.md` (global).',
      '2. **Context Grounding**: Before editing code, read `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md` to respect architectural boundaries and invariants.',
      '3. **Lifecycle Hooks**: When modifying files (`write_to_file`, `replace_file_content`), AGY hooks automatically execute `ei detect --changed` via `.agents/hooks.json`.',
      '4. **Session Termination**: When concluding a session or PR, the AGY `Stop` hook runs `ei review` to ensure the final disposition is `SHIP`.',
      '5. **Invariant Check**: In accordance with `UNKNOWN != PASS`, verify all changed critical paths with concrete test execution.',
      '6. **Safe Fallback**: If AGY hooks are unavailable or running in fallback mode, manually run `ei detect --changed` after code changes and `ei review` before final answers.'
    ].join('\n');
  }

  getOutputFormat(): string {
    return [
      '### Engineering Intelligence Output Specification for Antigravity (AGY)',
      '',
      '#### 1. Machine-Derived Review Matrix (Markdown Table)',
      '```text',
      'Discipline      Evidence    Impact        Confidence    Disposition',
      '----------------------------------------------------------------',
      'Architecture    ✓           HIGH          HIGH          FIX',
      'Security        ✓           CRITICAL      HIGH          BLOCK',
      'Database        ✓           NONE          NONE          SHIP',
      'CodeQuality     ✓           LOW           HIGH          IGNORE',
      'Testing         ~           MEDIUM        MEDIUM        REVIEW',
      'Slop            ✓           HIGH          HIGH          FIX',
      '----------------------------------------------------------------',
      'ATTRIBUTION: Baseline: 42 | New: 2 | Resolved: 1',
      'FINAL DISPOSITION: BLOCK | FIX | REVIEW | IGNORE | SHIP',
      '```',
      '',
      '#### 2. JSON Finding Schema (`ei detect --json`)',
      '```json',
      '{',
      '  "ruleId": "API-001",',
      '  "category": "Security",',
      '  "file": "src/api/users.ts",',
      '  "line": 42,',
      '  "evidence": "export async function DELETE(req, db) { ... }",',
      '  "evidenceHash": "sha256:4a8b9f...",',
      '  "attribution": "NEW",',
      '  "confidence": "HIGH",',
      '  "disposition": "BLOCK",',
      '  "remediation": "Add authentication guard or session verification."',
      '}',
      '```',
      '',
      '#### 3. Invariants Enforced in Output',
      '- **UNKNOWN != PASS**: Any unverified critical path or un-run test returns disposition `BLOCK`.',
      '- **No Evidence != Clean**: Zero findings without verification must be flagged as `UNKNOWN` or unverified.',
      '- **Baseline Separation**: Legacy technical debt is flagged as `BASELINE` and never penalizes the active changeset.'
    ].join('\n');
  }

  getSafeFallbackInstructions(): string {
    return [
      '### Antigravity (AGY) Safe Fallback Directives',
      '',
      'When operating in fallback mode (e.g. `agy` binary not in PATH, or running in an environment where hook events are restricted):',
      '1. **Static Verification Protocol**: The agent must execute `ei detect --changed` manually whenever files are written or edited.',
      '2. **Pre-Completion Review**: The agent must invoke `ei review` before ending the turn or concluding the task.',
      '3. **No Automatic Waivers**: Fallback mode does not bypass waiver policy. Any rule bypass must still have a tracked waiver with `--reason` in `.ei/ignores.json`.',
      '4. **Preserved Core Rules**: Even without hook interception, all 24 deterministic detectors run identically via the local `ei` binary or node runtime.'
    ].join('\n');
  }

  initContext(repoRoot: string): string[] {
    const initialized: string[] = [];
    const agentsDir = join(repoRoot, '.agents');
    const skillsDir = join(agentsDir, 'skills', 'engineering-intelligence');
    const rulesDir = join(agentsDir, 'rules');

    for (const dir of [agentsDir, skillsDir, rulesDir]) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
        initialized.push(dir);
      }
    }

    const artifacts = this.generateArtifacts(repoRoot);
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

