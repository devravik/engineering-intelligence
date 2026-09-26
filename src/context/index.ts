import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { detectProjectStack, DetectedStack } from './scanner.js';

export interface ProjectContext {
  project?: string;
  architecture?: string;
  conventions?: string;
  decisions?: string;
  constraints?: string;
}

export function getEiDir(repoRoot: string): string {
  return join(repoRoot, '.ei');
}

export function initProjectContext(repoRoot: string): { stack: DetectedStack } {
  const eiDir = getEiDir(repoRoot);
  const stateDir = join(eiDir, 'state');
  const sessionsDir = join(stateDir, 'sessions');

  if (!existsSync(eiDir)) mkdirSync(eiDir, { recursive: true });
  if (!existsSync(stateDir)) mkdirSync(stateDir, { recursive: true });
  if (!existsSync(sessionsDir)) mkdirSync(sessionsDir, { recursive: true });

  const stack = detectProjectStack(repoRoot);

  // 1. PROJECT.md
  const projectPath = join(eiDir, 'PROJECT.md');
  if (!existsSync(projectPath)) {
    writeFileSync(
      projectPath,
      `# Project Context\n\n## Mission\n[Describe core domain mission and user problems solved here]\n\n## Detected Tech Stack\n- **Languages:** ${stack.languages.join(', ') || 'TypeScript'}\n- **Framework:** ${stack.framework || 'N/A'}\n- **Data Persistence:** ${stack.dataPersistence || 'N/A'}\n- **Test Suite:** ${stack.testRunner || 'N/A'}\n- **Linter/Formatter:** ${stack.linter || 'N/A'}\n- **Key Directories:** ${stack.directoryTopology.join(', ') || 'src'}\n`,
      'utf-8'
    );
  }

  // 2. ARCHITECTURE.md
  const archPath = join(eiDir, 'ARCHITECTURE.md');
  if (!existsSync(archPath)) {
    writeFileSync(
      archPath,
      `# Architecture & Boundaries\n\n## System Topology\n${stack.framework ? stack.framework + ' Architecture' : 'Modular Application'}\n\n## Boundary Rules\n1. Do not introduce single-implementation interfaces (ARCH-001).\n2. Keep business logic isolated from presentation components (ARCH-004).\n3. Avoid pass-through generic factories or redundant wrapper indirection (SLOP-001, CODE-003).\n4. Prevent cyclical dependencies across domain boundaries (ARCH-003).\n`,
      'utf-8'
    );
  }

  // 3. CONVENTIONS.md
  const convPath = join(eiDir, 'CONVENTIONS.md');
  if (!existsSync(convPath)) {
    writeFileSync(
      convPath,
      `# Conventions & Idioms\n\n## Error Handling\n- Never silently swallow exceptions in empty catch blocks (API-002).\n- Always attach operational context (userId, traceId) to error logs.\n\n## Testing Standards\n- Assert meaningful domain state; avoid tautological assertions (TEST-002).\n- Test failure modes and exception branches, not only happy paths (TEST-003).\n\n## Anti-Slop Policy\n- Remove tautological echo comments that merely restate code (SLOP-002).\n- Eliminate speculative plugin architectures that lack multiple active implementations (SLOP-003).\n`,
      'utf-8'
    );
  }

  // 4. DECISIONS.md
  const decPath = join(eiDir, 'DECISIONS.md');
  if (!existsSync(decPath)) {
    writeFileSync(
      decPath,
      `# Architectural Decision Records (ADRs)\n\n## ADR-001: Quality Control Baseline\n- **Date:** ${new Date().toISOString().slice(0, 10)}\n- **Decision:** Establish Engineering Intelligence quality control and baseline tracking.\n- **Rationale:** Eliminate AI-generated slop and verify changes with deterministic evidence.\n`,
      'utf-8'
    );
  }

  // 5. constraints.md
  const constPath = join(eiDir, 'constraints.md');
  if (!existsSync(constPath)) {
    writeFileSync(
      constPath,
      `# System Constraints & Invariants\n\n## Database & Schema Invariants\n- All foreign key columns must have an accompanying index (DB-001).\n- Adding NOT NULL columns to populated tables requires a DEFAULT value or multi-phase migration (DB-003).\n- No table or column drops without an explicit approved waiver (DB-004).\n\n## Security Invariants\n- All mutating API route handlers must enforce authentication and permission verification (API-001).\n`,
      'utf-8'
    );
  }

  // 6. ignores.json
  const ignoresPath = join(eiDir, 'ignores.json');
  if (!existsSync(ignoresPath)) {
    writeFileSync(ignoresPath, JSON.stringify({ rules: [], files: [] }, null, 2), 'utf-8');
  }

  return { stack };
}

export function loadProjectContext(repoRoot: string): ProjectContext {
  const eiDir = getEiDir(repoRoot);
  const context: ProjectContext = {};

  const files: Record<keyof ProjectContext, string> = {
    project: 'PROJECT.md',
    architecture: 'ARCHITECTURE.md',
    conventions: 'CONVENTIONS.md',
    decisions: 'DECISIONS.md',
    constraints: 'constraints.md'
  };

  for (const [key, filename] of Object.entries(files)) {
    const fullPath = join(eiDir, filename);
    if (existsSync(fullPath)) {
      context[key as keyof ProjectContext] = readFileSync(fullPath, 'utf-8');
    }
  }

  return context;
}
