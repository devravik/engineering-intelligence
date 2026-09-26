/**
 * Spatial / Layout Detectors (UI-SPATIAL-001 through UI-SPATIAL-009)
 *
 * This is where a lot of AI UI slop lives.
 * Everything centered, monotonous spacing, nested containers, cards inside cards.
 */

import { UIDetector, UIRawFinding, BrowserEvidence } from '../../types.js';

// ─── UI-SPATIAL-001: Everything Centered ────────────────────────────────────

export const uiSpatial001: UIDetector = {
  id: 'UI-SPATIAL-001',
  name: 'everything-centered',
  category: 'Spatial',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects excessive center-alignment suggesting monotonous "everything-centered" AI layout.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const { centeredElements, totalElements } = evidence.layout;

    if (totalElements === 0) return findings;

    const centeredRatio = centeredElements / totalElements;

    // If > 40% of alignment declarations are centering, flag it
    if (centeredElements > 8 && centeredRatio > 0.4) {
      findings.push({
        ruleId: 'UI-SPATIAL-001',
        category: 'Spatial',
        title: `Everything-centered layout: ${centeredElements} center-alignment declarations`,
        message: `${centeredElements} out of ${totalElements} elements use center alignment (${Math.round(centeredRatio * 100)}%). Excessive centering removes spatial hierarchy and makes all content feel equally important. Left-aligned content is faster to read and creates natural visual anchors.`,
        evidence: `${centeredElements}/${totalElements} elements centered (${Math.round(centeredRatio * 100)}%)`,
        confidence: 'MEDIUM',
        impact: 'HIGH',
        disposition: 'REVIEW',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Use left-alignment as the default. Center-align only hero text, headings, and intentional focal points.'
      });
    }

    return findings;
  }
};

// ─── UI-SPATIAL-002: Monotonous Spacing Scale ───────────────────────────────

export const uiSpatial002: UIDetector = {
  id: 'UI-SPATIAL-002',
  name: 'monotonous-spacing',
  category: 'Spatial',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects too many arbitrary spacing values or a single repeated value, indicating no deliberate spacing scale.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const spacingValues = evidence.tokens.spacingValues;

    if (spacingValues.length > 20) {
      findings.push({
        ruleId: 'UI-SPATIAL-002',
        category: 'Spatial',
        title: `Excessive spacing variants: ${spacingValues.length} unique values`,
        message: `Found ${spacingValues.length} distinct spacing values. A deliberate spacing system typically uses 8-12 values on a consistent scale (e.g., 4, 8, 12, 16, 24, 32, 48, 64px). Ad-hoc spacing creates visual noise.`,
        evidence: `Spacing values: ${spacingValues.map(t => t.value).slice(0, 10).join(', ')}...`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Consolidate spacing into a deliberate scale using design tokens (e.g., --space-1: 4px, --space-2: 8px, etc.).'
      });
    }

    // Check if one spacing value dominates (>60% usage)
    if (spacingValues.length > 0) {
      const totalUsage = spacingValues.reduce((sum, v) => sum + v.count, 0);
      const topValue = spacingValues.reduce((max, v) => v.count > max.count ? v : max, spacingValues[0]);

      if (totalUsage > 10 && topValue.count / totalUsage > 0.6) {
        findings.push({
          ruleId: 'UI-SPATIAL-002',
          category: 'Spatial',
          title: `Monotonous spacing: ${topValue.value} used ${Math.round(topValue.count / totalUsage * 100)}% of the time`,
          message: `The spacing value ${topValue.value} dominates with ${topValue.count} uses out of ${totalUsage} total. Uniform spacing eliminates visual hierarchy between sections, groups, and elements.`,
          evidence: `${topValue.value}: ${topValue.count}/${totalUsage} uses`,
          confidence: 'MEDIUM',
          impact: 'MEDIUM',
          disposition: 'REVIEW',
          ruleClass: 'HEURISTIC',
          suggestedFix: 'Vary spacing intentionally: use larger spacing between major sections, medium between groups, and tighter within components.'
        });
      }
    }

    return findings;
  }
};

// ─── UI-SPATIAL-005: Excessive Nesting Depth ────────────────────────────────

export const uiSpatial005: UIDetector = {
  id: 'UI-SPATIAL-005',
  name: 'excessive-nesting',
  category: 'Spatial',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects excessive container nesting depth, indicating "div soup" or unnecessary wrapper elements.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const depth = evidence.layout.maxNestingDepth;

    if (depth > 8) {
      findings.push({
        ruleId: 'UI-SPATIAL-005',
        category: 'Spatial',
        title: `Excessive nesting depth: ${depth} levels deep`,
        message: `Container elements are nested ${depth} levels deep. Excessive nesting creates "div soup," increases CSS specificity problems, and makes the layout brittle. AI-generated code often wraps elements in unnecessary containers.`,
        evidence: `Maximum div nesting depth: ${depth}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Flatten the DOM structure. Use CSS Grid/Flexbox for layout instead of nested wrapper divs.'
      });
    }

    return findings;
  }
};

// ─── UI-SPATIAL-007: Repeated Rounded Containers ────────────────────────────

export const uiSpatial007: UIDetector = {
  id: 'UI-SPATIAL-007',
  name: 'repeated-rounded-containers',
  category: 'Spatial',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive border-radius variants indicating "rounded-everything" AI aesthetic.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const radii = evidence.tokens.borderRadii;

    if (radii.length > 8) {
      findings.push({
        ruleId: 'UI-SPATIAL-007',
        category: 'Spatial',
        title: `Excessive border-radius variants: ${radii.length} unique values`,
        message: `Found ${radii.length} different border-radius values. A coherent design system typically uses 3-5 radius values (e.g., sm: 4px, md: 8px, lg: 16px, full: 9999px). Ad-hoc radii are a classic AI-generated-code signature.`,
        evidence: `Radii: ${radii.map(r => r.value).join(', ')}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Define a radius scale in design tokens (e.g., --radius-sm, --radius-md, --radius-lg, --radius-full).'
      });
    }

    return findings;
  }
};

// ─── UI-SPATIAL-008: Weak Alignment System ──────────────────────────────────

export const uiSpatial008: UIDetector = {
  id: 'UI-SPATIAL-008',
  name: 'weak-alignment-system',
  category: 'Spatial',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects absence of a deliberate alignment/grid system.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    if (!evidence.layout.gridUsage && !evidence.layout.flexUsage) {
      findings.push({
        ruleId: 'UI-SPATIAL-008',
        category: 'Spatial',
        title: 'No CSS Grid or Flexbox layout system detected',
        message: 'No CSS Grid or Flexbox usage found. Modern layouts should use CSS Grid for page structure and Flexbox for component alignment. Absence of these suggests layout is achieved through margins/padding positioning.',
        evidence: 'Grid: false, Flexbox: false',
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Adopt CSS Grid for page-level layout and Flexbox for component-level alignment.'
      });
    }

    return findings;
  }
};

export const spatialDetectors: UIDetector[] = [
  uiSpatial001,
  uiSpatial002,
  uiSpatial005,
  uiSpatial007,
  uiSpatial008
];
