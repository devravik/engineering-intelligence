import { test } from 'node:test';
import assert from 'node:assert';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const repoRoot = resolve(process.cwd());

test('CLI: ei --help outputs available command surface', () => {
  const output = execSync('npx tsx src/cli/index.ts help', {
    cwd: repoRoot,
    encoding: 'utf-8'
  });

  assert.match(output, /Engineering Intelligence CLI/);
  assert.match(output, /ei init/);
  assert.match(output, /ei detect/);
  assert.match(output, /ei review/);
  assert.match(output, /ei simplify/);
  assert.match(output, /ei impact/);
  assert.match(output, /ei ship/);
  assert.match(output, /ei baseline/);
  assert.match(output, /ei ignores/);
});

test('CLI: ei detect --json returns structured JSON with summary', () => {
  const output = execSync('npx tsx src/cli/index.ts detect --json', {
    cwd: repoRoot,
    encoding: 'utf-8'
  });

  const parsed = JSON.parse(output);
  assert.ok(Array.isArray(parsed.findings));
  assert.ok(typeof parsed.summary === 'object');
  assert.ok(typeof parsed.summary.blockers === 'number');
  assert.ok(typeof parsed.summary.fixCount === 'number');
});

test('CLI: ei impact outputs dependency graph tree', () => {
  const output = execSync('npx tsx src/cli/index.ts impact runDetectors', {
    cwd: repoRoot,
    encoding: 'utf-8'
  });

  assert.match(output, /IMPACT DEPENDENCY GRAPH: runDetectors/);
  assert.match(output, /CHANGE RISK:/);
});

test('CLI: ei sync-providers updates provider configurations', () => {
  const output = execSync('npx tsx src/cli/index.ts sync-providers', {
    cwd: repoRoot,
    encoding: 'utf-8'
  });

  assert.match(output, /Synchronizing provider configurations/);
  assert.match(output, /Synchronized Claude Code/);
  assert.match(output, /Synchronized Cursor/);
});
