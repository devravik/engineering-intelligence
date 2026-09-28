# AI-Generated UI Review: Detecting and Fixing AI UI Slop

Engineering Intelligence provides deterministic review of AI-generated user interfaces. It detects the formulaic aesthetic patterns that large language models repeatedly produce—purple/indigo gradients, card-in-card nesting, everything-centered layouts, missing accessibility labels, and absent design system tokens.

AI coding agents like Claude Code, Cursor, and Codex generate functional UIs quickly, but they converge on a recognizable aesthetic monoculture. Engineering Intelligence's 49 UI detectors analyze CSS, HTML structure, component hierarchies, and layout patterns to flag the visual and structural markers of AI-generated UI slop before it ships.

---

## What AI UI Slop Looks Like

These are the high-frequency patterns that Engineering Intelligence catches:

### 1. Generic AI Purple/Indigo Gradient (`UI-COLOR-001`, `UI-SLOP-002`)
* **The Pattern**: Hero sections and cards styled with `linear-gradient(135deg, #6366f1, #8b5cf6)` or variations of purple-to-indigo transitions.
* **The Problem**: Every AI-generated SaaS landing page uses this exact gradient, creating instant visual commoditization.
* **Detection**: Identifies purple/blue hue angles in gradient definitions across stylesheets.

### 2. Card-in-Card Nesting (`UI-SLOP-003`)
* **The Pattern**: Feature sections composed of a container card holding three equal-width child cards, each with shadow, border-radius, and icon.
* **The Problem**: Creates visual clutter and reduces information hierarchy—everything is equally weighted.
* **Detection**: Scans component trees for excessive card component nesting beyond adjusted surface thresholds.

### 3. Everything-Centered Layouts (`UI-SPATIAL-001`, `UI-SLOP-007`)
* **The Pattern**: `text-align: center` on body copy, features grids, and metadata, creating a layout that is relentlessly symmetrical and visually flat.
* **The Problem**: Appropriate for landing heroes, but not for content-dense pages, dashboards, or documentation.
* **Detection**: Calculates centering ratios across layout-significant elements per surface type.

### 4. Formulaic Hero Template (`UI-SLOP-010`)
* **The Pattern**: A landing page with a centered gradient headline, a two-sentence subtitle, a CTA button, and a feature grid below—generated identically regardless of product context.
* **The Problem**: Provides no signal about what the product actually does or who it is for.
* **Detection**: Detects compound signals (centered layout + gradient + CTA pattern + feature grid) on landing surfaces.

### 5. Excessive Font Size Variants (`UI-TYPE-002`)
* **The Pattern**: Defining 7–10 different font sizes across a page (`text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`, `text-5xl`) without a coherent type scale.
* **The Problem**: Destroys visual rhythm and typographic hierarchy.
* **Detection**: Counts unique font-size declarations against surface-adjusted thresholds.

### 6. Missing Accessibility Labels (`UI-A11Y-001` through `UI-A11Y-005`)
* **The Pattern**: Images without `alt` attributes, icon buttons without `aria-label`, form inputs without associated `<label>`, interactive `<div>` elements.
* **The Problem**: Fails WCAG 2.1 AA, excludes screen reader users, and fails Lighthouse audits.
* **Detection**: Static DOM analysis plus WCAG contrast pair evaluation.

---

## Installation

```bash
npx skills add devravik/engineering-intelligence
```

Or run the UI detector standalone:

```bash
ei detect:ui --url http://localhost:3000
ei detect:ui --file src/app/page.tsx
```

---

## UI Review Workflow

```bash
# Run UI detectors on local dev server
$ ei detect:ui --url http://localhost:3000

Engineering Intelligence — UI Analysis

NEW  UI-COLOR-001   Generic AI purple/blue gradient in hero section
     app/page.tsx

NEW  UI-SLOP-003    Excessive card usage: 9 cards detected (threshold: 6)
     app/features/page.tsx

NEW  UI-A11Y-002    Form inputs lacking associated labels: 3 inputs
     app/contact/page.tsx

NEW  UI-SPATIAL-001 Everything-centered layout detected
     app/page.tsx

4 UI findings

# Enforce gate before deploy
$ ei ship
BLOCK: 4 UI findings require resolution
```

---

## 49 UI Detectors Across 7 Categories

Engineering Intelligence's UI engine covers:

| Category | Rules | Focus |
|---|---|---|
| **Typography** | `UI-TYPE-*` | Heading hierarchy, font scale, body size, readability |
| **Color** | `UI-COLOR-*` | AI gradients, palette size, contrast ratios |
| **Spatial** | `UI-SPATIAL-*` | Centering ratios, nesting depth, spacing harmony |
| **AI Slop** | `UI-SLOP-*` | Compound slop signals, card density, formulaic heroes |
| **Design System** | `UI-DS-*` | CSS custom property absence, shadow token inflation |
| **Accessibility** | `UI-A11Y-*` | WCAG AA contrast, ARIA labels, touch targets |
| **Responsive** | `UI-RESP-*` | Mobile overflow, fixed-width assumptions, tap target size |

---

## Learn More

* [AI-Generated Code Review Overview](ai-code-review.md)
* [Cursor Code Quality for UI Development](cursor-code-quality.md)
* [Full 81 Problem & Rule Catalog](../problems.md)
