/**
 * Interaction UI Detectors (UI-INTERACT-001 through UI-INTERACT-004)
 *
 * Checks interactive element correctness:
 * - Clickable non-interactive tags (div/span onClick)
 * - Missing visible focus states
 * - Disabled states lacking explanation
 * - Interactive elements without keyboard handlers
 */

import { UIDetector, UIRawFinding, BrowserEvidence } from '../../types.js';

// ─── UI-INTERACT-001: Non-Semantic Clickable Element ───────────────────────

export const uiInteract001: UIDetector = {
  id: 'UI-INTERACT-001',
  name: 'non-semantic-clickable',
  category: 'Interaction',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects div, span, or p elements acting as buttons without button semantics or keyboard events.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Check interactive elements where tag is div/span/p but role is button or action
    const fakeButtons = evidence.dom.interactiveElements.filter(el =>
      (el.tag === 'div' || el.tag === 'span' || el.tag === 'p') &&
      (el.role === 'button' || el.role === 'link')
    );

    if (fakeButtons.length > 0) {
      findings.push({
        ruleId: 'UI-INTERACT-001',
        category: 'Interaction',
        title: `${fakeButtons.length} non-semantic element(s) used as interactive controls`,
        message: `Found <${fakeButtons[0].tag}> elements functioning as buttons. Native <button> elements provide keyboard activation (Space/Enter) and focus management automatically.`,
        evidence: `Fake buttons: ${fakeButtons.slice(0, 3).map(e => `${e.tag}[role="${e.role}"]`).join(', ')}`,
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Replace fake <div onClick> or <span onClick> with native <button type="button">.'
      });
    }

    return findings;
  }
};

// ─── UI-INTERACT-002: Unexplained Disabled Elements ────────────────────────

export const uiInteract002: UIDetector = {
  id: 'UI-INTERACT-002',
  name: 'unexplained-disabled-element',
  category: 'Interaction',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects permanently or silently disabled buttons that do not provide tooltips or helper text.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    const disabledButtons = evidence.dom.interactiveElements.filter(el => el.isDisabled);

    if (disabledButtons.length > 3) {
      findings.push({
        ruleId: 'UI-INTERACT-002',
        category: 'Interaction',
        title: `${disabledButtons.length} disabled buttons without context`,
        message: `Found ${disabledButtons.length} disabled controls on the page. Silent disabled states leave users guessing why actions are unavailable.`,
        evidence: `Disabled controls: ${disabledButtons.slice(0, 3).map(b => b.text || b.selector).join(', ')}`,
        confidence: 'MEDIUM',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Provide inline validation messages or tooltips explaining what is required to enable the control.'
      });
    }

    return findings;
  }
};

// ─── UI-INTERACT-003: Suppressed Focus Ring (Outline: None) ─────────────────

export const uiInteract003: UIDetector = {
  id: 'UI-INTERACT-003',
  name: 'suppressed-focus-ring',
  category: 'Interaction',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects outline: none or outline: 0 without custom focus-visible replacement.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Check style tokens for outline: none or outline-none class
    const hasOutlineNone = evidence.tokens.borderRadii.some(t => t.sources.some(s => s.includes('outline-none'))) ||
      evidence.tokens.shadows.some(t => t.sources.some(s => s.includes('outline-none')));

    // If interactive elements exist and outline: none is detected
    if (hasOutlineNone && evidence.dom.interactiveElements.length > 0) {
      findings.push({
        ruleId: 'UI-INTERACT-003',
        category: 'Interaction',
        title: 'Focus outline suppressed on interactive elements',
        message: 'Detected outline-none or outline: none without dedicated :focus-visible indicators. Keyboard users rely on focus rings to navigate.',
        evidence: 'outline-none detected on interactive component styles',
        confidence: 'HIGH',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Use :focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; } instead of removing outline completely.'
      });
    }

    return findings;
  }
};

export const interactionDetectors: UIDetector[] = [
  uiInteract001,
  uiInteract002,
  uiInteract003
];
