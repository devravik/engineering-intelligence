# Gemini CLI Engineering Intelligence Context

## Installation and Trust
Engineering Intelligence uses the `ei` CLI from the official `@devravik/engineering-intelligence` package.
Verify executable provenance with `ei --version` before execution.

## Core Rules
Read and enforce project boundaries defined in `.ei/PROJECT.md` and `.ei/ARCHITECTURE.md`.
Run the verified `ei` executable (`ei detect --changed`) after proposing edits.
Do not conclude tasks with unverified paths (UNKNOWN != PASS).
