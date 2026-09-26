import test from 'node:test';
import assert from 'node:assert';
import { existsSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  detectHarnesses,
  installProviders,
  updateProviders,
  runDoctor,
  formatDoctorReport
} from '../../src/installer/index.js';

const repoRoot = process.cwd();

test('Installer: detectHarnesses detects system and workspace agents', () => {
  const harnesses = detectHarnesses(repoRoot);
  assert.ok(Array.isArray(harnesses));
  assert.ok(harnesses.length >= 10);

  const agy = harnesses.find(h => h.id === 'agy');
  assert.ok(agy, 'Should include Antigravity CLI harness');

  const claude = harnesses.find(h => h.id === 'claude');
  assert.ok(claude, 'Should include Claude Code harness');
});

test('Installer: installProviders provisions native skills, hooks, and rules for AGY and Claude', async () => {
  const tempDir = join(repoRoot, 'dist', 'test-installer-workspace');
  if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });

  const res = await installProviders({
    repoRoot: tempDir,
    providers: ['agy', 'claude', 'cursor'],
    scope: 'project'
  });

  assert.strictEqual(res.installed.length, 3);

  // Check AGY provisioned files (both .agents/ and .agent/ aliases)
  assert.ok(existsSync(join(tempDir, '.agents', 'skills', 'engineering-intelligence', 'SKILL.md')));
  assert.ok(existsSync(join(tempDir, '.agent', 'skills', 'engineering-intelligence', 'SKILL.md')));
  assert.ok(existsSync(join(tempDir, '.agents', 'hooks.json')));
  assert.ok(existsSync(join(tempDir, '.agents', 'rules', 'engineering-intelligence.md')));

  // Check Claude provisioned files
  assert.ok(existsSync(join(tempDir, '.claude', 'skills', 'engineering-intelligence', 'SKILL.md')));

  // Check Cursor provisioned files
  assert.ok(existsSync(join(tempDir, '.cursor', 'rules', 'engineering-intelligence.mdc')));

  // Clean up
  rmSync(tempDir, { recursive: true, force: true });
});

test('Installer: updateProviders re-provisions installed harnesses', async () => {
  const tempDir = join(repoRoot, 'dist', 'test-updater-workspace');
  if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true });
  mkdirSync(tempDir, { recursive: true });

  // Initial install
  await installProviders({
    repoRoot: tempDir,
    providers: ['agy'],
    scope: 'project'
  });

  // Run update
  const updateRes = await updateProviders(tempDir);
  assert.ok(updateRes.updated.some(u => u.providerId === 'agy'));

  rmSync(tempDir, { recursive: true, force: true });
});

test('Installer: runDoctor generates comprehensive diagnostic report with version alignment', async () => {
  const report = await runDoctor(repoRoot);

  assert.ok(report.harnesses.length > 0);
  assert.ok(report.capabilities.engineeringDetectors >= 32);
  assert.ok(report.capabilities.uiDetectors >= 40);
  assert.strictEqual(report.capabilities.mcpServer, true);
  assert.strictEqual(report.capabilities.visualReasoning, true);

  // Marketplace & Version parity checks
  assert.strictEqual(report.marketplace.hasPluginJson, true);
  assert.strictEqual(report.marketplace.hasMarketplaceJson, true);
  assert.strictEqual(report.marketplace.isVersionAligned, true);
  assert.strictEqual(report.marketplace.packageVersion, report.marketplace.pluginVersion);
  assert.strictEqual(report.marketplace.packageVersion, report.marketplace.marketplaceVersion);

  const formatted = formatDoctorReport(report);
  assert.ok(formatted.includes('ENGINEERING INTELLIGENCE DOCTOR'));
  assert.ok(formatted.includes('Version Alignment:           100% aligned'));
});

test('Skills Ecosystem: canonical SKILL.md and references adhere to standard agent skills format', () => {
  const skillPath = join(repoRoot, 'skills', 'engineering-intelligence', 'SKILL.md');
  assert.ok(existsSync(skillPath), 'Canonical SKILL.md must exist in skills/engineering-intelligence/');

  const content = readFileSync(skillPath, 'utf-8');
  assert.match(content, /^---\nname:\s*engineering-intelligence\n/m);
  assert.match(content, /description:\s*.+/m);

  // References
  const refDetectors = join(repoRoot, 'skills', 'engineering-intelligence', 'references', 'detectors.md');
  const refCommands = join(repoRoot, 'skills', 'engineering-intelligence', 'references', 'commands.md');
  const refRestraint = join(repoRoot, 'skills', 'engineering-intelligence', 'references', 'restraint-doctrine.md');
  const scriptVerify = join(repoRoot, 'skills', 'engineering-intelligence', 'scripts', 'verify.sh');

  assert.ok(existsSync(refDetectors), 'references/detectors.md must exist');
  assert.ok(existsSync(refCommands), 'references/commands.md must exist');
  assert.ok(existsSync(refRestraint), 'references/restraint-doctrine.md must exist');
  assert.ok(existsSync(scriptVerify), 'scripts/verify.sh must exist');
});

test('Claude Plugin & Marketplace: manifests are valid and version-locked with package.json', () => {
  const pkg = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf-8'));
  const plugin = JSON.parse(readFileSync(join(repoRoot, '.claude-plugin', 'plugin.json'), 'utf-8'));
  const marketplace = JSON.parse(readFileSync(join(repoRoot, '.claude-plugin', 'marketplace.json'), 'utf-8'));

  assert.strictEqual(plugin.name, 'engineering-intelligence');
  assert.strictEqual(plugin.version, pkg.version, 'Plugin version must match package.json version');
  assert.ok(typeof plugin.skills === 'string' || Array.isArray(plugin.skills));
  assert.ok(typeof plugin.commands === 'string' || Array.isArray(plugin.commands));

  const marketplacePlugin = marketplace.plugins[0];
  assert.strictEqual(marketplacePlugin.name, 'engineering-intelligence');
  assert.strictEqual(marketplacePlugin.version, pkg.version);
});
