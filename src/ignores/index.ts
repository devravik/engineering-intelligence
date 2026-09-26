import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { RawFinding } from '../findings/types.js';

export interface RuleIgnore {
  ruleId: string;
  reason: string;
  author?: string;
  date: string;
}

export interface FileIgnore {
  pattern: string;
  reason: string;
  author?: string;
  date: string;
}

export interface IgnoreConfig {
  rules: RuleIgnore[];
  files: FileIgnore[];
}

export function getIgnoresPath(repoRoot: string): string {
  return join(repoRoot, '.ei', 'ignores.json');
}

export function loadIgnores(repoRoot: string): IgnoreConfig {
  const filePath = getIgnoresPath(repoRoot);
  if (!existsSync(filePath)) {
    return { rules: [], files: [] };
  }
  try {
    const raw = readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { rules: [], files: [] };
  }
}

export function saveIgnores(repoRoot: string, config: IgnoreConfig): void {
  const dir = join(repoRoot, '.ei');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(getIgnoresPath(repoRoot), JSON.stringify(config, null, 2), 'utf-8');
}

export function addRuleIgnore(repoRoot: string, ruleId: string, reason: string, author?: string): void {
  if (!reason || reason.trim().length === 0) {
    throw new Error('A valid reason is strictly required when creating a rule waiver.');
  }
  const config = loadIgnores(repoRoot);
  // remove any existing waiver for this rule
  config.rules = config.rules.filter(r => r.ruleId !== ruleId);
  config.rules.push({
    ruleId,
    reason: reason.trim(),
    author: author || process.env.USER || 'developer',
    date: new Date().toISOString()
  });
  saveIgnores(repoRoot, config);
}

export function addFileIgnore(repoRoot: string, pattern: string, reason: string, author?: string): void {
  if (!reason || reason.trim().length === 0) {
    throw new Error('A valid reason is strictly required when creating a file waiver.');
  }
  const config = loadIgnores(repoRoot);
  config.files = config.files.filter(f => f.pattern !== pattern);
  config.files.push({
    pattern: pattern.trim(),
    reason: reason.trim(),
    author: author || process.env.USER || 'developer',
    date: new Date().toISOString()
  });
  saveIgnores(repoRoot, config);
}

function matchesPattern(filePath: string, pattern: string): boolean {
  if (pattern.endsWith('/**')) {
    const prefix = pattern.slice(0, -3);
    return filePath.startsWith(prefix);
  }
  if (pattern.startsWith('*.')) {
    const ext = pattern.slice(1);
    return filePath.endsWith(ext);
  }
  return filePath === pattern || filePath.includes(pattern);
}

export function checkIgnored(
  finding: RawFinding,
  config: IgnoreConfig,
  fileLines?: string[]
): { ignored: boolean; reason?: string } {
  // 1. Check rule-level waiver
  const ruleWaiver = config.rules.find(r => r.ruleId === finding.ruleId);
  if (ruleWaiver) {
    return { ignored: true, reason: `Rule waiver (${ruleWaiver.ruleId}): ${ruleWaiver.reason}` };
  }

  // 2. Check file-level waiver
  const fileWaiver = config.files.find(f => matchesPattern(finding.filePath, f.pattern));
  if (fileWaiver) {
    return { ignored: true, reason: `File waiver (${fileWaiver.pattern}): ${fileWaiver.reason}` };
  }

  // 3. Check inline comment waiver: // ei-disable-next-line RULE-ID -- reason
  if (fileLines && finding.line > 1) {
    const prevLine = fileLines[finding.line - 2]; // 0-indexed, line before finding
    if (prevLine && prevLine.includes('ei-disable-next-line')) {
      const match = prevLine.match(/ei-disable-next-line\s+([\w-]+)(?:\s+--\s+(.+))?/);
      if (match && match[1] === finding.ruleId) {
        const inlineReason = match[2]?.trim() || 'Inline comment disable';
        return { ignored: true, reason: inlineReason };
      }
    }
  }

  return { ignored: false };
}
