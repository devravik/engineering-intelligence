import { test } from 'node:test';
import assert from 'node:assert';
import { resolve } from 'node:path';
import {
  AgyProviderAdapter,
  ClaudeProviderAdapter,
  CodexProviderAdapter,
  getProvider,
  registeredProviders
} from '../../src/providers/index.js';

const repoRoot = resolve(process.cwd());

test('Providers: registry contains first-class providers (AGY, Claude, Codex)', () => {
  const ids = registeredProviders.map(p => p.id);
  assert.ok(ids.includes('agy'));
  assert.ok(ids.includes('claude'));
  assert.ok(ids.includes('codex'));

  const agy = getProvider('agy');
  assert.ok(agy instanceof AgyProviderAdapter);
  assert.strictEqual(agy.name, 'Antigravity CLI (AGY)');
});

test('AGY Adapter: detects capabilities and generates hooks & skill artifacts', () => {
  const adapter = new AgyProviderAdapter();
  const caps = adapter.detect(repoRoot);

  assert.strictEqual(caps.providerId, 'agy');
  assert.strictEqual(caps.supportsSkills, true);
  assert.strictEqual(caps.supportsHooks, true);
  assert.strictEqual(caps.supportsRules, true);
  assert.strictEqual(caps.supportsSlashCommands, true);

  const artifacts = adapter.generateArtifacts(repoRoot);
  const relPaths = artifacts.map(a => a.relativePath);

  assert.ok(relPaths.includes('.agents/skills/engineering-intelligence/SKILL.md'));
  assert.ok(relPaths.includes('.agents/hooks.json'));
  assert.ok(relPaths.includes('.agents/rules/engineering-intelligence.md'));

  // Validate hooks.json structure
  const hooksArtifact = artifacts.find(a => a.relativePath === '.agents/hooks.json')!;
  const parsedHooks = JSON.parse(hooksArtifact.content);
  assert.ok(parsedHooks['ei-quality-guard']);
  assert.ok(Array.isArray(parsedHooks['ei-quality-guard'].PostToolUse));
  assert.ok(Array.isArray(parsedHooks['ei-quality-guard'].Stop));

  const mapping = adapter.getCommandMapping();
  assert.strictEqual(mapping['/review'], 'ei review');
  assert.strictEqual(mapping['/ship'], 'ei ship');
  assert.strictEqual(mapping['/baseline'], 'ei baseline');
  assert.strictEqual(mapping['/ignores'], 'ei ignores');

  // Validate output format & fallback instructions
  const outputFormat = adapter.getOutputFormat();
  assert.ok(outputFormat.includes('Discipline'));
  assert.ok(outputFormat.includes('UNKNOWN != PASS'));
  assert.ok(outputFormat.includes('evidenceHash'));

  const fallback = adapter.getSafeFallbackInstructions();
  assert.ok(fallback.includes('fallback mode'));
  assert.ok(fallback.includes('ei detect --changed'));

  const agentInstructions = adapter.getAgentInstructions();
  assert.ok(agentInstructions.includes('.agents/skills/engineering-intelligence/SKILL.md'));
  assert.ok(agentInstructions.includes('hooks.json'));
});


test('Claude Adapter: generates skill artifact and maps commands', () => {
  const adapter = new ClaudeProviderAdapter();
  const artifacts = adapter.generateArtifacts(repoRoot);
  assert.ok(artifacts.some(a => a.relativePath.includes('SKILL.md')));

  const mapping = adapter.getCommandMapping();
  assert.strictEqual(mapping['/review'], 'ei review');
});

test('Codex Adapter: generates copilot-instructions.md', () => {
  const adapter = new CodexProviderAdapter();
  const artifacts = adapter.generateArtifacts(repoRoot);
  assert.ok(artifacts.some(a => a.relativePath === '.github/copilot-instructions.md'));
});
