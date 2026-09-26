import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { Finding, RawFinding, rawToFinding, computeEvidenceHash } from '../findings/types.js';

import { execSync } from 'node:child_process';

export interface BaselineEntry {
  ruleId: string;
  filePath: string;
  evidenceHash: string;
  firstSeen: string;
  category: string;
}

export interface BaselineState {
  version: string;
  createdAt: string;
  updatedAt: string;
  mergeBaseCommit?: string;
  entries: Record<string, BaselineEntry>; // keyed by evidenceHash
}

export function getGitMergeBase(repoRoot: string, targetRef: string = 'origin/main'): string | null {
  try {
    return execSync(`git merge-base ${targetRef} HEAD`, {
      cwd: repoRoot,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'ignore']
    }).trim();
  } catch {
    try {
      return execSync('git rev-parse HEAD~1', {
        cwd: repoRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore']
      }).trim();
    } catch {
      return null;
    }
  }
}

export function getBaselinePath(repoRoot: string): string {
  return join(repoRoot, '.ei', 'state', 'baseline.json');
}

export function loadBaseline(
  repoRoot: string,
  options: { dynamicMergeBase?: boolean; targetRef?: string } = {}
): BaselineState {
  const filePath = getBaselinePath(repoRoot);
  let mergeBaseCommit: string | undefined;

  if (options.dynamicMergeBase) {
    const mb = getGitMergeBase(repoRoot, options.targetRef);
    if (mb) mergeBaseCommit = mb;
  }

  if (!existsSync(filePath)) {
    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mergeBaseCommit,
      entries: {}
    };
  }
  try {
    const raw = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    if (mergeBaseCommit) {
      parsed.mergeBaseCommit = mergeBaseCommit;
    }
    return parsed;
  } catch {
    return {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      mergeBaseCommit,
      entries: {}
    };
  }
}


export function saveBaseline(repoRoot: string, baseline: BaselineState): void {
  const dir = join(repoRoot, '.ei', 'state');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  baseline.updatedAt = new Date().toISOString();
  writeFileSync(getBaselinePath(repoRoot), JSON.stringify(baseline, null, 2), 'utf-8');
}

export function createBaselineFromFindings(repoRoot: string, findings: RawFinding[]): BaselineState {
  const now = new Date().toISOString();
  const entries: Record<string, BaselineEntry> = {};

  for (const raw of findings) {
    const hash = computeEvidenceHash(raw.ruleId, raw.filePath, raw.evidence);
    entries[hash] = {
      ruleId: raw.ruleId,
      filePath: raw.filePath,
      evidenceHash: hash,
      firstSeen: now,
      category: raw.category
    };
  }

  const state: BaselineState = {
    version: '1.0.0',
    createdAt: now,
    updatedAt: now,
    entries
  };

  saveBaseline(repoRoot, state);
  return state;
}

export function attributeFindings(
  rawFindings: RawFinding[],
  baseline: BaselineState
): {
  activeFindings: Finding[];
  summary: {
    baselineCount: number;
    newCount: number;
    resolvedCount: number;
  };
} {
  const activeFindings: Finding[] = [];
  const currentHashes = new Set<string>();

  let newCount = 0;
  let baselineCount = 0;

  for (const raw of rawFindings) {
    const hash = computeEvidenceHash(raw.ruleId, raw.filePath, raw.evidence);
    currentHashes.add(hash);

    const isExisting = Boolean(baseline.entries[hash]);
    const status = isExisting ? 'BASELINE' : 'NEW';
    if (isExisting) {
      baselineCount++;
    } else {
      newCount++;
    }

    const finding = rawToFinding(raw, status);
    if (isExisting && baseline.entries[hash]) {
      finding.firstSeen = baseline.entries[hash].firstSeen;
    }
    activeFindings.push(finding);
  }

  // Count resolved baseline entries that are no longer detected
  let resolvedCount = 0;
  for (const baselineHash of Object.keys(baseline.entries)) {
    if (!currentHashes.has(baselineHash)) {
      resolvedCount++;
    }
  }

  return {
    activeFindings,
    summary: {
      baselineCount,
      newCount,
      resolvedCount
    }
  };
}
