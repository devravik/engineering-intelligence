/**
 * Typography Detectors (UI-TYPE-001 through UI-TYPE-007)
 *
 * The point isn't "Inter is always bad."
 * The point is: Does this product have intentional typography?
 */

import { UIDetector, UIRawFinding, BrowserEvidence } from '../../types.js';
import { classifyFontUsage } from '../../browser/style-probe.js';

// ─── UI-TYPE-001: Weak Type Hierarchy ───────────────────────────────────────

export const uiType001: UIDetector = {
  id: 'UI-TYPE-001',
  name: 'weak-type-hierarchy',
  category: 'Typography',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects pages lacking a clear heading hierarchy (h1 → h2 → h3) or using too few heading levels.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const { headings } = evidence.typography;

    if (headings.length === 0) {
      findings.push({
        ruleId: 'UI-TYPE-001',
        category: 'Typography',
        title: 'No heading hierarchy detected',
        message: 'The page contains no heading elements (h1-h6). Typography hierarchy communicates information structure and helps users scan content.',
        evidence: 'Zero heading elements found in component tree.',
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Add a clear heading hierarchy (h1 for primary title, h2 for sections, h3 for subsections).'
      });
      return findings;
    }

    // Check for missing h1
    const hasH1 = headings.some(h => h.level === 1);
    if (!hasH1) {
      findings.push({
        ruleId: 'UI-TYPE-001',
        category: 'Typography',
        title: 'Missing primary heading (h1)',
        message: 'No h1 element found. Every page should have a single primary heading that identifies the page purpose.',
        evidence: `Found headings: ${headings.map(h => `h${h.level}`).join(', ')}`,
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Add a single h1 element as the primary page heading.'
      });
    }

    // Check for skipped heading levels (e.g., h1 → h3 without h2)
    const levels = [...new Set(headings.map(h => h.level))].sort();
    for (let i = 0; i < levels.length - 1; i++) {
      if (levels[i + 1] - levels[i] > 1) {
        findings.push({
          ruleId: 'UI-TYPE-001',
          category: 'Typography',
          title: `Skipped heading level: h${levels[i]} → h${levels[i + 1]}`,
          message: `Heading hierarchy jumps from h${levels[i]} to h${levels[i + 1]}, skipping h${levels[i] + 1}. This weakens information hierarchy and harms accessibility.`,
          evidence: `Heading levels used: ${levels.map(l => `h${l}`).join(', ')}`,
          confidence: 'HIGH',
          impact: 'MEDIUM',
          disposition: 'REVIEW',
          ruleClass: 'PROBABLE',
          suggestedFix: `Add h${levels[i] + 1} headings between h${levels[i]} and h${levels[i + 1]} sections.`
        });
      }
    }

    return findings;
  }
};

// ─── UI-TYPE-002: Excessive Font-Size Variants ──────────────────────────────

export const uiType002: UIDetector = {
  id: 'UI-TYPE-002',
  name: 'excessive-font-size-variants',
  category: 'Typography',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects proliferation of font-size values indicating absence of a deliberate type scale.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const uniqueFontSizes = evidence.tokens.fontSizes.length;

    // A well-designed type system typically has 6-10 font sizes
    if (uniqueFontSizes > 12) {
      findings.push({
        ruleId: 'UI-TYPE-002',
        category: 'Typography',
        title: `Excessive font-size variants: ${uniqueFontSizes} unique values`,
        message: `Found ${uniqueFontSizes} distinct font-size values. A coherent type scale typically uses 6-10 sizes. Excessive variants suggest values were invented ad-hoc rather than following a deliberate scale.`,
        evidence: `Font sizes: ${evidence.tokens.fontSizes.map(t => t.value).join(', ')}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Consolidate font sizes into a deliberate type scale (e.g., 12, 14, 16, 20, 24, 32, 40, 48px) and use design tokens.'
      });
    }

    return findings;
  }
};

// ─── UI-TYPE-003: Excessive Font-Weight Variants ────────────────────────────

export const uiType003: UIDetector = {
  id: 'UI-TYPE-003',
  name: 'excessive-font-weight-variants',
  category: 'Typography',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive font-weight values indicating weak weight hierarchy.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const uniqueWeights = evidence.tokens.fontWeights.length;

    // Typically 3-4 weights: regular (400), medium (500), semibold (600), bold (700)
    if (uniqueWeights > 6) {
      findings.push({
        ruleId: 'UI-TYPE-003',
        category: 'Typography',
        title: `Excessive font-weight variants: ${uniqueWeights} unique values`,
        message: `Found ${uniqueWeights} distinct font-weight values. Most designs use 3-4 weights to create clear hierarchy. Excessive weights dilute visual distinction.`,
        evidence: `Font weights: ${evidence.tokens.fontWeights.map(t => t.value).join(', ')}`,
        confidence: 'MEDIUM',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Limit font weights to 3-4 values (e.g., 400 regular, 500 medium, 600 semibold, 700 bold).'
      });
    }

    return findings;
  }
};

// ─── UI-TYPE-004: Body Text Below Readability Threshold ─────────────────────

export const uiType004: UIDetector = {
  id: 'UI-TYPE-004',
  name: 'body-text-readability',
  category: 'Typography',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects body text font-size below minimum readability threshold (14px).',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const bodySize = evidence.typography.bodyFontSize;

    if (bodySize) {
      const numericSize = parseFloat(bodySize);
      if (!isNaN(numericSize) && numericSize < 14 && !bodySize.includes('rem')) {
        findings.push({
          ruleId: 'UI-TYPE-004',
          category: 'Typography',
          title: `Body text below readability threshold: ${bodySize}`,
          message: `Body font-size is ${bodySize}, below the minimum readability threshold of 14px. Small body text causes eye strain and reduces content comprehension.`,
          evidence: `body font-size: ${bodySize}`,
          confidence: 'HIGH',
          impact: 'HIGH',
          disposition: 'FIX',
          ruleClass: 'CERTAIN',
          suggestedFix: 'Set body font-size to at least 16px (1rem) for comfortable reading.'
        });
      }
    }

    return findings;
  }
};

// ─── UI-TYPE-006: Generic / Default Font Usage ──────────────────────────────

export const uiType006: UIDetector = {
  id: 'UI-TYPE-006',
  name: 'generic-font-usage',
  category: 'Typography',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects use of browser-default or overly generic fonts without intentional typographic choice.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Surface-aware: developer tools and documentation get a pass on system fonts
    if (evidence.surface === 'developer-tool' || evidence.surface === 'documentation') {
      return findings;
    }

    const fontFamilies = evidence.tokens.fontFamilies;

    if (fontFamilies.length === 0) {
      findings.push({
        ruleId: 'UI-TYPE-006',
        category: 'Typography',
        title: 'No explicit font-family declarations',
        message: 'No font-family is explicitly set. The page relies entirely on browser defaults, which vary across platforms and lack visual intentionality.',
        evidence: 'Zero font-family declarations found.',
        confidence: 'HIGH',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Choose a deliberate font stack that reflects the product identity.'
      });
      return findings;
    }

    // Check if ALL fonts are generic/system
    const classifications = fontFamilies.map(f => classifyFontUsage(f.value));
    const allGeneric = classifications.every(c => c === 'generic');

    if (allGeneric && fontFamilies.length > 0) {
      findings.push({
        ruleId: 'UI-TYPE-006',
        category: 'Typography',
        title: 'Only generic/system fonts detected',
        message: `All ${fontFamilies.length} font declarations use generic system fonts. While functional, this signals no intentional typographic identity.`,
        evidence: `Fonts: ${fontFamilies.map(f => f.value).join(', ')}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Consider a deliberate primary typeface that communicates product identity.'
      });
    }

    return findings;
  }
};

export const typographyDetectors: UIDetector[] = [
  uiType001,
  uiType002,
  uiType003,
  uiType004,
  uiType006
];
