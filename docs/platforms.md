# Multi-Agent Platform & Protocol Integration Guide

Engineering Intelligence does not rely on 16 divergent, hand-crafted implementations. Instead, it provides a unified quality control core translated through **5 standard protocol archetype drivers**:

```text
                     Engineering Intelligence Core
                                │
                     ┌──────────┴──────────┐
                     │   EI Core Engine    │
                     └──────────┬──────────┘
                                │ Standard EI Interface (Protocol)
        ┌───────────┬───────────┼───────────┬───────────┐
        ▼           ▼           ▼           ▼           ▼
       CLI        Skills      Hooks      ACP/MCP     IDE Rules
        │           │           │           │           │
      Codex        AGY        Claude       Zed        Cursor
      Aider       Cline      OpenCode     Kilo        Copilot
      Gemini      Kilo                  OpenHands    Windsurf
                                          Devin       Augment
                                                       Junie
```

---

## Distribution Strategy

skills.sh is **not** a submission portal. It is an auto-discovery catalogue driven by anonymous installation telemetry:

```text
GitHub repo (public SKILL.md)
         │
         ▼
  skills.sh catalogue
  ├── discovery & ranking
  ├── install count leaderboard
  └── security audits
         │
         ▼
  npx skills add devravik/engineering-intelligence
         │
         ▼
  Agent harness (Claude Code, Cursor, Windsurf, …)
```

The first `npx skills add` invocation against the public repo automatically seeds the catalogue. No separate submission step is needed.

### Distribution Tiers (priority order)

| Channel | Mechanism | Action Required |
| :--- | :--- | :--- |
| **GitHub** | Public repo + `SKILL.md` | ✅ Done when repo is public |
| **skills.sh** | Auto-discovered via install telemetry | None — first install seeds catalogue |
| **Claude Code plugin** | `.claude-plugin/` manifest | Publish to Claude marketplace |
| **OpenAI plugin** | Plugin portal submission | Submit when portal issue resolved |
| **Provider-specific** | IDE marketplaces where worthwhile | Evaluate case by case |

> **Note:** skills.sh supports Claude Code, Cursor, and Windsurf natively. A single canonical `SKILL.md` covers all three — no per-agent forks needed.

---

## 2026 Coding Agent Priority Matrix

| Priority | Agent | Category | Protocol Channels | Key Artifacts & Discovery |
| :--- | :--- | :--- | :--- | :--- |
| **P0** | **Antigravity CLI (AGY)** | Terminal / CLI | `skills`, `hooks` | Continuous reference implementation; `.agents/hooks.json` on `PostToolUse` and `Stop`; native `.agents/skills/`. |
| **P0** | **Claude Code** | Terminal / CLI | `skills` | Discovered via `.claude/skills/engineering-intelligence/SKILL.md`; native slash commands. |
| **P0** | **OpenAI Codex CLI** | Terminal / CLI | `cli`, `ide_rules` | `codex.json` and persistent `.github/copilot-instructions.md`. |
| **P0** | **OpenCode** | Terminal / CLI | `skills`, `cli` | `plugin.json` and `.opencode/skills/`. |
| **P1** | **Cline** | IDE / Editor | `skills`, `ide_rules` | 5M+ installs, 60K+ stars; `.cline/skills/` and `.clinerules`. |
| **P1** | **Kilo Code / CLI** | IDE & Terminal | `skills`, `cli`, `acp_mcp` | Spans VS Code, JetBrains, and terminal; `.kilo/mcp.json`. |
| **P1** | **Cursor** | IDE / Editor | `ide_rules`, `acp_mcp` | `.cursor/rules/engineering-intelligence.mdc` and `.cursorrules`. |
| **P1** | **Gemini CLI** | Terminal / CLI | `cli` | Local repository grounding via `.gemini/context.md`. |
| **P1** | **Zed** | IDE / Editor | `skills`, `acp_mcp` | Agent Client Protocol (ACP) interoperability and `.zed/skills/`. |
| **P2** | **Aider** | Terminal / CLI | `cli` | Auto-lints via `.aider.conf.yml` (`ei detect --changed` on edit). |
| **P2** | **GitHub Copilot** | IDE / Editor | `ide_rules` | Enterprise directives via `.github/copilot-instructions.md`. |
| **P2** | **Augment Code** | IDE / Editor | `ide_rules` | Enterprise monorepo intelligence via `.augment/instructions.md`. |
| **P2** | **Windsurf / Devin Desktop** | IDE / Editor | `ide_rules` | Persistent workspace rules via `.windsurfrules`. |
| **P2** | **JetBrains Junie** | IDE / Editor | `ide_rules` | Guidelines in `.junie/guidelines.md`. |
| **P3** | **OpenHands** | Autonomous / Cloud | `acp_mcp`, `cli` | Autonomous container integration via `.openhands/mcp.json`. |
| **P3** | **Devin (Cloud)** | Autonomous / Cloud | `acp_mcp`, `ide_rules` | Cloud sandbox execution instructions via `.devin/instructions.md`. |

---

## One-Command Provider Synchronization

You can generate, update, or install provider configurations across all supported agents simultaneously:

```bash
# Inspect all 16 supported agents and priority tiers
ei providers

# Generate all 16 provider configurations into providers/
ei sync-providers

# Synchronize only high-priority tiers
ei sync-providers --tier P0,P1

# Install directly into current workspace (.agents/, .claude/, .github/, .cursor/, .zed/, etc.)
ei sync-providers --install
```

---

## Universal MCP & ACP Server (`ei mcp`)

Engineering Intelligence includes a built-in JSON-RPC stdio **Model Context Protocol (MCP)** and **Agent Client Protocol (ACP)** server. This allows any modern agent (Zed, Kilo, Devin, OpenHands, Claude Desktop) to invoke Engineering Intelligence directly as native tools:

### Zed Configuration (`.zed/settings.json`)
```json
{
  "context_servers": {
    "engineering-intelligence": {
      "command": "ei",
      "args": ["mcp"],
      "settings": {
        "enforceBlockers": true
      }
    }
  }
}
```

### Kilo Code Configuration (`.kilo/mcp.json`)
```json
{
  "mcpServers": {
    "engineering-intelligence": {
      "command": "ei",
      "args": ["mcp"]
    }
  }
}
```

### Available MCP Tools
- **`ei_detect`**: Run deterministic quality control detectors on codebase files, reporting exact lines, evidence, and SHA-256 evidence hashes.
- **`ei_review`**: Generate structured discipline finding matrix and derived terminal disposition (`BLOCK`, `FIX`, `REVIEW`, `IGNORE`, `SHIP`). Enforces `UNKNOWN != PASS`.
- **`ei_simplify`**: Run 8-step anti-entropy simplification analysis.
- **`ei_impact`**: Trace call graph blast radius across APIs, database schemas, and background jobs.
- **`ei_ship`**: Run 10-point release gate verification before merging.

---

## Platform Details by Provider

### 1. Antigravity CLI (AGY) [P0 - Reference Integration]
- **Location:** `.agents/skills/engineering-intelligence/SKILL.md` (or `~/.gemini/config/skills/`).
- **Hooks (`.agents/hooks.json`):**
  - `PostToolUse` on `write_to_file` & `replace_file_content` ➔ runs `ei detect --changed`.
  - `Stop` hook ➔ runs `ei review` to ensure zero blockers before turn completion.
- **Fallback:** When hooks or CLI are absent, operates statically via manual CLI execution.

### 2. Claude Code [P0]
- **Location:** `.claude/skills/engineering-intelligence/SKILL.md` (or `~/.claude/skills/`).
- **Commands:** `/review`, `/simplify`, `/impact`, `/ship`, `/detect`.

### 3. Cline [P1]
- **Location:** `.cline/skills/engineering-intelligence/SKILL.md` and `.clinerules`.
- **Enforcement:** `.clinerules` mandates grounding in `.ei/PROJECT.md` and running `ei detect --changed`.

### 4. Zed [P1]
- **Location:** `.zed/skills/engineering-intelligence/SKILL.md` and `.zed/settings.json`.
- **Protocol:** Connects via Agent Client Protocol (ACP) and Model Context Protocol (MCP) to `ei mcp`.

### 5. Aider [P2]
- **Configuration:** `.aider.conf.yml`.
- **Auto-linting:** Automatically runs `ei detect --changed` on every edit and `ei review` on test runs.
