/**
 * Accessibility Probe — Static and Dynamic Accessibility Engine
 *
 * Provides accessibility evaluation conforming to WCAG 2.1 AA standards:
 * - Builds an accessibility tree from DOM structure or browser accessibility API
 * - Discovers violations: missing labels, missing alt text, low contrast, broken tab order
 * - Integrates with Playwright's page.accessibility.snapshot() when available
 */

import {
  AccessibilityReport,
  AccessibilityNode,
  AccessibilityViolation,
  DOMSnapshot,
  ColorInventory
} from '../types.js';

export interface AccessibilityProbeOptions {
  includePasses?: boolean;
}

/**
 * Generates an AccessibilityReport from static DOM and color evidence.
 */
export function buildStaticAccessibilityReport(
  dom: DOMSnapshot,
  colors: ColorInventory,
  options: AccessibilityProbeOptions = {}
): AccessibilityReport {
  const violations: AccessibilityViolation[] = [];
  let passes = 0;

  // 1. Check Image text alternatives (WCAG 1.1.1)
  for (const img of dom.images) {
    if (img.isDecorative) {
      passes++;
    } else if (!img.alt || img.alt.trim() === '') {
      violations.push({
        id: 'image-alt',
        impact: 'critical',
        description: 'Images must have alternate text',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/image-alt',
        nodes: [{
          html: `<img src="${img.src}" />`,
          target: [img.selector],
          failureSummary: 'Element does not have an alt attribute or text equivalent'
        }]
      });
    } else {
      passes++;
    }
  }

  // 2. Check Form input labels (WCAG 1.3.1, 4.1.2)
  for (const form of dom.forms) {
    for (const input of form.inputs) {
      if (input.type === 'hidden' || input.type === 'submit' || input.type === 'button') {
        passes++;
        continue;
      }
      if (!input.hasVisibleLabel && !input.label) {
        violations.push({
          id: 'label',
          impact: 'critical',
          description: 'Form elements must have labels',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/label',
          nodes: [{
            html: `<input type="${input.type}" name="${input.name || ''}" />`,
            target: [input.selector],
            failureSummary: 'Form element does not have an explicit or implicit label'
          }]
        });
      } else {
        passes++;
      }
    }
  }

  // 3. Check Button / Link text (WCAG 4.1.2)
  for (const el of dom.interactiveElements) {
    if (el.tag === 'button' || el.tag === 'a') {
      if (!el.text || el.text.trim() === '') {
        violations.push({
          id: 'button-name',
          impact: 'serious',
          description: 'Buttons and links must have discernible text',
          helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/button-name',
          nodes: [{
            html: `<${el.tag}>...</${el.tag}>`,
            target: [el.selector],
            failureSummary: 'Element does not have inner text or an aria-label'
          }]
        });
      } else {
        passes++;
      }
    }
  }

  // 4. Check Color contrast (WCAG 1.4.3)
  for (const pair of colors.contrastPairs) {
    if (!pair.passes_AA) {
      violations.push({
        id: 'color-contrast',
        impact: 'serious',
        description: 'Elements must have sufficient color contrast (4.5:1 for normal text)',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/color-contrast',
        nodes: [{
          html: `<span style="color: ${pair.foreground}; background: ${pair.background}">`,
          target: [pair.selector],
          failureSummary: `Element has insufficient contrast of ${pair.ratio.toFixed(2)}:1 (foreground: ${pair.foreground}, background: ${pair.background})`
        }]
      });
    } else {
      passes++;
    }
  }

  // 5. Check Tabindex positive values (WCAG 2.4.3)
  for (const el of dom.interactiveElements) {
    if (el.tabIndex > 0) {
      violations.push({
        id: 'tabindex',
        impact: 'moderate',
        description: 'Elements should not have tabindex greater than zero',
        helpUrl: 'https://dequeuniversity.com/rules/axe/4.4/tabindex',
        nodes: [{
          html: `<${el.tag} tabindex="${el.tabIndex}">`,
          target: [el.selector],
          failureSummary: `Element has tabindex="${el.tabIndex}" which disrupts natural tab order`
        }]
      });
    } else {
      passes++;
    }
  }

  // 6. Build a lightweight accessibility tree from headings and interactive elements
  const tree: AccessibilityNode = {
    role: 'document',
    name: dom.title || 'Page Document',
    children: [
      ...dom.headings.map(h => ({
        role: 'heading',
        name: h.text,
        level: h.level,
        children: []
      })),
      ...dom.interactiveElements.map(el => ({
        role: el.role || el.tag,
        name: el.text || el.tag,
        children: []
      }))
    ]
  };

  return {
    tree,
    violations,
    passes,
    incomplete: 0
  };
}
