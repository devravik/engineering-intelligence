import { ProviderMetadata, GeneratedArtifact } from './types.js';
import { SkillsDriver } from './drivers/skills.js';
import { HooksDriver } from './drivers/hooks.js';
import { IdeRulesDriver } from './drivers/ide-rules.js';
import { CliDriver } from './drivers/cli.js';
import { AcpMcpDriver } from './drivers/acp-mcp.js';

export const ALL_PROVIDERS: ProviderMetadata[] = [
  // -------------------------------------------------------------
  // P0 - Primary Reference & High-Adoption Native Agents
  // -------------------------------------------------------------
  {
    id: 'agy',
    name: 'Antigravity CLI (AGY)',
    category: 'terminal',
    priority: 'P0',
    channels: ['skills', 'hooks'],
    description: 'First-class reference adapter for Google Antigravity CLI supporting progressive skills, hooks.json, and rules.',
    ecosystemNotes: 'Personal workflow standard; continuously verified with PostToolUse and Stop lifecycle triggers.',
    discoveryPaths: {
      skills: '.agents/skills/engineering-intelligence/SKILL.md',
      hooks: '.agents/hooks.json',
      rules: '.agents/rules/engineering-intelligence.md'
    },
    detection: {
      binary: 'agy',
      paths: ['.agents', '~/.gemini/config']
    }
  },
  {
    id: 'claude',
    name: 'Claude Code',
    category: 'terminal',
    priority: 'P0',
    channels: ['skills'],
    description: 'Terminal coding agent from Anthropic supporting slash commands and progressive skills.',
    ecosystemNotes: 'Industry benchmark for CLI agent workflows.',
    discoveryPaths: {
      skills: '.claude/skills/engineering-intelligence/SKILL.md'
    },
    detection: {
      binary: 'claude',
      paths: ['.claude', '~/.claude']
    }
  },
  {
    id: 'codex',
    name: 'OpenAI Codex CLI',
    category: 'terminal',
    priority: 'P0',
    channels: ['cli', 'ide_rules'],
    description: 'OpenAI command-line agent enforcing engineering boundaries via directives and context files.',
    ecosystemNotes: 'Pioneer of the LLM coding agent interface.',
    discoveryPaths: {
      config: 'codex.json',
      rules: '.github/copilot-instructions.md'
    },
    detection: {
      binary: 'codex',
      paths: ['.github', 'codex.json']
    }
  },
  {
    id: 'opencode',
    name: 'OpenCode',
    category: 'terminal',
    priority: 'P0',
    channels: ['skills', 'cli'],
    description: 'Extensible open-source terminal coding agent with plugin and rule support.',
    ecosystemNotes: 'Community open-source alternative with high customization.',
    discoveryPaths: {
      skills: '.opencode/skills/engineering-intelligence/SKILL.md',
      config: 'plugin.json'
    },
    detection: {
      binary: 'opencode',
      paths: ['.opencode']
    }
  },

  // -------------------------------------------------------------
  // P1 - High-Growth IDE & Multi-Surface Agents
  // -------------------------------------------------------------
  {
    id: 'cline',
    name: 'Cline',
    category: 'ide',
    priority: 'P1',
    channels: ['skills', 'ide_rules'],
    description: 'Major open-source autonomous coding agent for VS Code with 5M+ installs and 60K+ GitHub stars.',
    ecosystemNotes: 'Top-tier open-source ecosystem maintaining active development.',
    discoveryPaths: {
      skills: '.cline/skills/engineering-intelligence/SKILL.md',
      rules: '.clinerules'
    },
    detection: {
      paths: ['.cline', '.clinerules']
    }
  },
  {
    id: 'kilo',
    name: 'Kilo Code / CLI',
    category: 'ide',
    priority: 'P1',
    channels: ['skills', 'cli', 'acp_mcp'],
    description: 'Multi-surface coding agent spanning VS Code, JetBrains, and terminal CLI, with native MCP support.',
    ecosystemNotes: 'Unifies editor and CLI surfaces under a shared agent architecture.',
    discoveryPaths: {
      skills: '.kilo/skills/engineering-intelligence/SKILL.md',
      mcp: '.kilo/mcp.json',
      config: 'kilo.json'
    },
    detection: {
      binary: 'kilo',
      paths: ['.kilo']
    }
  },
  {
    id: 'cursor',
    name: 'Cursor',
    category: 'ide',
    priority: 'P1',
    channels: ['ide_rules', 'acp_mcp'],
    description: 'AI-first code editor using rules (.cursorrules / .mdc) and MCP servers to guide codebase changes.',
    ecosystemNotes: 'Widespread developer adoption in production codebases.',
    discoveryPaths: {
      rules: '.cursor/rules/engineering-intelligence.mdc',
      mcp: '.cursor/mcp.json'
    },
    detection: {
      paths: ['.cursor', '.cursorrules']
    }
  },
  {
    id: 'gemini',
    name: 'Gemini CLI',
    category: 'terminal',
    priority: 'P1',
    channels: ['cli'],
    description: 'Google Gemini CLI developer assistant integrating with local codebase context.',
    ecosystemNotes: 'Terminal assistant leveraging Gemini models.',
    discoveryPaths: {
      config: '.gemini/context.md'
    },
    detection: {
      binary: 'gemini',
      paths: ['.gemini']
    }
  },
  {
    id: 'zed',
    name: 'Zed',
    category: 'ide',
    priority: 'P1',
    channels: ['skills', 'acp_mcp'],
    description: 'High-performance editor with native agent, ACP (Agent Client Protocol) interoperability, and Skills.',
    ecosystemNotes: 'Leading ACP pioneer for multi-agent interoperability.',
    discoveryPaths: {
      skills: '.zed/skills/engineering-intelligence/SKILL.md',
      mcp: '.zed/settings.json'
    },
    detection: {
      binary: 'zed',
      paths: ['.zed']
    }
  },

  // -------------------------------------------------------------
  // P2 - Enterprise & Specialized Agents
  // -------------------------------------------------------------
  {
    id: 'aider',
    name: 'Aider',
    category: 'terminal',
    priority: 'P2',
    channels: ['cli'],
    description: 'Pioneering terminal pair programmer with git integration and lint-on-edit capabilities.',
    ecosystemNotes: 'Long-standing, loyal terminal developer following.',
    discoveryPaths: {
      config: '.aider.conf.yml'
    },
    detection: {
      binary: 'aider',
      paths: ['.aider.conf.yml']
    }
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    category: 'ide',
    priority: 'P2',
    channels: ['ide_rules'],
    description: 'GitHub Copilot Workspace and IDE assistant directed via repository instructions.',
    ecosystemNotes: 'Ubiquitous enterprise presence.',
    discoveryPaths: {
      rules: '.github/copilot-instructions.md'
    },
    detection: {
      paths: ['.github/copilot-instructions.md']
    }
  },
  {
    id: 'augment',
    name: 'Augment Code',
    category: 'ide',
    priority: 'P2',
    channels: ['ide_rules'],
    description: 'Enterprise AI coding assistant designed for large, complex codebases and monorepos.',
    ecosystemNotes: 'Strong enterprise context-awareness.',
    discoveryPaths: {
      rules: '.augment/instructions.md'
    },
    detection: {
      paths: ['.augment']
    }
  },
  {
    id: 'windsurf',
    name: 'Windsurf / Devin Desktop',
    category: 'ide',
    priority: 'P2',
    channels: ['ide_rules'],
    description: 'AI-native IDE in the Devin lineage utilizing cascade flows and persistent workspace rules.',
    ecosystemNotes: 'Rebranded lineage (Windsurf / Devin Desktop).',
    discoveryPaths: {
      rules: '.windsurfrules'
    },
    detection: {
      paths: ['.windsurf', '.windsurfrules']
    }
  },
  {
    id: 'junie',
    name: 'JetBrains Junie',
    category: 'ide',
    priority: 'P2',
    channels: ['ide_rules'],
    description: 'JetBrains autonomous agent for IntelliJ IDEA and JetBrains IDE ecosystem.',
    ecosystemNotes: 'First-party agent for JVM and JetBrains developers.',
    discoveryPaths: {
      rules: '.junie/guidelines.md'
    },
    detection: {
      paths: ['.junie', '.idea']
    }
  },

  // -------------------------------------------------------------
  // P3 - Autonomous & Cloud Platforms
  // -------------------------------------------------------------
  {
    id: 'openhands',
    name: 'OpenHands',
    category: 'autonomous',
    priority: 'P3',
    channels: ['acp_mcp', 'cli'],
    description: 'Open-source autonomous AI software development agent running in cloud or local containers.',
    ecosystemNotes: 'Community autonomous benchmark.',
    discoveryPaths: {
      mcp: '.openhands/mcp.json'
    },
    detection: {
      paths: ['.openhands']
    }
  },
  {
    id: 'devin',
    name: 'Devin (Cloud)',
    category: 'autonomous',
    priority: 'P3',
    channels: ['acp_mcp', 'ide_rules'],
    description: 'Autonomous cloud software engineer with end-to-end sandbox execution and verification.',
    ecosystemNotes: 'Leading cloud autonomous agent platform.',
    discoveryPaths: {
      rules: '.devin/instructions.md',
      mcp: '.devin/mcp.json'
    },
    detection: {
      paths: ['.devin']
    }
  }
];

export function getProviderMetadata(id: string): ProviderMetadata | undefined {
  return ALL_PROVIDERS.find(p => p.id === id);
}

export function getProvidersByPriority(priority: string): ProviderMetadata[] {
  return ALL_PROVIDERS.filter(p => p.priority === priority);
}

export function getProvidersByCategory(category: string): ProviderMetadata[] {
  return ALL_PROVIDERS.filter(p => p.category === category);
}

export function generateProviderArtifacts(
  provider: ProviderMetadata,
  options: { repoRoot?: string } = {}
): GeneratedArtifact[] {
  const artifacts: GeneratedArtifact[] = [];

  for (const channel of provider.channels) {
    if (channel === 'skills') {
      const targetPath = provider.discoveryPaths.skills || `skills/${provider.id}/SKILL.md`;
      artifacts.push(
        SkillsDriver.generate({
          providerName: provider.name,
          targetPath
        })
      );
    }

    if (channel === 'hooks') {
      const targetPath = provider.discoveryPaths.hooks || `.agents/hooks.json`;
      artifacts.push(
        HooksDriver.generate({
          targetPath
        })
      );
    }

    if (channel === 'ide_rules') {
      const targetPath = provider.discoveryPaths.rules || `.${provider.id}rules`;
      const format = targetPath.endsWith('.mdc') ? 'mdc' : 'markdown';
      artifacts.push(
        IdeRulesDriver.generate({
          providerName: provider.name,
          targetPath,
          format
        })
      );
    }

    if (channel === 'cli') {
      let type: 'aider' | 'gemini' | 'codex' | 'kilo' = 'codex';
      if (provider.id === 'aider') type = 'aider';
      else if (provider.id === 'gemini') type = 'gemini';
      else if (provider.id === 'kilo') type = 'kilo';

      const targetPath = provider.discoveryPaths.config || `${provider.id}.json`;
      artifacts.push(
        CliDriver.generate({
          providerName: provider.name,
          targetPath,
          type
        })
      );
    }

    if (channel === 'acp_mcp') {
      let format: 'zed' | 'openhands' | 'generic_mcp' = 'generic_mcp';
      if (provider.id === 'zed') format = 'zed';
      else if (provider.id === 'openhands') format = 'openhands';

      const targetPath = provider.discoveryPaths.mcp || `.${provider.id}/mcp.json`;
      artifacts.push(
        AcpMcpDriver.generate({
          providerName: provider.name,
          targetPath,
          format
        })
      );
    }
  }

  return artifacts;
}
