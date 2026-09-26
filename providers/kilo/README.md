# Kilo Code / CLI Provider Integration

**Category:** IDE | **Tier:** P1

Multi-surface coding agent spanning VS Code, JetBrains, and terminal CLI, with native MCP support.

---

## Ecosystem Notes
Unifies editor and CLI surfaces under a shared agent architecture.

## Supported Protocol Channels
- **skills**
- **cli**
- **acp_mcp**

## Discovery & Configuration Paths
- **skills**: `.kilo/skills/engineering-intelligence/SKILL.md`
- **mcp**: `.kilo/mcp.json`
- **config**: `kilo.json`

---

## Installation & Synchronization

```bash
# Synchronize provider artifacts from canonical core
ei sync-providers

# Install configuration directly into project workspace
ei sync-providers --install
```
