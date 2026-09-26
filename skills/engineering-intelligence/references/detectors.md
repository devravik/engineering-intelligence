# Engineering Intelligence Detector Catalog

Engineering Intelligence combines 32 code detectors and 49 UI detectors into a unified quality control pipeline.

---

## 1. Code Detectors (32 Deterministic Rules)

### Architecture
- **ARCH-001**: Single-implementation interface without polymorphic variance (violates Restraint Doctrine).
- **ARCH-002**: Duplicated responsibility across sibling domain classes.
- **ARCH-003**: Circular module dependency cycle.
- **ARCH-004**: Direct database client access inside UI client components.
- **ARCH-005**: Module-level shared mutable state in server routes.

### Database
- **DB-001**: Missing database index on foreign key column.
- **DB-002**: N+1 database queries inside loop or iterator.
- **DB-003**: Unsafe database migration adding `NOT NULL` without `DEFAULT`.
- **DB-004**: Missing transaction boundary across sequential multi-table mutations.
- **DB-005**: Sequential multi-table write operations lacking transaction rollbacks.

### Security
- **SEC-001**: Hardcoded secrets, API tokens, or private keys committed in source.
- **SEC-002**: Unsanitized raw SQL query string interpolation (SQL injection risk).

### API & Network
- **API-001**: Missing authorization/authentication guard on mutating endpoint handler.
- **API-002**: Missing input payload validation schema on public endpoint.
- **API-003**: Inconsistent HTTP status codes for equivalent error responses.
- **API-004**: Missing rate limiting on sensitive public authentication route.
- **API-005**: Unbounded HTTP request lacking timeout or AbortSignal.

### Code Quality
- **CODE-001**: Dead code / unused internal exports.
- **CODE-002**: Deep nesting depth exceeding 4 indent levels.
- **CODE-003**: Excessive pass-through functions with zero domain transformation.
- **CODE-004**: Broad catch block swallowing errors silently.
- **CODE-005**: Magic numbers and unexplained literal constants.
- **CODE-006**: TypeScript compiler suppression directives (`@ts-ignore`) and loose `any` casts.
- **CODE-007**: Floating unawaited promises in mutating handlers.

### Anti-Slop (Code)
- **SLOP-001**: Speculative pass-through factory function with single variant.
- **SLOP-002**: Tautological echo comments that merely restate function signatures.
- **SLOP-003**: Speculative plugin registry with only 1 registration.
- **SLOP-004**: Premature abstraction layers without 3+ concrete usages.

### Testing
- **TEST-001**: Test suite lacking assertion checks.
- **TEST-002**: Weak tautological assertions (e.g. `expect(true).toBe(true)`).
- **TEST-003**: Tests relying on non-deterministic wall-clock timing or arbitrary delays.
- **TEST-004**: Committed focused (`.only`) or skipped (`.skip`) test suites.

---

## 2. UI Detectors (49 Rendered-Interface Rules)

### Typography
- **UI-TYPE-001**: Weak type hierarchy (skipped heading levels, missing h1).
- **UI-TYPE-002**: Excessive font-size variants (> 6 distinct sizes).
- **UI-TYPE-003**: Excessive font-weight variants (> 3 weights).
- **UI-TYPE-004**: Body text below readability threshold (< 14px).
- **UI-TYPE-006**: Generic default font usage without product character.

### Color
- **UI-COLOR-001**: Generic AI purple/blue gradient aesthetic.
- **UI-COLOR-002**: Decorative gradient overuse (> 3 gradients).
- **UI-COLOR-003**: Excessive accent colors (> 3 accents).
- **UI-COLOR-005**: Low contrast ratio under WCAG 2.1 AA (< 4.5:1).
- **UI-COLOR-006**: Inconsistent semantic status colors.

### Spatial & Layout
- **UI-SPATIAL-001**: Everything-centered layout (> 40% centered content).
- **UI-SPATIAL-002**: Monotonous spacing scale lacking rhythm.
- **UI-SPATIAL-005**: Deep container nesting depth (> 4 levels).
- **UI-SPATIAL-007**: Excessive border-radius variants (> 3 corner radii).
- **UI-SPATIAL-008**: Missing structured Grid or Flexbox alignment system.

### Composition
- **UI-COMP-001**: Competing high-weight visual elements (no focal point).
- **UI-COMP-003**: Excessive component density on non-dashboard surfaces.
- **UI-COMP-006**: Repeated template composition across routes.

### AI Slop (UI)
- **UI-SLOP-001**: Formulaic SaaS dashboard layout.
- **UI-SLOP-002**: Purple/blue AI aesthetic palette.
- **UI-SLOP-003**: Rounded-card-everything (wrapping every element in a container).
- **UI-SLOP-004**: Icon-tile placed above every single heading.
- **UI-SLOP-005**: Decorative gradient backgrounds without functional role.
- **UI-SLOP-006**: Excessive glassmorphism backdrop filters.
- **UI-SLOP-007**: Everything-centered content layout.
- **UI-SLOP-008**: Excessive badge and pill wallpaper (> 6 badges).
- **UI-SLOP-009**: Generic metric-card wall.
- **UI-SLOP-010**: Formulaic hero section template.
- **UI-SLOP-012**: Decorative visual elements without functional purpose.
- **UI-SLOP-013**: Component variant explosion.
- **UI-SLOP-COMPOUND**: Compound multi-signal AI slop signature.

### Responsive
- **UI-RESP-001**: Horizontal viewport overflow on mobile (375px/390px).
- **UI-RESP-002**: Fixed desktop pixel widths breaking mobile adaptability.
- **UI-RESP-004**: Clipped or truncated content on smaller viewports.
- **UI-RESP-005**: Tiny mobile touch targets (< 44x44px).
- **UI-RESP-006**: Desktop-only layout assumptions.
- **UI-RESP-008**: Multi-column grid failing to collapse to single column on mobile.

### Accessibility
- **UI-A11Y-001**: Missing image alternative text (`alt`).
- **UI-A11Y-002**: Form inputs lacking associated `<label>` or `aria-label`.
- **UI-A11Y-003**: Empty buttons or links without accessible name.
- **UI-A11Y-004**: Low text/background contrast ratio under WCAG AA.
- **UI-A11Y-005**: Positive `tabindex` anti-pattern.

### Interaction
- **UI-INTERACT-001**: Non-semantic elements (`div`/`span`) used as buttons.
- **UI-INTERACT-002**: Missing visible focus indicator states.
- **UI-INTERACT-003**: Disabled controls lacking explanation or feedback.

### Design System
- **UI-DS-001**: Excessive box-shadow elevation declarations.
- **UI-DS-002**: Absence of CSS custom properties (hardcoded style values).
- **UI-DS-003**: Arbitrary breakpoint values not aligned to standard matrix.
- **UI-DS-004**: Missing `.ei/DESIGN.md` design context document.
