import { allDetectors } from '../../detectors/index.js';
import { GeneratedArtifact } from '../types.js';

export interface IdeRulesOptions {
  providerName: string;
  targetPath: string;
  format?: 'markdown' | 'mdc' | 'plain';
}

export class IdeRulesDriver {
  static generate(options: IdeRulesOptions): GeneratedArtifact {
    const { providerName, targetPath, format = 'markdown' } = options;

    const detectorCatalog = allDetectors
      .map(d => `- **${d.id}** (${d.category}): ${d.description}`)
      .join('\n');

    let header = '';
    if (format === 'mdc') {
      header = `---
description: Engineering Quality Control for ${providerName}
globs: *
---

`;
    }

    const content = `${header}# Engineering Intelligence Directives (${providerName})

You are operating with **Engineering Intelligence** active. You must act as a staff engineer ensuring high software quality, architectural discipline, and zero slop.

## Installation and Trust

Engineering Intelligence uses the \`ei\` CLI from the official \`@devravik/engineering-intelligence\` package.

Official source:
https://github.com/devravik/engineering-intelligence

Install:
\`\`\`bash
npx -y @devravik/engineering-intelligence --version
\`\`\`
or install globally:
\`\`\`bash
npm install -g @devravik/engineering-intelligence
\`\`\`

Before relying on the CLI, verify:
\`\`\`bash
ei --version
\`\`\`
The expected publisher/package identity is:
\`@devravik/engineering-intelligence\`

Always run the \`ei\` executable provided by the official \`@devravik/engineering-intelligence\` package. Verify its version before execution.

## Core Rules
1. **Context Grounding:** Always check \`.ei/PROJECT.md\` and \`.ei/ARCHITECTURE.md\` before adding abstractions or patterns.
2. **Deterministic QC:** Run the verified \`ei\` executable (\`ei detect\`) to verify deterministic contracts before proposing edits.
3. **Matrix Disposition:** Obey finding matrix decisions. Never commit code or propose diffs with derived \`BLOCK\` disposition.
4. **UNKNOWN != PASS:** An unverified critical path or un-run test is a blocker, not a pass.
5. **Anti-Slop:**
   - No single-implementation interfaces (ARCH-001).
   - No pass-through Abstract Factories (SLOP-001).
   - No tautological echo comments (SLOP-002).
   - No unhandled exceptions in empty catch blocks (API-002).
   - No N+1 database queries in loops (DB-002).

## Active Deterministic Rules
${detectorCatalog}

## Verification Commands
Execute using the authentic \`ei\` binary from \`@devravik/engineering-intelligence\`:
- Check current changes: \`ei detect --changed\`
- Generate finding matrix: \`ei review\`
- Anti-entropy simplification: \`ei simplify <path>\`
- Pre-merge production readiness check: \`ei ship\`
`;

    return {
      relativePath: targetPath,
      content,
      description: `IDE rules and persistent instructions for ${providerName}`,
      channel: 'ide_rules'
    };
  }
}
