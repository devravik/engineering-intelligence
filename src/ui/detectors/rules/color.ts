/**
 * Color Detectors (UI-COLOR-001 through UI-COLOR-007)
 *
 * Don't make: purple = bad
 * Instead:
 *   repeated generic palette
 *   + no product rationale
 *   + high visual prominence
 *   → confidence increases.
 */

import { UIDetector, UIRawFinding, BrowserEvidence } from '../../types.js';
import { isGenericAIGradient, checkContrast } from '../../browser/style-probe.js';

// ─── UI-COLOR-001: Generic Purple/Blue AI Gradient ──────────────────────────

export const uiColor001: UIDetector = {
  id: 'UI-COLOR-001',
  name: 'generic-ai-gradient',
  category: 'Color',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects the generic purple/blue/pink gradient pattern commonly produced by AI code generators.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const gradients = evidence.colors.gradients;

    const aiGradients = gradients.filter(g => isGenericAIGradient(g.value));

    if (aiGradients.length > 0) {
      findings.push({
        ruleId: 'UI-COLOR-001',
        category: 'Color',
        title: `Generic AI purple/blue gradient detected (${aiGradients.length}x)`,
        message: 'Purple-to-blue or purple-to-pink gradients are the most common AI-generated visual cliché. This is not inherently wrong, but combined with other AI aesthetic signals it indicates lack of deliberate design.',
        evidence: `Gradients: ${aiGradients.map(g => g.value).slice(0, 3).join('; ')}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'If using AI-generated gradients, verify they align with product brand colors. Consider a unique color identity.'
      });
    }

    return findings;
  }
};

// ─── UI-COLOR-002: Excessive Gradient Usage ─────────────────────────────────

export const uiColor002: UIDetector = {
  id: 'UI-COLOR-002',
  name: 'excessive-gradient-usage',
  category: 'Color',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects overuse of CSS gradients which creates visual noise.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const gradientCount = evidence.colors.gradients.length;

    // Surface-adjusted thresholds
    const maxGradients = evidence.surface === 'landing' || evidence.surface === 'marketing' ? 4 : 3;

    if (gradientCount > maxGradients) {
      findings.push({
        ruleId: 'UI-COLOR-002',
        category: 'Color',
        title: `Excessive gradient usage: ${gradientCount} gradient definitions`,
        message: `Found ${gradientCount} gradient definitions. Excessive gradients create visual noise and compete for attention. Each gradient should serve a clear visual purpose.`,
        evidence: `${gradientCount} gradients defined across stylesheets`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Limit gradients to 1-2 purposeful uses (e.g., hero background, primary CTA).'
      });
    }

    return findings;
  }
};

// ─── UI-COLOR-003: Too Many Accent Colors ───────────────────────────────────

export const uiColor003: UIDetector = {
  id: 'UI-COLOR-003',
  name: 'excessive-accent-colors',
  category: 'Color',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects color palette proliferation indicating absence of a deliberate color system.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const uniqueColors = evidence.tokens.colors.length;

    // Most design systems have 8-20 intentional colors
    if (uniqueColors > 25) {
      findings.push({
        ruleId: 'UI-COLOR-003',
        category: 'Color',
        title: `Excessive color palette: ${uniqueColors} unique color values`,
        message: `Found ${uniqueColors} distinct color values. A coherent design system typically uses 8-20 intentional colors. Excessive colors suggest values were chosen ad-hoc by the AI agent.`,
        evidence: `${uniqueColors} unique colors across stylesheets`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Consolidate into a deliberate color palette with semantic roles (primary, secondary, accent, neutral, semantic).'
      });
    }

    return findings;
  }
};

// ─── UI-COLOR-005: Weak Text/Background Contrast ────────────────────────────

export const uiColor005: UIDetector = {
  id: 'UI-COLOR-005',
  name: 'weak-text-contrast',
  category: 'Color',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects text/background color pairs that fail WCAG AA contrast requirements.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Check all contrast pairs if available from browser evidence
    for (const pair of evidence.colors.contrastPairs) {
      if (!pair.passes_AA) {
        findings.push({
          ruleId: 'UI-COLOR-005',
          category: 'Color',
          title: `WCAG AA contrast failure: ${pair.ratio}:1`,
          message: `Text color ${pair.foreground} on background ${pair.background} has a contrast ratio of ${pair.ratio}:1, below the WCAG AA minimum of 4.5:1. This makes text difficult to read for many users.`,
          evidence: `${pair.foreground} on ${pair.background} = ${pair.ratio}:1`,
          selector: pair.selector,
          confidence: 'HIGH',
          impact: 'HIGH',
          disposition: 'FIX',
          ruleClass: 'CERTAIN',
          suggestedFix: `Increase contrast to at least 4.5:1 by darkening the text or lightening the background.`
        });
      }
    }

    // Static analysis: check common patterns in CSS
    const textColors = evidence.colors.textColors;
    const bgColors = evidence.colors.backgroundColors;

    // Check light grays on white (very common AI slop)
    for (const tc of textColors) {
      for (const bg of bgColors) {
        if (tc.value.startsWith('#') && bg.value.startsWith('#')) {
          const result = checkContrast(tc.value, bg.value);
          if (result && !result.passes_AA && result.ratio > 1) {
            findings.push({
              ruleId: 'UI-COLOR-005',
              category: 'Color',
              title: `Static contrast failure: ${result.ratio}:1`,
              message: `Declared text color ${tc.value} against background ${bg.value} has contrast ratio ${result.ratio}:1, below WCAG AA (4.5:1).`,
              evidence: `${tc.value} on ${bg.value} = ${result.ratio}:1`,
              confidence: 'MEDIUM',
              impact: 'HIGH',
              disposition: 'REVIEW',
              ruleClass: 'PROBABLE',
              suggestedFix: 'Adjust color values to meet WCAG AA contrast requirements (4.5:1 for normal text).'
            });
          }
        }
      }
    }

    return findings;
  }
};

// ─── UI-COLOR-006: Inconsistent Semantic Colors ─────────────────────────────

export const uiColor006: UIDetector = {
  id: 'UI-COLOR-006',
  name: 'inconsistent-semantic-colors',
  category: 'Color',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects multiple different colors used for the same semantic role (e.g., different reds for error states).',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Group colors by approximate hue to detect multiple variants of the same semantic color
    const colorGroups = groupColorsByHue(evidence.tokens.colors.map(c => c.value));

    for (const [hue, colors] of Object.entries(colorGroups)) {
      if (colors.length > 4) {
        findings.push({
          ruleId: 'UI-COLOR-006',
          category: 'Color',
          title: `${colors.length} variants of ${hue} hue family`,
          message: `Found ${colors.length} different ${hue} color values. Multiple variants of the same hue suggest ad-hoc color selection rather than a deliberate color scale.`,
          evidence: `${hue} variants: ${colors.slice(0, 5).join(', ')}${colors.length > 5 ? '...' : ''}`,
          confidence: 'MEDIUM',
          impact: 'MEDIUM',
          disposition: 'REVIEW',
          ruleClass: 'HEURISTIC',
          suggestedFix: `Consolidate ${hue} colors into a deliberate scale (e.g., 50, 100, 200, ..., 900).`
        });
      }
    }

    return findings;
  }
};

function groupColorsByHue(hexColors: string[]): Record<string, string[]> {
  const groups: Record<string, string[]> = {};

  for (const color of hexColors) {
    if (!color.startsWith('#') || color.length < 7) continue;

    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);

    const hue = getHueCategory(r, g, b);
    if (!groups[hue]) groups[hue] = [];
    groups[hue].push(color);
  }

  return groups;
}

function getHueCategory(r: number, g: number, b: number): string {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;

  // Achromatic (gray/black/white)
  if (diff < 20) return 'neutral';

  let h: number;
  if (max === r) h = ((g - b) / diff) % 6;
  else if (max === g) h = (b - r) / diff + 2;
  else h = (r - g) / diff + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  if (h < 15 || h >= 345) return 'red';
  if (h < 45) return 'orange';
  if (h < 75) return 'yellow';
  if (h < 150) return 'green';
  if (h < 195) return 'cyan';
  if (h < 255) return 'blue';
  if (h < 285) return 'purple';
  if (h < 345) return 'pink';
  return 'neutral';
}

export const colorDetectors: UIDetector[] = [
  uiColor001,
  uiColor002,
  uiColor003,
  uiColor005,
  uiColor006
];
