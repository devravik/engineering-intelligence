import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  EIFinding,
  Finding,
  RawFinding,
  computeEvidenceHash,
  Attribution
} from '../findings/types.js';
import { FindingNormalizer } from '../findings/normalizer.js';
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

export function createBaselineFromFindings(
  repoRoot: string,
  findings: (RawFinding | EIFinding)[]
): BaselineState {
  const now = new Date().toISOString();
  const entries: Record<string, BaselineEntry> = {};

  const normalized = FindingNormalizer.normalizeBatch(findings);

  for (const f of normalized) {
    entries[f.evidence.hash] = {
      ruleId: f.ruleId,
      filePath: f.evidence.file,
      evidenceHash: f.evidence.hash,
      firstSeen: now,
      category: f.category
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
  findings: (RawFinding | EIFinding)[],
  baseline: BaselineState
): {
  activeFindings: EIFinding[];
  summary: {
    baselineCount: number;
    newCount: number;
    modifiedCount: number;
    resolvedCount: number;
    unknownCount: number;
  };
} {
  const normalized = FindingNormalizer.normalizeBatch(findings);
  const activeFindings: EIFinding[] = [];
  const currentHashes = new Set<string>();

  // Map of ruleId:filePath to baseline entries to detect MODIFIED findings
  const baselineByRuleAndFile = new Map<string, BaselineEntry>();
  for (const entry of Object.values(baseline.entries)) {
    baselineByRuleAndFile.set(`${entry.ruleId}:${entry.filePath}`, entry);
  }

  let baselineCount = 0;
  let newCount = 0;
  let modifiedCount = 0;
  let unknownCount = 0;

  for (const finding of normalized) {
    const hash = finding.evidence.hash;
    currentHashes.add(hash);

    const initialAttribution = finding.attribution;
    const exactMatch = baseline.entries[hash];
    if (exactMatch) {
      finding.attribution = 'BASELINE';
      finding.baselineStatus = 'BASELINE';
      finding.firstSeen = exactMatch.firstSeen;
      baselineCount++;
    } else {
      const ruleFileKey = `${finding.ruleId}:${finding.evidence.file}`;
      if (baselineByRuleAndFile.has(ruleFileKey)) {
        finding.attribution = 'MODIFIED';
        finding.baselineStatus = 'MODIFIED';
        finding.firstSeen = baselineByRuleAndFile.get(ruleFileKey)!.firstSeen;
        modifiedCount++;
      } else if (initialAttribution === 'UNKNOWN') {
        finding.attribution = 'UNKNOWN';
        finding.baselineStatus = 'UNKNOWN';
        unknownCount++;
      } else {
        finding.attribution = 'NEW';
        finding.baselineStatus = 'NEW';
        newCount++;
      }
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
      modifiedCount,
      resolvedCount,
      unknownCount
    }
  };
}
