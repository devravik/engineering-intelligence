# Coding Conventions & Idioms

## Code Style & Formatting
- **Linter / Formatter:** [e.g., Biome, ESLint + Prettier, Pint, Ruff]
- **File Naming:** [e.g., kebab-case for utilities, PascalCase for components]

## Error Handling Patterns
- [Describe the preferred pattern: exceptions vs Result objects vs Go tuples]
- Never swallow errors silently in empty `catch` blocks.
- Always log operational context (e.g., `userId`, `correlationId`) with errors.

## Data Validation
- Input boundaries must be strictly validated using [e.g., Zod, Pydantic, FormRequest].
- Trust validated internal domain boundaries; avoid redundant defensive null-checks internally.

## Testing Conventions
- **Colocation:** [Are tests colocated (`foo.test.ts` next to `foo.ts`) or in a separate `tests/` directory?]
- **Mocking Policy:** Prefer testing against real lightweight databases (e.g., SQLite in-memory or test containers) over mocking every database query.
