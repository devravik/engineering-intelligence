# `ei ui` — UI Intelligence Engine

> Extends Engineering Intelligence to understand the rendered interface, not just source code.
> 
> Engineering: `code → evidence`  
> UI: `code → rendered page → evidence`

---

## Overview

The UI Intelligence Engine combines deterministic rendered-interface detectors (Playwright DOM snapshots, computed styles, axe-core accessibility trees, multi-viewport responsive captures), 5-pass visual reasoning, and durable design context (`DESIGN.md`).

Rather than calling everything generic "UI slop", EI classifies UI findings across a rigorous 12-category taxonomy:

```text
UI
├── Typography       (hierarchy, font-size variants, readability, font families)
├── Color            (palette explosion, generic AI gradients, WCAG contrast)
├── Spatial          (centering ratio, harmonic 4/8px grid, container nesting)
├── Composition      (focal points, competing weights, component density)
├── Components       (card overload, button proliferation, badge vibration)
├── Interaction      (semantic buttons, focus states, click targets)
├── Responsive       (375px/390px/768px/1024px/1440px viewport matrix, overflow)
├── Accessibility    (WCAG AA conformance, image alt, form labels, tabindex)
├── Motion           (reduced-motion compliance, transition timing)
├── Content          (UX copy specificity, vague CTAs)
├── Design System    (DESIGN.md context, CSS variables, shadow scale)
└── AI Slop          (formulaic SaaS cliches, decorative gradients, card walls)
```

---

## Command Reference

### `ei ui [surface]` (Automatic Intelligent Routing)
Automatically analyzes the interface, evaluates the 15 visual reasoning questions, and chooses only the necessary workflows.
```bash
ei ui
ei ui dashboard
ei ui landing
```

### `ei ui detect [path] [--json]`
Runs all 49 UI detectors against rendered or static browser evidence.
```bash
ei ui detect
ei ui detect --json
```

### `ei ui audit [path]`
Objective compliance audit focused on Accessibility, Responsive behavior, and Design Tokens.
```bash
ei ui audit
```

### `ei ui critique [path]`
Executes the flagship 5-pass critique pipeline:
- **Pass 1: Mechanical Evidence** (DOM, CSS, tokens, accessibility tree)
- **Pass 2: Anti-Pattern Signals** (generic SaaS composition, card walls, AI gradients)
- **Pass 3: Semantic Reasoning** (15 structured vision questions grounded in `DESIGN.md`)
- **Pass 4: Interventions** (`REMOVE`, `RESTRUCTURE`, `SIMPLIFY`, `RETYPE`, `RECOLOR`, `ADAPT`, `HARDEN`, `POLISH`)
- **Pass 5: Browser Verification** (Before/After screenshot & detector diff plan)
```bash
ei ui critique
```

### `ei ui distill [path]`
Anti-slop distillation enforcing the core principle: **"What can be removed before anything is added?"**
Identifies unnecessary cards, wrapper divs, and decorative badges.
```bash
ei ui distill
```

### `ei ui layout [path]`
Evaluates spatial composition, alignment systems (Grid/Flexbox), focal anchors, and text-centering ratios.
```bash
ei ui layout
```

### `ei ui typeset [path]`
Evaluates typographic hierarchy, heading skipping, modular font-size scales, and body text readability (>= 14px).
```bash
ei ui typeset
```

### `ei ui adapt [path]`
Evaluates responsiveness across the standard 5-viewport test matrix:
- **375px**: iPhone SE / Small Mobile
- **390px**: iPhone 14 / Standard Mobile
- **768px**: iPad / Tablet
- **1024px**: Small Desktop / Landscape Tablet
- **1440px**: Desktop / Standard Monitor
Detects horizontal scroll leaks, clipped content, and touch targets < 44px.
```bash
ei ui adapt
```

### `ei ui harden [path]`
Evaluates interface resilience: form input labels, non-semantic button divs (`<div onClick>`), empty states, and WCAG AA violations.
```bash
ei ui harden
```

### `ei ui clarify [path]`
Evaluates UX copy, replacing vague button labels ("click here", "submit") with task-specific action verbs.
```bash
ei ui clarify
```

### `ei ui polish [path]`
Calibrates micro-aesthetics: color palette cohesion, border-radius scale, elevation shadows, and text contrast.
```bash
ei ui polish
```

### `ei ui document [path]`
Extracts the existing visual system and generates `.ei/DESIGN.md`.
```bash
ei ui document
```

### `ei ui extract [path]`
Applies the **restraint doctrine** (3+ usages threshold) to extract genuinely reusable tokens and components:
- `TOKENIZE`: Repeated values used 3+ times (generates CSS custom properties)
- `SHARE`: Component patterns used 3+ times
- `DO NOT EXTRACT`: Suppresses premature abstraction for one-off elements
```bash
ei ui extract
```

### `ei ui onboard [path]`
Analyzes first-use path, time-to-first-value, empty-state guidance, and cognitive load.
```bash
ei ui onboard
```
