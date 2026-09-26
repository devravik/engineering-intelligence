# JetBrains Junie Provider Integration

**Category:** IDE | **Tier:** P2

JetBrains autonomous agent for IntelliJ IDEA and JetBrains IDE ecosystem.

---

## Ecosystem Notes
First-party agent for JVM and JetBrains developers.

## Supported Protocol Channels
- **ide_rules**

## Discovery & Configuration Paths
- **rules**: `.junie/guidelines.md`

---

## Installation & Synchronization

```bash
# Synchronize provider artifacts from canonical core
ei sync-providers

# Install configuration directly into project workspace
ei sync-providers --install
```
