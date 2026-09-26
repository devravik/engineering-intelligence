# Architecture & Boundaries

## System Topology
Modular Application

## Boundary Rules
1. Do not introduce single-implementation interfaces (ARCH-001).
2. Keep business logic isolated from presentation components (ARCH-004).
3. Avoid pass-through generic factories or redundant wrapper indirection (SLOP-001, CODE-003).
4. Prevent cyclical dependencies across domain boundaries (ARCH-003).
