/**
 * Design System Detectors
 *
 * Inspects whether the codebase maintains a coherent design system
 * or if the AI agent invented a new value every time it needed one.
 *
 * Is there a coherent design system here, or did the agent
 * invent a new value every time it needed one?
 *
 * That is classic AI slop.
 */

import { UIDetector, UIRawFinding, BrowserEvidence } from '../../types.js';

// ─── UI-DS-001: Excessive Shadow Definitions ────────────────────────────────

export const uiDs001: UIDetector = {
  id: 'UI-DS-001',
  name: 'excessive-shadow-definitions',
  category: 'DesignSystem',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects excessive box-shadow/elevation definitions indicating no deliberate elevation system.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const shadows = evidence.tokens.shadows;

    // A design system typically has 3-5 elevation levels
    if (shadows.length > 6) {
      findings.push({
        ruleId: 'UI-DS-001',
        category: 'DesignSystem',
        title: `Excessive shadow definitions: ${shadows.length} unique values`,
        message: `Found ${shadows.length} distinct box-shadow values. Design systems typically define 3-5 elevation levels (e.g., sm, md, lg, xl). Ad-hoc shadows suggest the AI generated unique values per component.`,
        evidence: `Shadow variants: ${shadows.map(s => s.value.slice(0, 40)).join('; ')}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Consolidate shadows into an elevation scale: --shadow-sm, --shadow-md, --shadow-lg, --shadow-xl.'
      });
    }

    return findings;
  }
};

// ─── UI-DS-002: No CSS Variables / Design Tokens ────────────────────────────

export const uiDs002: UIDetector = {
  id: 'UI-DS-002',
  name: 'no-design-tokens',
  category: 'DesignSystem',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects absence of CSS custom properties (variables) suggesting no tokenized design system.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Check if any tokens reference CSS variables
    const allTokenValues = [
      ...evidence.tokens.colors,
      ...evidence.tokens.spacingValues,
      ...evidence.tokens.fontSizes,
      ...evidence.tokens.borderRadii,
      ...evidence.tokens.shadows
    ];

    const hasVarReferences = allTokenValues.some(t =>
      t.value.includes('var(') || t.value.startsWith('--')
    );

    // If there are many hard-coded values but no variables, flag it
    const totalHardcoded = allTokenValues.filter(t =>
      !t.value.includes('var(') && !t.value.startsWith('--')
    ).length;

    if (!hasVarReferences && totalHardcoded > 20) {
      findings.push({
        ruleId: 'UI-DS-002',
        category: 'DesignSystem',
        title: `No CSS custom properties: ${totalHardcoded} hard-coded values`,
        message: `Found ${totalHardcoded} hard-coded design values without CSS custom properties (--var). Design tokens enable consistent theming, dark mode support, and systematic design changes.`,
        evidence: `${totalHardcoded} hard-coded values, 0 CSS variable references`,
        confidence: 'MEDIUM',
        impact: 'HIGH',
        disposition: 'REVIEW',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Introduce CSS custom properties for colors, spacing, typography, and shadows (e.g., --color-primary, --space-4, --text-base).'
      });
    }

    return findings;
  }
};

// ─── UI-DS-003: Arbitrary Z-Index Values ────────────────────────────────────

export const uiDs003: UIDetector = {
  id: 'UI-DS-003',
  name: 'arbitrary-z-index',
  category: 'DesignSystem',
  severity: 'LOW',
  ruleClass: 'PROBABLE',
  description: 'Detects arbitrary z-index values suggesting no deliberate stacking context system.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const zIndices = evidence.tokens.zIndices;

    if (zIndices.length > 5) {
      // Check for "magic number" z-indices (999, 9999, 99999)
      const magicNumbers = zIndices.filter(z => {
        const num = parseInt(z.value, 10);
        return num > 100 || (num > 10 && !Number.isInteger(num / 10));
      });

      if (magicNumbers.length > 2) {
        findings.push({
          ruleId: 'UI-DS-003',
          category: 'DesignSystem',
          title: `Arbitrary z-index values: ${zIndices.length} unique values (${magicNumbers.length} magic numbers)`,
          message: `Found ${zIndices.length} distinct z-index values including magic numbers like ${magicNumbers.map(z => z.value).join(', ')}. Define a deliberate stacking scale.`,
          evidence: `z-indices: ${zIndices.map(z => z.value).join(', ')}`,
          confidence: 'MEDIUM',
          impact: 'LOW',
          disposition: 'REVIEW',
          ruleClass: 'PROBABLE',
          suggestedFix: 'Define a z-index scale: --z-dropdown: 10, --z-sticky: 20, --z-overlay: 30, --z-modal: 40, --z-toast: 50.'
        });
      }
    }

    return findings;
  }
};

// ─── UI-DS-004: Missing DESIGN.md ───────────────────────────────────────────

export const uiDs004: UIDetector = {
  id: 'UI-DS-004',
  name: 'missing-design-context',
  category: 'DesignSystem',
  severity: 'MEDIUM',
  ruleClass: 'CERTAIN',
  description: 'Detects absence of DESIGN.md design context document.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    // This detector is invoked from the UI engine with context about
    // whether DESIGN.md exists. The evidence.tokens serve as proxy here.
    // Actual file check happens at the engine level.
    return [];
  }
};

export const designSystemDetectors: UIDetector[] = [
  uiDs001,
  uiDs002,
  uiDs003,
  uiDs004
];
