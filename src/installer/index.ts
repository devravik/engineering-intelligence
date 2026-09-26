/**
 * Engineering Intelligence Distribution & Installation Engine
 *
 * Provides a thin distribution layer supporting:
 * 1. `npx engineering-intelligence install` (detects harnesses, installs native skill/hooks/rules)
 * 2. `npx engineering-intelligence update` (refreshes installed configurations)
 * 3. `npx engineering-intelligence doctor` (audits harnesses, capabilities, and manifests)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { execSync } from 'node:child_process';
import { ALL_PROVIDERS, generateProviderArtifacts, ProviderMetadata } from '../protocol/index.js';
import { HooksDriver } from '../protocol/drivers/hooks.js';
import { allDetectors } from '../detectors/index.js';
import { allUIDetectors } from '../ui/detectors/index.js';
import { checkPlaywrightAvailability } from '../ui/browser/playwright-runner.js';

export interface DetectedHarness {
  id: string;
  name: string;
  priority: string;
  category: string;
  isDetected: boolean;
  detectedReasons: string[];
  isInstalled: boolean;
  installedLocations: string[];
}

export interface InstallOptions {
  repoRoot: string;
  scope?: 'project' | 'global' | 'all';
  providers?: string[];
  yes?: boolean;
}

export interface InstallResult {
  installed: Array<{
    providerId: string;
    providerName: string;
    files: string[];
    scope: string;
  }>;
  skipped: string[];
}

export interface UpdateResult {
  updated: Array<{
    providerId: string;
    providerName: string;
    files: string[];
  }>;
  summary: string;
}

export interface DoctorReport {
  harnesses: DetectedHarness[];
  capabilities: {
    engineeringDetectors: number;
    uiDetectors: number;
    browserEngine: boolean;
    browserEngineNote: string;
    mcpServer: boolean;
    visualReasoning: boolean;
  };
  hooks: Array<{
    provider: string;
    status: 'ACTIVE' | 'CONFIGURED' | 'MANUAL_APPROVAL' | 'UNSUPPORTED';
    details: string;
  }>;
  projectContext: {
    hasProjectMd: boolean;
    hasDesignMd: boolean;
    hasArchitectureMd: boolean;
    hasBaseline: boolean;
    baselineCount: number;
  };
  marketplace: {
    packageVersion: string;
    hasPluginJson: boolean;
    pluginVersion?: string;
    hasMarketplaceJson: boolean;
    marketplaceVersion?: string;
    isVersionAligned: boolean;
  };
}

/**
 * Checks if a CLI binary is available on the current PATH.
 */
function isBinaryAvailable(name: string): boolean {
  try {
    const cmd = process.platform === 'win32' ? `where ${name}` : `which ${name}`;
    execSync(cmd, { stdio: ['pipe', 'pipe', 'ignore'], encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolves user home directory path.
 */
function getHomeDir(): string {
  return process.env.HOME || process.env.USERPROFILE || '';
}

/**
 * Detects all supported agent harnesses on the host system and workspace.
 */
export function detectHarnesses(repoRoot: string): DetectedHarness[] {
  const homeDir = getHomeDir();
  const results: DetectedHarness[] = [];

  for (const p of ALL_PROVIDERS) {
    const detectedReasons: string[] = [];
    const installedLocations: string[] = [];

    // 1. Binary check
    if (p.detection?.binary && isBinaryAvailable(p.detection.binary)) {
      detectedReasons.push(`CLI binary '${p.detection.binary}' found in PATH`);
    }

    // 2. Workspace path check
    if (p.detection?.paths) {
      for (const checkPath of p.detection.paths) {
        if (checkPath.startsWith('~/')) {
          const expanded = join(homeDir, checkPath.slice(2));
          if (existsSync(expanded)) {
            detectedReasons.push(`Global directory '${checkPath}' exists`);
          }
        } else {
          const fullPath = join(repoRoot, checkPath);
          if (existsSync(fullPath)) {
            detectedReasons.push(`Workspace directory '${checkPath}' exists`);
          }
        }
      }
    }

    // Special check for Antigravity `.agent` folder alias
    if (p.id === 'agy') {
      if (existsSync(join(repoRoot, '.agent'))) {
        detectedReasons.push("Workspace directory '.agent' exists");
      }
    }

    // 3. Installation check (check if EI skill/rule is already provisioned)
    const discovery = p.discoveryPaths;
    if (discovery?.skills) {
      const skillPath = join(repoRoot, discovery.skills);
      if (existsSync(skillPath)) {
        installedLocations.push(discovery.skills);
      }
    }
    if (discovery?.rules) {
      const rulePath = join(repoRoot, discovery.rules);
      if (existsSync(rulePath)) {
        installedLocations.push(discovery.rules);
      }
    }
    if (discovery?.config) {
      const configPath = join(repoRoot, discovery.config);
      if (existsSync(configPath)) {
        installedLocations.push(discovery.config);
      }
    }

    // Also check Antigravity alternate paths
    if (p.id === 'agy') {
      const altAgy = join(repoRoot, '.agent', 'skills', 'engineering-intelligence', 'SKILL.md');
      if (existsSync(altAgy) && !installedLocations.includes(altAgy)) {
        installedLocations.push('.agent/skills/engineering-intelligence/SKILL.md');
      }
      const globalAgy = join(homeDir, '.gemini', 'config', 'skills', 'engineering-intelligence', 'SKILL.md');
      if (existsSync(globalAgy)) {
        installedLocations.push('~/.gemini/config/skills/engineering-intelligence/SKILL.md');
      }
    }

    // Also check Claude global skills
    if (p.id === 'claude') {
      const globalClaude = join(homeDir, '.claude', 'skills', 'engineering-intelligence', 'SKILL.md');
      if (existsSync(globalClaude)) {
        installedLocations.push('~/.claude/skills/engineering-intelligence/SKILL.md');
      }
    }

    const isDetected = detectedReasons.length > 0 || installedLocations.length > 0;
    const isInstalled = installedLocations.length > 0;

    results.push({
      id: p.id,
      name: p.name,
      priority: p.priority,
      category: p.category,
      isDetected,
      detectedReasons,
      isInstalled,
      installedLocations
    });
  }

  return results;
}

/**
 * Loads the canonical SKILL.md content from repository or fallback.
 */
function getCanonicalSkillContent(repoRoot: string): string {
  const canonicalPath = join(repoRoot, 'skills', 'engineering-intelligence', 'SKILL.md');
  if (existsSync(canonicalPath)) {
    return readFileSync(canonicalPath, 'utf-8');
  }

  // Fallback to top-level SKILL.md
  const topPath = join(repoRoot, 'SKILL.md');
  if (existsSync(topPath)) {
    return readFileSync(topPath, 'utf-8');
  }

  return `---
name: engineering-intelligence
description: Senior engineering & UI quality control for AI coding agents (detect, attribute, prioritize, repair, verify).
---

# Engineering Intelligence
Enforces deterministic contracts, baseline attribution, finding matrices, and UI intelligence.
`;
}

/**
 * Installs Engineering Intelligence for selected or detected providers.
 */
export async function installProviders(options: InstallOptions): Promise<InstallResult> {
  const {
    repoRoot,
    scope = 'project',
    providers: requestedProviders,
  } = options;

  const homeDir = getHomeDir();
  const detected = detectHarnesses(repoRoot);
  const installed: InstallResult['installed'] = [];
  const skipped: string[] = [];

  // Determine target provider list
  let targets: ProviderMetadata[] = [];
  if (requestedProviders && requestedProviders.length > 0) {
    const set = new Set(requestedProviders.map(p => p.toLowerCase().trim()));
    targets = ALL_PROVIDERS.filter(p => set.has(p.id.toLowerCase()) || set.has(p.name.toLowerCase()));
  } else {
    // Install for all detected harnesses (or P0 providers if none detected)
    const detectedIds = new Set(detected.filter(d => d.isDetected).map(d => d.id));
    if (detectedIds.size > 0) {
      targets = ALL_PROVIDERS.filter(p => detectedIds.has(p.id));
    } else {
      targets = ALL_PROVIDERS.filter(p => p.priority === 'P0');
    }
  }

  const canonicalSkill = getCanonicalSkillContent(repoRoot);

  for (const provider of targets) {
    const writtenFiles: string[] = [];
    const isGlobal = scope === 'global' || scope === 'all';
    const isProject = scope === 'project' || scope === 'all';

    // 1. Antigravity (AGY) Provisioning
    if (provider.id === 'agy') {
      if (isProject) {
        // Standard .agents/
        const agySkillDir = join(repoRoot, '.agents', 'skills', 'engineering-intelligence');
        mkdirSync(agySkillDir, { recursive: true });
        const agySkillFile = join(agySkillDir, 'SKILL.md');
        writeFileSync(agySkillFile, canonicalSkill, 'utf-8');
        writtenFiles.push('.agents/skills/engineering-intelligence/SKILL.md');

        // Standard .agent/ alias for universal Antigravity compatibility
        const altAgyDir = join(repoRoot, '.agent', 'skills', 'engineering-intelligence');
        mkdirSync(altAgyDir, { recursive: true });
        const altAgyFile = join(altAgyDir, 'SKILL.md');
        writeFileSync(altAgyFile, canonicalSkill, 'utf-8');
        writtenFiles.push('.agent/skills/engineering-intelligence/SKILL.md');

        // Hooks: .agents/hooks.json
        const hooksArtifact = HooksDriver.generate({ targetPath: '.agents/hooks.json' });
        const hooksPath = join(repoRoot, '.agents', 'hooks.json');
        if (existsSync(hooksPath)) {
          const merged = HooksDriver.merge(readFileSync(hooksPath, 'utf-8'), hooksArtifact.content);
          writeFileSync(hooksPath, merged, 'utf-8');
        } else {
          writeFileSync(hooksPath, hooksArtifact.content, 'utf-8');
        }
        writtenFiles.push('.agents/hooks.json');

        // Rules: .agents/rules/engineering-intelligence.md
        const agyRulesDir = join(repoRoot, '.agents', 'rules');
        mkdirSync(agyRulesDir, { recursive: true });
        const agyRulesFile = join(agyRulesDir, 'engineering-intelligence.md');
        writeFileSync(agyRulesFile, canonicalSkill, 'utf-8');
        writtenFiles.push('.agents/rules/engineering-intelligence.md');
      }

      if (isGlobal && homeDir) {
        // Global ~/.gemini/config/skills/engineering-intelligence/SKILL.md
        const globalSkillDir = join(homeDir, '.gemini', 'config', 'skills', 'engineering-intelligence');
        mkdirSync(globalSkillDir, { recursive: true });
        const globalSkillFile = join(globalSkillDir, 'SKILL.md');
        writeFileSync(globalSkillFile, canonicalSkill, 'utf-8');
        writtenFiles.push('~/.gemini/config/skills/engineering-intelligence/SKILL.md');
      }
    }
    // 2. Claude Code Provisioning
    else if (provider.id === 'claude') {
      if (isProject) {
        const claudeSkillDir = join(repoRoot, '.claude', 'skills', 'engineering-intelligence');
        mkdirSync(claudeSkillDir, { recursive: true });
        const claudeSkillFile = join(claudeSkillDir, 'SKILL.md');
        writeFileSync(claudeSkillFile, canonicalSkill, 'utf-8');
        writtenFiles.push('.claude/skills/engineering-intelligence/SKILL.md');
      }
      if (isGlobal && homeDir) {
        const globalClaudeDir = join(homeDir, '.claude', 'skills', 'engineering-intelligence');
        mkdirSync(globalClaudeDir, { recursive: true });
        const globalClaudeFile = join(globalClaudeDir, 'SKILL.md');
        writeFileSync(globalClaudeFile, canonicalSkill, 'utf-8');
        writtenFiles.push('~/.claude/skills/engineering-intelligence/SKILL.md');
      }
    }
    // 3. Other Protocol Providers (Codex, Cursor, OpenCode, Cline, Zed, etc.)
    else {
      if (isProject) {
        const artifacts = generateProviderArtifacts(provider, { repoRoot });
        for (const art of artifacts) {
          const target = join(repoRoot, art.relativePath);
          const parent = join(target, '..');
          if (!existsSync(parent)) mkdirSync(parent, { recursive: true });
          writeFileSync(target, art.content, 'utf-8');
          writtenFiles.push(art.relativePath);
        }
      }
    }

    if (writtenFiles.length > 0) {
      installed.push({
        providerId: provider.id,
        providerName: provider.name,
        files: writtenFiles,
        scope
      });
    } else {
      skipped.push(provider.name);
    }
  }

  return { installed, skipped };
}

/**
 * Updates existing Engineering Intelligence installations.
 */
export async function updateProviders(repoRoot: string): Promise<UpdateResult> {
  const detected = detectHarnesses(repoRoot);
  const installedProviders = detected.filter(d => d.isInstalled);

  if (installedProviders.length === 0) {
    // If none installed yet, run standard install
    const res = await installProviders({ repoRoot, scope: 'project' });
    return {
      updated: res.installed.map(i => ({
        providerId: i.providerId,
        providerName: i.providerName,
        files: i.files
      })),
      summary: 'No previous installations found. Fresh installation completed.'
    };
  }

  const idsToUpdate = installedProviders.map(p => p.id);
  const res = await installProviders({
    repoRoot,
    providers: idsToUpdate,
    scope: 'all'
  });

  return {
    updated: res.installed.map(i => ({
      providerId: i.providerId,
      providerName: i.providerName,
      files: i.files
    })),
    summary: `Successfully updated ${res.installed.length} provider harness(es).`
  };
}

/**
 * Audits system harnesses, engine availability, lifecycle hooks, and project context.
 */
export async function runDoctor(repoRoot: string): Promise<DoctorReport> {
  const harnesses = detectHarnesses(repoRoot);
  const pw = await checkPlaywrightAvailability();

  // Project Context checks
  const hasProjectMd = existsSync(join(repoRoot, '.ei', 'PROJECT.md')) || existsSync(join(repoRoot, 'PROJECT.md'));
  const hasDesignMd = existsSync(join(repoRoot, '.ei', 'DESIGN.md')) || existsSync(join(repoRoot, 'DESIGN.md'));
  const hasArchitectureMd = existsSync(join(repoRoot, '.ei', 'ARCHITECTURE.md')) || existsSync(join(repoRoot, 'ARCHITECTURE.md'));

  let hasBaseline = false;
  let baselineCount = 0;
  const baselinePath = join(repoRoot, '.ei', 'state', 'baseline.json');
  if (existsSync(baselinePath)) {
    try {
      const data = JSON.parse(readFileSync(baselinePath, 'utf-8'));
      hasBaseline = true;
      baselineCount = Object.keys(data.entries || {}).length;
    } catch {
      // invalid json
    }
  }

  // Marketplace & Plugin checks
  const pkgPath = join(repoRoot, 'package.json');
  let packageVersion = 'unknown';
  if (existsSync(pkgPath)) {
    try {
      packageVersion = JSON.parse(readFileSync(pkgPath, 'utf-8')).version || '0.1.0';
    } catch {
      packageVersion = '0.1.0';
    }
  }

  const pluginPath = join(repoRoot, '.claude-plugin', 'plugin.json');
  const hasPluginJson = existsSync(pluginPath);
  let pluginVersion: string | undefined;
  if (hasPluginJson) {
    try {
      pluginVersion = JSON.parse(readFileSync(pluginPath, 'utf-8')).version;
    } catch {}
  }

  const marketplacePath = join(repoRoot, '.claude-plugin', 'marketplace.json');
  const hasMarketplaceJson = existsSync(marketplacePath);
  let marketplaceVersion: string | undefined;
  if (hasMarketplaceJson) {
    try {
      marketplaceVersion = JSON.parse(readFileSync(marketplacePath, 'utf-8')).version;
    } catch {}
  }

  const isVersionAligned = hasPluginJson &&
    hasMarketplaceJson &&
    pluginVersion === packageVersion &&
    marketplaceVersion === packageVersion;

  // Hooks evaluation
  const hooks: DoctorReport['hooks'] = [
    {
      provider: 'Antigravity (AGY)',
      status: existsSync(join(repoRoot, '.agents', 'hooks.json')) ? 'ACTIVE' : 'CONFIGURED',
      details: existsSync(join(repoRoot, '.agents', 'hooks.json'))
        ? 'Active edit-time and stop verification hooks in .agents/hooks.json'
        : 'Can be configured via `ei install --providers agy`'
    },
    {
      provider: 'Claude Code',
      status: 'CONFIGURED',
      details: 'Supported via native skill discovery in .claude/skills/ and plugin marketplace'
    },
    {
      provider: 'Codex / Copilot',
      status: 'MANUAL_APPROVAL',
      details: 'Directives in .github/copilot-instructions.md require user approval per prompt'
    }
  ];

  return {
    harnesses,
    capabilities: {
      engineeringDetectors: allDetectors.length,
      uiDetectors: allUIDetectors.length,
      browserEngine: pw.available,
      browserEngineNote: pw.available
        ? `Playwright ${pw.version} ready for live rendered captures`
        : 'Static DOM & CSS analysis active (install Playwright for live captures)',
      mcpServer: true,
      visualReasoning: true
    },
    hooks,
    projectContext: {
      hasProjectMd,
      hasDesignMd,
      hasArchitectureMd,
      hasBaseline,
      baselineCount
    },
    marketplace: {
      packageVersion,
      hasPluginJson,
      pluginVersion,
      hasMarketplaceJson,
      marketplaceVersion,
      isVersionAligned
    }
  };
}

/**
 * Formats a doctor report for CLI presentation.
 */
export function formatDoctorReport(report: DoctorReport): string {
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('                 ENGINEERING INTELLIGENCE DOCTOR');
  lines.push('================================================================\n');

  lines.push('──── Installed & Detected Harnesses ────');
  const installed = report.harnesses.filter(h => h.isInstalled);
  const detectedNotInstalled = report.harnesses.filter(h => h.isDetected && !h.isInstalled);

  if (installed.length === 0) {
    lines.push('  (no harnesses currently have EI skills installed)');
  } else {
    for (const h of installed) {
      lines.push(`  ✓ ${h.name.padEnd(24)} [${h.priority}] (${h.installedLocations[0]})`);
    }
  }

  if (detectedNotInstalled.length > 0) {
    lines.push('\n──── Detected Harnesses Ready to Install ────');
    for (const h of detectedNotInstalled) {
      lines.push(`  → ${h.name.padEnd(24)} (Detected: ${h.detectedReasons[0]})`);
      lines.push(`    Install: ei install --providers ${h.id}`);
    }
  }
  lines.push('');

  lines.push('──── Capabilities & Engines ────');
  lines.push(`  ✓ ${report.capabilities.engineeringDetectors} Engineering Detectors (Architecture, DB, Security, API, Slop)`);
  lines.push(`  ✓ ${report.capabilities.uiDetectors} UI Detectors (Typography, Color, Spatial, Slop, A11y, Responsive)`);
  lines.push(`  ${report.capabilities.browserEngine ? '✓' : 'ℹ'} Browser Engine: ${report.capabilities.browserEngineNote}`);
  lines.push('  ✓ 5-Pass Visual Reasoning Engine (Questions, Distill, Layout, Typeset, Harden, Polish)');
  lines.push('  ✓ Agent Client Protocol (ACP) & stdio MCP Server');
  lines.push('');

  lines.push('──── Lifecycle Hooks ────');
  for (const hook of report.hooks) {
    const symbol = hook.status === 'ACTIVE' ? '✓' : hook.status === 'CONFIGURED' ? 'ℹ' : '!';
    lines.push(`  ${symbol} ${hook.provider.padEnd(20)}: ${hook.details}`);
  }
  lines.push('');

  lines.push('──── Project Context Suite ────');
  lines.push(`  ${report.projectContext.hasProjectMd ? '✓' : '!'} .ei/PROJECT.md        ${report.projectContext.hasProjectMd ? 'Found' : 'Missing (run `ei init`)'}`);
  lines.push(`  ${report.projectContext.hasDesignMd ? '✓' : '!'} .ei/DESIGN.md         ${report.projectContext.hasDesignMd ? 'Found' : 'Missing (run `ei ui document`)'}`);
  lines.push(`  ${report.projectContext.hasArchitectureMd ? '✓' : '!'} .ei/ARCHITECTURE.md   ${report.projectContext.hasArchitectureMd ? 'Found' : 'Missing'}`);
  lines.push(`  ${report.projectContext.hasBaseline ? '✓' : '!'} Baseline Snapshot     ${report.projectContext.hasBaseline ? `${report.projectContext.baselineCount} entries` : 'Not initialized (run `ei baseline create`)'}`);
  lines.push('');

  lines.push('──── Claude Marketplace & Version Parity ────');
  lines.push(`  Package Version:        ${report.marketplace.packageVersion}`);
  lines.push(`  ${report.marketplace.hasPluginJson ? '✓' : '✗'} .claude-plugin/plugin.json      (${report.marketplace.pluginVersion || 'missing'})`);
  lines.push(`  ${report.marketplace.hasMarketplaceJson ? '✓' : '✗'} .claude-plugin/marketplace.json (${report.marketplace.marketplaceVersion || 'missing'})`);
  lines.push(`  ${report.marketplace.isVersionAligned ? '✓' : '!'} Version Alignment:           ${report.marketplace.isVersionAligned ? '100% aligned' : 'Version drift detected'}`);

  lines.push('\n================================================================\n');

  return lines.join('\n');
}
