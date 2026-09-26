# Zed Provider Integration

**Category:** IDE | **Tier:** P1

High-performance editor with native agent, ACP (Agent Client Protocol) interoperability, and Skills.

---

## Ecosystem Notes
Leading ACP pioneer for multi-agent interoperability.

## Supported Protocol Channels
- **skills**
- **acp_mcp**

## Discovery & Configuration Paths
- **skills**: `.zed/skills/engineering-intelligence/SKILL.md`
- **mcp**: `.zed/settings.json`

---

## Installation & Synchronization

```bash
# Synchronize provider artifacts from canonical core
ei sync-providers

# Install configuration directly into project workspace
ei sync-providers --install
```
