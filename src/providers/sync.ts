import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { allDetectors } from '../detectors/index.js';
import { AgyProviderAdapter } from './adapters/agy.js';
import { ClaudeProviderAdapter } from './adapters/claude.js';
import { CodexProviderAdapter } from './adapters/codex.js';

export interface SyncOptions {
  repoRoot: string;
  installToWorkspace?: boolean;
}

export function syncProviders(options: SyncOptions): { providersUpdated: string[] } {
  const { repoRoot, installToWorkspace = false } = options;
  const updated: string[] = [];

  const agyAdapter = new AgyProviderAdapter();
  const claudeAdapter = new ClaudeProviderAdapter();
  const codexAdapter = new CodexProviderAdapter();

  const detectorSummary = allDetectors
    .map(d => `- **${d.id}** (${d.category}): ${d.description}`)
    .join('\n');

  // 1. Antigravity CLI (AGY) - First-Class Provider
  const agyArtifacts = agyAdapter.generateArtifacts(repoRoot);
  for (const artifact of agyArtifacts) {
    // Write to providers/agy/
    const agyRelPath = artifact.relativePath.replace(/^\.agents\//, '');
    const targetAgy = join(repoRoot, 'providers', 'agy', agyRelPath);
    const dirAgy = join(targetAgy, '..');
    if (!existsSync(dirAgy)) mkdirSync(dirAgy, { recursive: true });
    writeFileSync(targetAgy, artifact.content, 'utf-8');

    // Also mirror to providers/antigravity/ for legacy discovery compatibility
    const targetAntigravity = join(repoRoot, 'providers', 'antigravity', agyRelPath);
    const dirAntigravity = join(targetAntigravity, '..');
    if (!existsSync(dirAntigravity)) mkdirSync(dirAntigravity, { recursive: true });
    writeFileSync(targetAntigravity, artifact.content, 'utf-8');
  }

  // Write providers/agy/README.md
  const agyReadme = `# Antigravity CLI (AGY) Provider Adapter

First-class provider adapter for **Google Antigravity CLI (AGY)**.

Engineering Intelligence integrates natively with Antigravity CLI, delivering automated, deterministic engineering quality control without polluting or duplicating core reasoning logic.

---

## Adapter Specifications

The AGY provider adapter implements 8 native integration contracts:

### 1. Skill Installation & Discovery Format
* **Workspace Discovery:** Discovered natively under \`.agents/skills/engineering-intelligence/SKILL.md\`.
* **Global Discovery:** Discovered across all projects via \`~/.gemini/config/skills/engineering-intelligence/SKILL.md\`.
* **Progressive Disclosure:** Exposes YAML frontmatter (\`name: engineering-intelligence\`, \`description: ...\`) for efficient token usage, with progressive drill-downs into commands, deterministic rules, and disciplinary criteria.

### 2. Command Mappings
Routes AGY slash commands directly to deterministic \`ei\` subcommands:
* \`/review\` ➔ \`ei review\` (Matrix evaluation and mechanical disposition)
* \`/simplify\` ➔ \`ei simplify\` (8-step anti-entropy refactoring loop)
* \`/impact <target>\` ➔ \`ei impact <target>\` (Dependency tree and blast radius analysis)
* \`/ship\` ➔ \`ei ship\` (10-point release gate verification)
* \`/detect\` ➔ \`ei detect\` (12-discipline deterministic rule execution)
* \`/init\` ➔ \`ei init\` (Context suite initialization)
* \`/baseline\` ➔ \`ei baseline\` (Legacy debt reconciliation)
* \`/ignores\` ➔ \`ei ignores\` (Waiver management with mandatory rationale)

### 3. Context & Project Initialization
* Initializes \`.ei/\` context suite (\`PROJECT.md\`, \`ARCHITECTURE.md\`, \`CONVENTIONS.md\`, \`DECISIONS.md\`, \`constraints.md\`).
* Cross-links \`.ei/\` context directly with \`.agents/rules/engineering-intelligence.md\` so AGY agents automatically ground decisions in repository memory.

### 4. Lifecycle Hook Integration (\`hooks.json\`)
Pre-configured lifecycle hooks in \`.agents/hooks.json\`:
* **\`PostToolUse\` Hook:** Triggers on \`replace_file_content\` and \`write_to_file\`. Runs \`ei detect --changed\` in background (15s timeout).
* **\`Stop\` Hook:** Triggers on session termination. Runs \`ei review\` (20s timeout) to ensure the final mechanical disposition is \`SHIP\`.
* **Non-Destructive Merge:** Merges safely with existing workspace \`hooks.json\` files without overwriting other hooks.

### 5. Agent Invocation Instructions
Direct instructions embedded in agent context instructing AGY agents to ground in \`.ei/\`, avoid speculative abstraction, and enforce \`UNKNOWN != PASS\`.

### 6. Output & Result Format
* Markdown discipline matrix with columns for Discipline, Evidence, Impact, Confidence, Attribution, and Terminal Disposition.
* Exact JSON finding schemas with SHA-256 evidence hashes.

### 7. Version & Capability Detection
* Detects AGY binary presence and version via \`agy --version\`.
* Evaluates capability matrix: \`supportsSkills\`, \`supportsHooks\`, \`supportsRules\`, \`supportsSlashCommands\`.

### 8. Safe Fallback Mode
* When the \`agy\` CLI binary is absent or hooks cannot run, automatically switches to fallback mode without crashing, guiding manual verification.

---

## Installation & Synchronization

\`\`\`bash
# Generate/synchronize AGY adapter artifacts into providers/agy/
ei sync-providers

# Install directly into current workspace (.agents/skills, .agents/hooks.json, .agents/rules)
ei sync-providers --install
\`\`\`
`;
  writeFileSync(join(repoRoot, 'providers', 'agy', 'README.md'), agyReadme, 'utf-8');
  updated.push('Antigravity CLI (AGY) (providers/agy/ & providers/antigravity/)');

  // 2. Claude Code Provider
  const claudeArtifacts = claudeAdapter.generateArtifacts(repoRoot);
  for (const artifact of claudeArtifacts) {
    const claudeRelPath = artifact.relativePath.replace(/^\.claude\//, '');
    const targetClaude = join(repoRoot, 'providers', 'claude', claudeRelPath);
    const dirClaude = join(targetClaude, '..');
    if (!existsSync(dirClaude)) mkdirSync(dirClaude, { recursive: true });
    writeFileSync(targetClaude, artifact.content, 'utf-8');
  }
  updated.push('Claude Code (providers/claude/SKILL.md)');

  // 3. GitHub Copilot & Codex Provider
  const codexArtifacts = codexAdapter.generateArtifacts(repoRoot);
  for (const artifact of codexArtifacts) {
    const codexRelPath = artifact.relativePath.replace(/^\.github\//, '');
    const targetCodex = join(repoRoot, 'providers', 'codex', codexRelPath);
    const dirCodex = join(targetCodex, '..');
    if (!existsSync(dirCodex)) mkdirSync(dirCodex, { recursive: true });
    writeFileSync(targetCodex, artifact.content, 'utf-8');
  }
  updated.push('GitHub Copilot / Codex (providers/codex/instructions.md)');

  // 4. Cursor Provider
  const cursorDir = join(repoRoot, 'providers', 'cursor');
  if (!existsSync(cursorDir)) mkdirSync(cursorDir, { recursive: true });
  const cursorRuleContent = `---
description: Engineering Quality Control for AI Coding Agents
globs: *
---

# Engineering Intelligence Rules (Auto-Generated)

Before modifying code or creating Pull Requests:
1. Always read .ei/PROJECT.md and .ei/ARCHITECTURE.md.
2. Run \`ei detect --changed\` to ensure compliance with deterministic contracts.
3. Obey findings matrix. Never commit code with derived BLOCK disposition.
4. UNKNOWN != PASS. Verify critical paths with tests.

## Active Deterministic Rules
${detectorSummary}
`;
  writeFileSync(join(cursorDir, 'engineering-intelligence.mdc'), cursorRuleContent, 'utf-8');
  updated.push('Cursor (providers/cursor/engineering-intelligence.mdc)');

  // 5. OpenCode Provider
  const openCodeDir = join(repoRoot, 'providers', 'opencode');
  if (!existsSync(openCodeDir)) mkdirSync(openCodeDir, { recursive: true });
  const openCodePlugin = {
    name: 'engineering-intelligence',
    version: '0.1.0',
    description: 'Engineering quality control plugin for OpenCode',
    commands: {
      review: 'ei review',
      simplify: 'ei simplify',
      impact: 'ei impact',
      ship: 'ei ship',
      detect: 'ei detect'
    },
    rules: allDetectors.map(d => ({ id: d.id, name: d.name, severity: d.severity }))
  };
  writeFileSync(join(openCodeDir, 'plugin.json'), JSON.stringify(openCodePlugin, null, 2), 'utf-8');
  updated.push('OpenCode (providers/opencode/plugin.json)');

  // Optional: Install to workspace roots if requested
  if (installToWorkspace) {
    agyAdapter.install(repoRoot);
    claudeAdapter.install(repoRoot);
    codexAdapter.install(repoRoot);
  }

  return { providersUpdated: updated };
}
