/**
 * Responsive UI Detectors (UI-RESP-001 through UI-RESP-008)
 *
 * Evaluates interface responsiveness across standard viewport classes:
 * 375px (iPhone SE), 390px (Standard Mobile), 768px (Tablet),
 * 1024px (Small Desktop), 1440px (Standard Desktop).
 *
 * Inspects both dynamic browser captures (overflow, touch targets, clipping)
 * and static layout indicators (fixed pixel widths, missing media queries, oversized typography).
 */

import { UIDetector, UIRawFinding, BrowserEvidence, ResponsiveCapture } from '../../types.js';

// ─── UI-RESP-001: Horizontal Viewport Overflow ─────────────────────────────

export const uiResp001: UIDetector = {
  id: 'UI-RESP-001',
  name: 'horizontal-viewport-overflow',
  category: 'Responsive',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects horizontal overflow where page content exceeds the viewport width on mobile or tablet.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    if (evidence.responsiveCaptures && evidence.responsiveCaptures.length > 0) {
      for (const cap of evidence.responsiveCaptures) {
        if (cap.viewport.width <= 768) {
          const horizontalOverflows = cap.overflowElements.filter(o => o.direction === 'horizontal');
          if (horizontalOverflows.length > 0) {
            const worst = horizontalOverflows.sort((a, b) => b.overflowAmount - a.overflowAmount)[0];
            findings.push({
              ruleId: 'UI-RESP-001',
              category: 'Responsive',
              title: `Horizontal overflow on ${cap.viewport.label} (${cap.viewport.width}px)`,
              message: `Element '${worst.selector}' overflows viewport horizontally by ${worst.overflowAmount}px. Horizontal scrolling on mobile frustrates users.`,
              selector: worst.selector,
              viewport: cap.viewport,
              evidence: `${horizontalOverflows.length} overflowing elements found; max overflow ${worst.overflowAmount}px at ${cap.viewport.width}px`,
              confidence: 'HIGH',
              impact: 'HIGH',
              disposition: 'FIX',
              ruleClass: 'CERTAIN',
              suggestedFix: 'Ensure container widths use max-width: 100%, flex-wrap: wrap, or overflow-x: auto where appropriate.'
            });
          }
        }
      }
    }

    return findings;
  }
};

// ─── UI-RESP-002: Content Clipping on Smaller Viewports ────────────────────

export const uiResp002: UIDetector = {
  id: 'UI-RESP-002',
  name: 'content-clipping',
  category: 'Responsive',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Detects critical text or interactive content clipped by overflow:hidden containers.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    if (evidence.responsiveCaptures) {
      for (const cap of evidence.responsiveCaptures) {
        if (cap.viewport.width <= 768 && cap.clippedElements.length > 0) {
          findings.push({
            ruleId: 'UI-RESP-002',
            category: 'Responsive',
            title: `Content clipped on ${cap.viewport.label}`,
            message: `${cap.clippedElements.length} elements are clipped on ${cap.viewport.label}. Text or controls may be inaccessible to users.`,
            viewport: cap.viewport,
            evidence: `Clipped elements: ${cap.clippedElements.slice(0, 3).join(', ')}`,
            confidence: 'HIGH',
            impact: 'HIGH',
            disposition: 'FIX',
            ruleClass: 'PROBABLE',
            suggestedFix: 'Remove fixed heights on containers with text content or allow responsive wrapping.'
          });
        }
      }
    }

    return findings;
  }
};

// ─── UI-RESP-004: Oversized Typography on Mobile ───────────────────────────

export const uiResp004: UIDetector = {
  id: 'UI-RESP-004',
  name: 'oversized-mobile-typography',
  category: 'Responsive',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects heading or display typography exceeding 40px without responsive scaling.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Check font sizes for sizes > 40px when no fluid typography (clamp) or responsive scale is used
    const largeSizes = evidence.tokens.fontSizes.filter(f => {
      const match = f.value.match(/^(\d+(?:\.\d+)?)(px|rem)$/);
      if (!match) return false;
      const px = match[2] === 'rem' ? parseFloat(match[1]) * 16 : parseFloat(match[1]);
      return px >= 42;
    });

    const hasFluidType = evidence.tokens.fontSizes.some(f => f.value.includes('clamp(') || f.value.includes('vw'));

    if (largeSizes.length > 0 && !hasFluidType && evidence.tokens.breakpoints.length === 0) {
      findings.push({
        ruleId: 'UI-RESP-004',
        category: 'Responsive',
        title: `Oversized static typography (${largeSizes.map(s => s.value).join(', ')}) lacking mobile adaptation`,
        message: `Found display font sizes ≥42px without responsive breakpoints or fluid clamp() scaling. Headlines will wrap awkwardly or overflow mobile screens.`,
        evidence: `Large font sizes: ${largeSizes.map(s => s.value).join(', ')}; fluid clamp: false; breakpoints: 0`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Use clamp() for fluid typography (e.g. clamp(1.75rem, 4vw, 3rem)) or scale headings down in mobile media queries.'
      });
    }

    return findings;
  }
};

// ─── UI-RESP-005: Tiny Touch Targets (< 44px) ──────────────────────────────

export const uiResp005: UIDetector = {
  id: 'UI-RESP-005',
  name: 'tiny-touch-targets',
  category: 'Responsive',
  severity: 'HIGH',
  ruleClass: 'CERTAIN',
  description: 'Detects touch targets smaller than WCAG 2.5.5 / Apple HIG recommended 44x44px.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    if (evidence.responsiveCaptures) {
      for (const cap of evidence.responsiveCaptures) {
        if (cap.viewport.width <= 768) {
          const tinyTargets = cap.touchTargets.filter(t => t.isTooSmall);
          if (tinyTargets.length > 0) {
            findings.push({
              ruleId: 'UI-RESP-005',
              category: 'Responsive',
              title: `${tinyTargets.length} undersized touch targets on mobile (${cap.viewport.label})`,
              message: `Found ${tinyTargets.length} interactive elements smaller than minimum recommended 44x44px touch area (smallest: ${tinyTargets[0].width}x${tinyTargets[0].height}px for '${tinyTargets[0].selector}').`,
              selector: tinyTargets[0].selector,
              viewport: cap.viewport,
              evidence: `${tinyTargets.length} targets < 44px; example: ${tinyTargets[0].selector} (${tinyTargets[0].width}x${tinyTargets[0].height}px)`,
              confidence: 'HIGH',
              impact: 'HIGH',
              disposition: 'FIX',
              ruleClass: 'CERTAIN',
              suggestedFix: 'Increase padding or min-width / min-height on mobile touch targets to at least 44px (or 48px for Android).'
            });
          }
        }
      }
    }

    return findings;
  }
};

// ─── UI-RESP-006: Desktop-Only Layout Assumptions ──────────────────────────

export const uiResp006: UIDetector = {
  id: 'UI-RESP-006',
  name: 'desktop-only-assumptions',
  category: 'Responsive',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects hardcoded container widths > 800px without responsive adaptation or media queries.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Check containers with hardcoded pixel widths > 800px
    const wideFixedContainers = evidence.layout.containers.filter(c => {
      const match = c.width.match(/^(\d+)px$/);
      return match && parseInt(match[1], 10) > 800;
    });

    if (wideFixedContainers.length > 0 && evidence.tokens.breakpoints.length === 0) {
      findings.push({
        ruleId: 'UI-RESP-006',
        category: 'Responsive',
        title: `Desktop-only layout assumption: ${wideFixedContainers.length} wide fixed containers`,
        message: `Found containers with fixed widths > 800px (${wideFixedContainers.map(c => c.width).join(', ')}) without media queries or responsive breakpoints. This will break on tablet and mobile viewports.`,
        evidence: `Fixed wide containers: ${wideFixedContainers.map(c => `${c.selector}: ${c.width}`).join(', ')}`,
        confidence: 'MEDIUM',
        impact: 'HIGH',
        disposition: 'FIX',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Replace fixed pixel widths with max-width: 100% or responsive percentage/grid layouts.'
      });
    }

    return findings;
  }
};

// ─── UI-RESP-008: Hidden Primary Action on Mobile ──────────────────────────

export const uiResp008: UIDetector = {
  id: 'UI-RESP-008',
  name: 'hidden-mobile-primary-action',
  category: 'Responsive',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects landing or checkout pages where primary action is omitted or hidden on mobile.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    if (evidence.surface === 'landing' || evidence.surface === 'checkout') {
      const totalButtons = evidence.components.buttons;
      if (totalButtons === 0 && evidence.dom.interactiveElements.filter(e => e.tag === 'a' || e.tag === 'button').length === 0) {
        findings.push({
          ruleId: 'UI-RESP-008',
          category: 'Responsive',
          title: `No visible primary action on ${evidence.surface} surface`,
          message: `The page surface is classified as '${evidence.surface}' but contains zero buttons or prominent call-to-action links.`,
          evidence: `surface=${evidence.surface}, buttons=0, links=${evidence.dom.links.length}`,
          confidence: 'MEDIUM',
          impact: 'HIGH',
          disposition: 'REVIEW',
          ruleClass: 'HEURISTIC',
          suggestedFix: 'Ensure the primary user call-to-action (Sign Up, Get Started, Buy) is immediately accessible.'
        });
      }
    }

    return findings;
  }
};

export const responsiveDetectors: UIDetector[] = [
  uiResp001,
  uiResp002,
  uiResp004,
  uiResp005,
  uiResp006,
  uiResp008
];
