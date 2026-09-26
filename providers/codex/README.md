# OpenAI Codex CLI Provider Integration

**Category:** TERMINAL | **Tier:** P0

OpenAI command-line agent enforcing engineering boundaries via directives and context files.

---

## Ecosystem Notes
Pioneer of the LLM coding agent interface.

## Supported Protocol Channels
- **cli**
- **ide_rules**

## Discovery & Configuration Paths
- **config**: `codex.json`
- **rules**: `.github/copilot-instructions.md`

---

## Installation & Synchronization

```bash
# Synchronize provider artifacts from canonical core
ei sync-providers

# Install configuration directly into project workspace
ei sync-providers --install
```
