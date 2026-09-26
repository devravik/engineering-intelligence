import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { execSync } from 'node:child_process';
import { Detector, DetectorContext, FileEntry } from './types.js';
import { RawFinding, Finding } from '../findings/types.js';
import { loadIgnores, checkIgnored } from '../ignores/index.js';
import { loadBaseline, attributeFindings } from '../baseline/index.js';

// Architecture detectors
import { arch001 } from './rules/ARCH-001.js';
import { arch002 } from './rules/ARCH-002.js';
import { arch003 } from './rules/ARCH-003.js';
import { arch004 } from './rules/ARCH-004.js';

// Code Quality detectors
import { code001 } from './rules/CODE-001.js';
import { code002 } from './rules/CODE-002.js';
import { code003 } from './rules/CODE-003.js';
import { code004 } from './rules/CODE-004.js';
import { code005 } from './rules/CODE-005.js';

// API & Contract detectors
import { api001 } from './rules/API-001.js';
import { api002 } from './rules/API-002.js';
import { api003 } from './rules/API-003.js';
import { api004 } from './rules/API-004.js';

// Database & Persistence detectors
import { db001 } from './rules/DB-001.js';
import { db002 } from './rules/DB-002.js';
import { db003 } from './rules/DB-003.js';
import { db004 } from './rules/DB-004.js';

// Testing detectors
import { test001 } from './rules/TEST-001.js';
import { test002 } from './rules/TEST-002.js';
import { test003 } from './rules/TEST-003.js';

// Slop detectors
import { slop001 } from './rules/SLOP-001.js';
import { slop002 } from './rules/SLOP-002.js';
import { slop003 } from './rules/SLOP-003.js';
import { slop004 } from './rules/SLOP-004.js';

export const allDetectors: Detector[] = [
  arch001,
  arch002,
  arch003,
  arch004,
  code001,
  code002,
  code003,
  code004,
  code005,
  api001,
  api002,
  api003,
  api004,
  db001,
  db002,
  db003,
  db004,
  test001,
  test002,
  test003,
  slop001,
  slop002,
  slop003,
  slop004
];

export function collectFiles(
  repoRoot: string,
  targetSubpath?: string,
  changedFilesOnly = false
): FileEntry[] {
  const fileEntries: FileEntry[] = [];
  const startDir = targetSubpath ? join(repoRoot, targetSubpath) : repoRoot;

  if (changedFilesOnly) {
    try {
      const gitOutput = execSync('git status --porcelain', { cwd: repoRoot, encoding: 'utf-8' });
      const changedRelPaths = gitOutput
        .split('\n')
        .map(line => line.trim().slice(3))
        .filter(p => Boolean(p) && !p.includes('->'));

      for (const relPath of changedRelPaths) {
        const fullPath = join(repoRoot, relPath);
        if (existsSync(fullPath) && statSync(fullPath).isFile()) {
          const content = readFileSync(fullPath, 'utf-8');
          fileEntries.push({
            path: relPath,
            fullPath,
            content,
            lines: content.split('\n')
          });
        }
      }
      return fileEntries;
    } catch {
      // Fallback to reading all files if not a git repo
    }
  }

  const ignoreDirs = new Set(['.git', 'node_modules', 'dist', 'build', '.ei', 'coverage']);
  if (!targetSubpath) {
    ignoreDirs.add('fixtures');
  }

  function walk(currentDir: string) {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoreDirs.has(entry.name)) {
          walk(join(currentDir, entry.name));
        }
      } else if (entry.isFile()) {
        if (entry.name.endsWith('.md') || entry.name.endsWith('.markdown')) {
          continue;
        }
        const fullPath = join(currentDir, entry.name);
        const relPath = relative(repoRoot, fullPath);
        try {
          const content = readFileSync(fullPath, 'utf-8');
          fileEntries.push({
            path: relPath,
            fullPath,
            content,
            lines: content.split('\n')
          });
        } catch {
          // Skip binary files or unreadable files
        }
      }
    }
  }

  if (existsSync(startDir)) {
    if (statSync(startDir).isFile()) {
      const content = readFileSync(startDir, 'utf-8');
      fileEntries.push({
        path: relative(repoRoot, startDir),
        fullPath: startDir,
        content,
        lines: content.split('\n')
      });
    } else {
      walk(startDir);
    }
  }

  return fileEntries;
}

export interface DetectionResult {
  findings: Finding[];
  unfilteredRawCount: number;
  waivedCount: number;
  summary: {
    baselineCount: number;
    newCount: number;
    resolvedCount: number;
    blockers: number;
    fixCount: number;
    advisoryCount: number;
  };
}

export async function runDetectors(
  repoRoot: string,
  options: {
    targetSubpath?: string;
    changedFilesOnly?: boolean;
    detectors?: Detector[];
  } = {}
): Promise<DetectionResult> {
  const files = collectFiles(repoRoot, options.targetSubpath, options.changedFilesOnly);
  const context: DetectorContext = {
    repoRoot,
    files,
    targetPath: options.targetSubpath,
    changedFilesOnly: options.changedFilesOnly
  };

  const detectorsToRun = options.detectors || allDetectors;
  const rawFindings: RawFinding[] = [];

  for (const detector of detectorsToRun) {
    try {
      const results = await detector.run(context);
      rawFindings.push(...results);
    } catch (err) {
      console.error(`Detector ${detector.id} encountered error:`, err);
    }
  }

  // Filter against waivers / ignores
  const ignoreConfig = loadIgnores(repoRoot);
  const activeRawFindings: RawFinding[] = [];
  let waivedCount = 0;

  for (const finding of rawFindings) {
    const fileEntry = files.find(f => f.path === finding.filePath);
    const waiver = checkIgnored(finding, ignoreConfig, fileEntry?.lines);
    if (waiver.ignored) {
      waivedCount++;
    } else {
      activeRawFindings.push(finding);
    }
  }

  // Attribute against baseline
  const baseline = loadBaseline(repoRoot);
  const { activeFindings, summary } = attributeFindings(activeRawFindings, baseline);

  let blockers = 0;
  let fixCount = 0;
  let advisoryCount = 0;

  for (const f of activeFindings) {
    if (f.disposition === 'BLOCK') blockers++;
    else if (f.disposition === 'FIX') fixCount++;
    else if (f.disposition === 'REVIEW' || f.disposition === 'IGNORE') advisoryCount++;
  }

  return {
    findings: activeFindings,
    unfilteredRawCount: rawFindings.length,
    waivedCount,
    summary: {
      baselineCount: summary.baselineCount,
      newCount: summary.newCount,
      resolvedCount: summary.resolvedCount,
      blockers,
      fixCount,
      advisoryCount
    }
  };
}
