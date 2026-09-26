import { Category, RawFinding, Severity, EIFinding, RuleClass } from '../findings/types.js';

export interface FileEntry {
  path: string;       // relative path from repo root
  fullPath: string;   // absolute path
  content: string;
  lines: string[];
}

export interface DetectorContext {
  repoRoot: string;
  files: FileEntry[];
  targetPath?: string;
  changedFilesOnly?: boolean;
}

/**
 * Detector Engine Philosophy: Conservative Completeness
 *
 * A detector finding means:
 *   "EI found concrete evidence matching this rule."
 * It does NOT mean:
 *   "EI proved that no other instance exists."
 *
 * Deterministic detection provides unambiguous evidence anchors (file, line, snippet, hash),
 * but never claims formal mathematical absence of unflagged issues across unmodeled or ambiguous paths.
 */
export interface Detector {
  id: string;
  name: string;
  category: Category;
  severity: Severity;
  ruleClass?: RuleClass;
  description: string;
  run(context: DetectorContext): Promise<RawFinding[]>;
}

export interface DetectionResult {
  findings: EIFinding[];
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
