# Augment Code Provider Integration

**Category:** IDE | **Tier:** P2

Enterprise AI coding assistant designed for large, complex codebases and monorepos.

---

## Ecosystem Notes
Strong enterprise context-awareness.

## Supported Protocol Channels
- **ide_rules**

## Discovery & Configuration Paths
- **rules**: `.augment/instructions.md`

---

## Installation & Synchronization

```bash
# Synchronize provider artifacts from canonical core
ei sync-providers

# Install configuration directly into project workspace
ei sync-providers --install
```
