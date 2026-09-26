/**
 * UI Hardening Reasoning Engine
 *
 * Evaluates interface resilience:
 * - Accessibility conformance (WCAG AA)
 * - Form label bindings and input validation
 * - Touch target dimensions (>= 44x44px)
 * - Non-semantic interactive elements
 * - Empty states and error handling
 */

import { BrowserEvidence } from '../types.js';

export interface HardeningFix {
  area: 'A11Y' | 'FORMS' | 'TOUCH_TARGETS' | 'INTERACTIVE_SEMANTICS' | 'EDGE_CASES';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  title: string;
  evidence: string;
  fix: string;
}

export interface HardeningAnalysisResult {
  accessibilityViolationsCount: number;
  unlabeledInputsCount: number;
  smallTouchTargetsCount: number;
  nonSemanticClickablesCount: number;
  fixes: HardeningFix[];
  readinessScore: number; // 0-100 (100 = bulletproof)
  summary: string;
}

export function hardenInterface(evidence: BrowserEvidence): HardeningAnalysisResult {
  const fixes: HardeningFix[] = [];
  const a11y = evidence.accessibility;
  const dom = evidence.dom;
  const caps = evidence.responsiveCaptures || [];

  // 1. Accessibility Violations
  for (const v of a11y.violations) {
    fixes.push({
      area: 'A11Y',
      priority: v.impact === 'critical' ? 'CRITICAL' : 'HIGH',
      title: `WCAG Violation: ${v.id}`,
      evidence: v.description,
      fix: `Refer to ${v.helpUrl || 'WCAG AA specifications'} to resolve node failures.`
    });
  }

  // 2. Form Inputs without Labels
  let unlabeledInputsCount = 0;
  for (const f of dom.forms) {
    for (const inp of f.inputs) {
      if (!inp.hasVisibleLabel && !inp.label) {
        unlabeledInputsCount++;
        fixes.push({
          area: 'FORMS',
          priority: 'HIGH',
          title: `Unlabeled form input: ${inp.name || inp.type} at ${inp.selector}`,
          evidence: `Input lacks associated <label> or aria-label attribute.`,
          fix: `Wrap with <label> or add aria-label="${inp.name || 'Input field'}".`
        });
      }
    }
  }

  // 3. Touch Target Sizing (Mobile viewports)
  let smallTouchTargetsCount = 0;
  for (const cap of caps) {
    if (cap.viewport.width <= 768) {
      const smalls = cap.touchTargets.filter(t => t.isTooSmall);
      smallTouchTargetsCount += smalls.length;
      for (const s of smalls.slice(0, 3)) {
        fixes.push({
          area: 'TOUCH_TARGETS',
          priority: 'MEDIUM',
          title: `Touch target too small on ${cap.viewport.label}: ${s.selector} (${s.width}x${s.height}px)`,
          evidence: `Minimum accessible touch target is ${s.minimumSize}x${s.minimumSize}px.`,
          fix: 'Add padding or min-height: 44px / min-width: 44px.'
        });
      }
    }
  }

  // 4. Non-semantic clickable elements
  let nonSemanticClickablesCount = 0;
  for (const el of dom.interactiveElements) {
    if ((el.tag === 'div' || el.tag === 'span') && el.role !== 'button') {
      nonSemanticClickablesCount++;
      fixes.push({
        area: 'INTERACTIVE_SEMANTICS',
        priority: 'HIGH',
        title: `Non-semantic clickable ${el.tag} element: ${el.selector}`,
        evidence: `Generic container used for user interaction without button role or keyboard tabIndex.`,
        fix: 'Replace with native <button type="button"> or add role="button" tabindex="0" with keyboard listener.'
      });
    }
  }

  // 5. Empty State Assessment
  if (evidence.components.cards === 0 && dom.forms.length === 0 && evidence.components.heroSections === 0) {
    fixes.push({
      area: 'EDGE_CASES',
      priority: 'MEDIUM',
      title: 'Missing zero-data / empty state container',
      evidence: 'No structured content blocks found in DOM snapshot.',
      fix: 'Provide an explicit empty-state view with an action link to prevent a blank canvas.'
    });
  }

  // Calculate readiness score (0-100)
  let penalty = 0;
  penalty += a11y.violations.length * 15;
  penalty += unlabeledInputsCount * 10;
  penalty += Math.min(30, smallTouchTargetsCount * 5);
  penalty += nonSemanticClickablesCount * 10;
  const readinessScore = Math.max(0, 100 - penalty);

  return {
    accessibilityViolationsCount: a11y.violations.length,
    unlabeledInputsCount,
    smallTouchTargetsCount,
    nonSemanticClickablesCount,
    fixes,
    readinessScore,
    summary: fixes.length === 0
      ? 'Interface is hardened. Accessibility, forms, touch targets, and semantics pass criteria.'
      : `Hardening required: ${fixes.length} issues identified (Readiness Score: ${readinessScore}/100).`
  };
}
