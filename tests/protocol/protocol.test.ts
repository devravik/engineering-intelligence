import { test } from 'node:test';
import assert from 'node:assert';
import {
  ALL_PROVIDERS,
  getProviderMetadata,
  getProvidersByPriority,
  getProvidersByCategory,
  generateProviderArtifacts,
  SkillsDriver,
  HooksDriver,
  IdeRulesDriver,
  CliDriver,
  AcpMcpDriver,
  STANDARD_MCP_TOOLS
} from '../../src/protocol/index.js';

test('Protocol: registry contains 16 categorized providers across P0-P3 tiers', () => {
  assert.strictEqual(ALL_PROVIDERS.length, 16);

  const p0 = getProvidersByPriority('P0');
  const p1 = getProvidersByPriority('P1');
  const p2 = getProvidersByPriority('P2');
  const p3 = getProvidersByPriority('P3');

  assert.strictEqual(p0.length, 4); // AGY, Claude, Codex, OpenCode
  assert.strictEqual(p1.length, 5); // Cline, Kilo, Cursor, Gemini, Zed
  assert.strictEqual(p2.length, 5); // Aider, Copilot, Augment, Windsurf, Junie
  assert.strictEqual(p3.length, 2); // OpenHands, Devin

  const terminal = getProvidersByCategory('terminal');
  const ide = getProvidersByCategory('ide');
  const autonomous = getProvidersByCategory('autonomous');

  assert.strictEqual(terminal.length, 6);
  assert.strictEqual(ide.length, 8);
  assert.strictEqual(autonomous.length, 2);

});

test('Protocol Drivers: SkillsDriver generates valid markdown skill specification', () => {
  const artifact = SkillsDriver.generate({
    providerName: 'Cline',
    targetPath: '.cline/skills/engineering-intelligence/SKILL.md'
  });

  assert.strictEqual(artifact.channel, 'skills');
  assert.ok(artifact.content.includes('name: engineering-intelligence'));
  assert.ok(artifact.content.includes('UNKNOWN != PASS'));
  assert.ok(artifact.content.includes('/review'));
  assert.ok(artifact.content.includes('ARCH-001'));
});

test('Protocol Drivers: HooksDriver generates valid lifecycle hooks and merges safely', () => {
  const artifact = HooksDriver.generate({
    targetPath: '.agents/hooks.json'
  });

  assert.strictEqual(artifact.channel, 'hooks');
  const parsed = JSON.parse(artifact.content);
  assert.ok(parsed['ei-quality-guard']);
  assert.ok(Array.isArray(parsed['ei-quality-guard'].PostToolUse));

  // Test merging
  const existing = JSON.stringify({ customHook: { enabled: true } });
  const merged = JSON.parse(HooksDriver.merge(existing, artifact.content));
  assert.ok(merged.customHook);
  assert.ok(merged['ei-quality-guard']);
});

test('Protocol Drivers: IdeRulesDriver generates persistent rules for Cursor, Copilot, Windsurf', () => {
  const cursorMdc = IdeRulesDriver.generate({
    providerName: 'Cursor',
    targetPath: '.cursor/rules/engineering-intelligence.mdc',
    format: 'mdc'
  });
  assert.ok(cursorMdc.content.includes('globs: *'));
  assert.ok(cursorMdc.content.includes('UNKNOWN != PASS'));

  const windsurf = IdeRulesDriver.generate({
    providerName: 'Windsurf',
    targetPath: '.windsurfrules'
  });
  assert.ok(windsurf.content.includes('Engineering Intelligence Directives (Windsurf)'));
});

test('Protocol Drivers: CliDriver generates Aider and Gemini configurations', () => {
  const aider = CliDriver.generate({
    providerName: 'Aider',
    targetPath: '.aider.conf.yml',
    type: 'aider'
  });
  assert.ok(aider.content.includes('lint-cmd: ei detect --changed'));
  assert.ok(aider.content.includes('test-cmd: ei review'));

  const gemini = CliDriver.generate({
    providerName: 'Gemini CLI',
    targetPath: '.gemini/context.md',
    type: 'gemini'
  });
  assert.ok(gemini.content.includes('Gemini CLI Engineering Intelligence Context'));
});

test('Protocol Drivers: AcpMcpDriver provides standard 5 tools for Zed, Kilo, and OpenHands', () => {
  const tools = AcpMcpDriver.getTools();
  assert.strictEqual(tools.length, 5);

  const toolNames = tools.map(t => t.name);
  assert.ok(toolNames.includes('ei_detect'));
  assert.ok(toolNames.includes('ei_review'));
  assert.ok(toolNames.includes('ei_simplify'));
  assert.ok(toolNames.includes('ei_impact'));
  assert.ok(toolNames.includes('ei_ship'));

  const zedConfig = AcpMcpDriver.generate({
    providerName: 'Zed',
    targetPath: '.zed/settings.json',
    format: 'zed'
  });
  const parsedZed = JSON.parse(zedConfig.content);
  assert.ok(parsedZed.context_servers['engineering-intelligence']);
  assert.strictEqual(parsedZed.context_servers['engineering-intelligence'].command, 'ei');
});

test('Protocol: generateProviderArtifacts produces correct channels per provider', () => {
  const zed = getProviderMetadata('zed')!;
  const zedArtifacts = generateProviderArtifacts(zed);
  assert.ok(zedArtifacts.some(a => a.channel === 'skills'));
  assert.ok(zedArtifacts.some(a => a.channel === 'acp_mcp'));

  const cline = getProviderMetadata('cline')!;
  const clineArtifacts = generateProviderArtifacts(cline);
  assert.ok(clineArtifacts.some(a => a.channel === 'skills'));
  assert.ok(clineArtifacts.some(a => a.channel === 'ide_rules'));

  const openhands = getProviderMetadata('openhands')!;
  const openhandsArtifacts = generateProviderArtifacts(openhands);
  assert.ok(openhandsArtifacts.some(a => a.channel === 'acp_mcp'));
});
