/**
 * Accessibility UI Detectors (UI-A11Y-001 through UI-A11Y-005)
 *
 * Checks core accessibility compliance based on WCAG 2.1 AA guidelines:
 * - Image text alternatives (1.1.1)
 * - Form labels (1.3.1, 4.1.2)
 * - Name, Role, Value for interactive elements (4.1.2)
 * - Color contrast (1.4.3)
 * - Focus order and tabindex manipulation (2.4.3)
 *
 * Integrates with both static DOM extraction and axe-core browser reports.
 */

import { UIDetector, UIRawFinding, BrowserEvidence } from '../../types.js';

// ─── UI-A11Y-001: Missing Image Alt Text ────────────────────────────────────

export const uiA11y001: UIDetector = {
  id: 'UI-A11Y-001',
  name: 'missing-image-alt-text',
  category: 'Accessibility',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects informative images lacking meaningful alt attributes.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const missingAlt = evidence.dom.images.filter(img => !img.isDecorative && img.alt.trim() === '');

    if (missingAlt.length > 0) {
      findings.push({
        ruleId: 'UI-A11Y-001',
        category: 'Accessibility',
        title: `${missingAlt.length} image(s) missing alt text`,
        message: `Found ${missingAlt.length} images without an alt attribute or description. Screen readers cannot describe these images to visually impaired users.`,
        evidence: `Missing alt on: ${missingAlt.slice(0, 3).map(img => img.src || '<inline>').join(', ')}`,
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'CERTAIN',
        suggestedFix: 'Add descriptive alt text to informative images, or alt="" / role="presentation" if purely decorative.'
      });
    }

    return findings;
  }
};

// ─── UI-A11Y-002: Form Input Missing Associated Label ──────────────────────

export const uiA11y002: UIDetector = {
  id: 'UI-A11Y-002',
  name: 'missing-form-label',
  category: 'Accessibility',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects form inputs lacking visible label or aria-label.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Check all form inputs
    const unlabelledInputs: string[] = [];
    for (const form of evidence.dom.forms) {
      for (const input of form.inputs) {
        if (!input.hasVisibleLabel && !input.label && input.type !== 'hidden' && input.type !== 'submit') {
          unlabelledInputs.push(input.selector || input.name || input.type);
        }
      }
    }

    if (unlabelledInputs.length > 0) {
      findings.push({
        ruleId: 'UI-A11Y-002',
        category: 'Accessibility',
        title: `${unlabelledInputs.length} form input(s) lacking associated label`,
        message: `Found inputs without an associated <label> or aria-label: ${unlabelledInputs.slice(0, 3).join(', ')}. Placeholders are not accessible replacements for labels.`,
        evidence: `Unlabelled inputs: ${unlabelledInputs.slice(0, 5).join(', ')}`,
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'CERTAIN',
        suggestedFix: 'Associate a <label for="..."> element with each input, or supply an aria-label attribute.'
      });
    }

    return findings;
  }
};

// ─── UI-A11Y-003: Empty Interactive Element (Icon Buttons without Text) ─────

export const uiA11y003: UIDetector = {
  id: 'UI-A11Y-003',
  name: 'empty-interactive-element',
  category: 'Accessibility',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects buttons and links with no text content and no aria-label.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    const emptyButtons = evidence.dom.interactiveElements.filter(el => {
      if (el.tag === 'button' || el.tag === 'a') {
        const hasText = el.text && el.text.trim().length > 0;
        return !hasText && el.isVisible;
      }
      return false;
    });

    if (emptyButtons.length > 0) {
      findings.push({
        ruleId: 'UI-A11Y-003',
        category: 'Accessibility',
        title: `${emptyButtons.length} interactive element(s) without accessible text`,
        message: `Found ${emptyButtons.length} buttons or links containing no visible text or aria-label (e.g. icon-only buttons). Screen readers cannot announce their purpose.`,
        evidence: `${emptyButtons.length} empty elements; selectors: ${emptyButtons.slice(0, 3).map(e => e.selector).join(', ')}`,
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'CERTAIN',
        suggestedFix: 'Provide aria-label="..." on icon-only buttons or add visually-hidden text (<span className="sr-only">).'
      });
    }

    return findings;
  }
};

// ─── UI-A11Y-004: Insufficient Color Contrast ──────────────────────────────

export const uiA11y004: UIDetector = {
  id: 'UI-A11Y-004',
  name: 'insufficient-color-contrast',
  category: 'Accessibility',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects text and background pairs failing WCAG 2.1 AA minimum contrast (4.5:1 for normal text).',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const failingPairs = evidence.colors.contrastPairs.filter(p => !p.passes_AA);

    if (failingPairs.length > 0) {
      const worst = failingPairs.sort((a, b) => a.ratio - b.ratio)[0];
      findings.push({
        ruleId: 'UI-A11Y-004',
        category: 'Accessibility',
        title: `${failingPairs.length} text color contrast failure(s) under WCAG AA`,
        message: `Found text elements with contrast ratio below 4.5:1. Lowest contrast is ${worst.ratio.toFixed(2)}:1 (${worst.foreground} on ${worst.background}) at '${worst.selector}'.`,
        selector: worst.selector,
        evidence: `${failingPairs.length} contrast violations; worst ratio: ${worst.ratio.toFixed(2)}:1`,
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'CERTAIN',
        suggestedFix: 'Adjust text or background color to achieve at least 4.5:1 contrast for normal body text and 3:1 for large text.'
      });
    }

    return findings;
  }
};

// ─── UI-A11Y-005: Positive Tabindex Antipattern ─────────────────────────────

export const uiA11y005: UIDetector = {
  id: 'UI-A11Y-005',
  name: 'positive-tabindex-antipattern',
  category: 'Accessibility',
  severity: 'MEDIUM',
  ruleClass: 'CERTAIN',
  description: 'Detects positive tabindex values (> 0) that disrupt natural keyboard navigation flow.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const positiveTabElements = evidence.dom.interactiveElements.filter(el => el.tabIndex > 0);

    if (positiveTabElements.length > 0) {
      findings.push({
        ruleId: 'UI-A11Y-005',
        category: 'Accessibility',
        title: `Positive tabindex used on ${positiveTabElements.length} element(s)`,
        message: `Found elements with tabindex > 0. Positive tabindex overrides the natural DOM tab order and makes keyboard navigation unpredictable.`,
        evidence: `tabindex > 0 on: ${positiveTabElements.slice(0, 3).map(e => `${e.selector} (tabindex=${e.tabIndex})`).join(', ')}`,
        confidence: 'HIGH',
        impact: 'MEDIUM',
        disposition: 'FIX',
        ruleClass: 'CERTAIN',
        suggestedFix: 'Use tabindex="0" to insert elements into natural DOM tab order, or structure DOM source in logical order.'
      });
    }

    return findings;
  }
};

export const accessibilityDetectors: UIDetector[] = [
  uiA11y001,
  uiA11y002,
  uiA11y003,
  uiA11y004,
  uiA11y005
];
