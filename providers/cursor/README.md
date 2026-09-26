# Cursor Provider Integration

**Category:** IDE | **Tier:** P1

AI-first code editor using rules (.cursorrules / .mdc) and MCP servers to guide codebase changes.

---

## Ecosystem Notes
Widespread developer adoption in production codebases.

## Supported Protocol Channels
- **ide_rules**
- **acp_mcp**

## Discovery & Configuration Paths
- **rules**: `.cursor/rules/engineering-intelligence.mdc`
- **mcp**: `.cursor/mcp.json`

---

## Installation & Synchronization

```bash
# Synchronize provider artifacts from canonical core
ei sync-providers

# Install configuration directly into project workspace
ei sync-providers --install
```
