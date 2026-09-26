import { GeneratedArtifact } from '../types.js';

export interface CliDriverOptions {
  providerName: string;
  targetPath: string;
  type: 'aider' | 'gemini' | 'codex' | 'kilo';
}

export class CliDriver {
  static generate(options: CliDriverOptions): GeneratedArtifact {
    const { providerName, targetPath, type } = options;

    if (type === 'aider') {
      const aiderYaml = `# Aider configuration for Engineering Intelligence
read:
  - .ei/PROJECT.md
  - .ei/ARCHITECTURE.md
  - .ei/CONVENTIONS.md

auto-lint: true
lint-cmd: ei detect --changed
test-cmd: ei review
`;
      return {
        relativePath: targetPath,
        content: aiderYaml,
        description: `Aider CLI configuration integrating EI lint and review checks`,
        channel: 'cli'
      };
    }

    if (type === 'gemini') {
      const geminiConfig = `# Gemini CLI Engineering Intelligence Context

Read and enforce project boundaries defined in \`.ei/PROJECT.md\` and \`.ei/ARCHITECTURE.md\`.
Run \`ei detect --changed\` after proposing edits.
Do not conclude tasks with unverified paths (UNKNOWN != PASS).
`;
      return {
        relativePath: targetPath,
        content: geminiConfig,
        description: `Gemini CLI context integration`,
        channel: 'cli'
      };
    }

    // Default JSON config for Codex / Kilo CLI
    const genericJson = JSON.stringify(
      {
        provider: providerName,
        qualityEngine: 'Engineering Intelligence',
        checkCommand: 'ei detect --changed',
        reviewCommand: 'ei review',
        contextFiles: ['.ei/PROJECT.md', '.ei/ARCHITECTURE.md', '.ei/CONVENTIONS.md']
      },
      null,
      2
    );

    return {
      relativePath: targetPath,
      content: genericJson,
      description: `${providerName} CLI configuration linking EI commands`,
      channel: 'cli'
    };
  }
}
