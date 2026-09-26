import { Category, RawFinding, Severity } from '../findings/types.js';

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

export interface Detector {
  id: string;
  name: string;
  category: Category;
  severity: Severity;
  description: string;
  run(context: DetectorContext): Promise<RawFinding[]>;
}
