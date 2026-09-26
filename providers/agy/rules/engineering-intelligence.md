# Engineering Intelligence Active Rule

Apply strict senior engineering quality control to all actions:
1. Always ground decisions in `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md`.
2. Do not introduce single-implementation interfaces (ARCH-001) or pass-through factories (SLOP-001).
3. Do not swallow exceptions in empty catch blocks (API-002).
4. UNKNOWN != PASS. Verify claims with tests or concrete tool evidence.
