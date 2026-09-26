/**
 * Composition Detectors (UI-COMP-001 through UI-COMP-007)
 *
 * This is where deterministic analysis identifies structural patterns
 * but composition quality ultimately requires semantic reasoning.
 *
 * The detector counts and measures. The reasoning layer judges.
 */

import { UIDetector, UIRawFinding, BrowserEvidence } from '../../types.js';

// ─── UI-COMP-001: No Dominant Visual Hierarchy ──────────────────────────────

export const uiComp001: UIDetector = {
  id: 'UI-COMP-001',
  name: 'no-dominant-hierarchy',
  category: 'Composition',
  severity: 'HIGH',
  ruleClass: 'HEURISTIC',
  description: 'Detects pages where multiple elements compete for primary attention without clear visual dominance.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const c = evidence.components;

    // Heuristic: many equally-weighted elements = no hierarchy
    const highWeightElements = c.heroSections + c.charts + c.banners;
    const mediumWeightElements = c.cards + c.tables;

    // If high-weight elements are numerous, hierarchy is weak
    if (highWeightElements > 3) {
      findings.push({
        ruleId: 'UI-COMP-001',
        category: 'Composition',
        title: `Multiple high-weight visual elements competing: ${highWeightElements}`,
        message: `Found ${highWeightElements} high-visual-weight elements (heroes, charts, banners). When multiple elements demand equal attention, the user cannot identify the primary task. Effective composition directs attention to one focal point.`,
        evidence: `heroes=${c.heroSections} charts=${c.charts} banners=${c.banners}`,
        confidence: 'MEDIUM',
        impact: 'HIGH',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Establish a single visual focal point. Reduce or visually demote competing elements.'
      });
    }

    return findings;
  }
};

// ─── UI-COMP-003: Excessive Dashboard Card Composition ──────────────────────

export const uiComp003: UIDetector = {
  id: 'UI-COMP-003',
  name: 'excessive-dashboard-cards',
  category: 'Composition',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive dashboard composition where everything is a card.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const c = evidence.components;

    // Composition: cards + badges + charts + icons in a single view
    const totalComponents = c.cards + c.badges + c.charts + c.icons + c.banners;

    if (totalComponents > 20) {
      findings.push({
        ruleId: 'UI-COMP-003',
        category: 'Composition',
        title: `Excessive component density: ${totalComponents} visual elements`,
        message: `${totalComponents} distinct visual components compete for attention (${c.cards} cards, ${c.badges} badges, ${c.charts} charts, ${c.icons} icons, ${c.banners} banners). High component density creates cognitive overload. The first question should be: what can be removed?`,
        evidence: `cards=${c.cards} badges=${c.badges} charts=${c.charts} icons=${c.icons} banners=${c.banners}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Apply the distill principle: What is the primary user task? Remove or hide secondary elements through progressive disclosure.'
      });
    }

    return findings;
  }
};

// ─── UI-COMP-006: Repeated Page Composition ─────────────────────────────────

export const uiComp006: UIDetector = {
  id: 'UI-COMP-006',
  name: 'repeated-page-composition',
  category: 'Composition',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects when multiple pages use the same hero+cards+CTA template structure.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    // This detector requires multi-page analysis which is done at the engine level
    // For single-page analysis, check for template-like composition
    const findings: UIRawFinding[] = [];
    const c = evidence.components;

    // Classic AI template: hero + 3 feature cards + CTA button
    const isTemplate = c.heroSections >= 1 && c.cards >= 3 && c.buttons >= 2;

    if (isTemplate && evidence.surface === 'landing') {
      // This is expected on a landing page, lower confidence
      return findings;
    }

    if (isTemplate && evidence.surface !== 'landing' && evidence.surface !== 'marketing') {
      findings.push({
        ruleId: 'UI-COMP-006',
        category: 'Composition',
        title: 'Generic hero+cards template structure on non-landing page',
        message: `Found hero section + ${c.cards} cards + CTA buttons on a ${evidence.surface || 'unknown'} surface. This composition pattern is typically used for landing/marketing pages and may not serve the actual user task.`,
        evidence: `hero=${c.heroSections} cards=${c.cards} buttons=${c.buttons} surface=${evidence.surface}`,
        confidence: 'LOW',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Verify the page composition serves the actual user workflow rather than following a generic template.'
      });
    }

    return findings;
  }
};

export const compositionDetectors: UIDetector[] = [
  uiComp001,
  uiComp003,
  uiComp006
];
