/**
 * UI Critique Reasoning Engine (5-Pass Pipeline)
 *
 * Implements the flagship 5-pass UI critique workflow:
 * - Pass 1: Evidence collection & mechanical inspection
 * - Pass 2: Anti-pattern signals (AI slop, visual noise)
 * - Pass 3: Semantic reasoning (grounding against DESIGN.md and task clarity)
 * - Pass 4: Intervention proposals (REMOVE, RESTRUCTURE, SIMPLIFY, RETYPE, RECOLOR, ADAPT, HARDEN, POLISH)
 * - Pass 5: Browser verification criteria
 */

import { BrowserEvidence, UIRawFinding, DesignContext } from '../types.js';
import { evaluateVisualReasoning, VisualReasoningEvaluation } from './questions.js';
import { distillInterface, DistillationResult } from './distill.js';
import { analyzeLayout, LayoutAnalysisResult } from './layout.js';
import { analyzeTypography, TypographicAnalysisResult } from './typeset.js';
import { hardenInterface, HardeningAnalysisResult } from './harden.js';
import { polishInterface, PolishAnalysisResult } from './polish.js';

export interface CritiqueIntervention {
  action: 'REMOVE' | 'RESTRUCTURE' | 'SIMPLIFY' | 'RETYPE' | 'RECOLOR' | 'ADAPT' | 'HARDEN' | 'POLISH';
  title: string;
  rationale: string;
  target?: string;
}

export interface FivePassCritiqueResult {
  surface: string;
  pass1_evidence: {
    domElements: number;
    tokensSummary: {
      colors: number;
      fontSizes: number;
      borderRadii: number;
      spacing: number;
    };
    mechanicalFindings: UIRawFinding[];
  };
  pass2_signals: {
    slopFindings: UIRawFinding[];
    compoundSlopDetected: boolean;
    slopSignature: string[];
  };
  pass3_reasoning: {
    evaluations: VisualReasoningEvaluation[];
    designContextViolation: boolean;
    primaryTaskClear: boolean;
    decorativeExcess: boolean;
  };
  pass4_interventions: CritiqueIntervention[];
  pass5_verificationPlan: {
    targetMetrics: string[];
    criticalChecks: string[];
  };
  disposition: 'BLOCK' | 'FIX' | 'REVIEW' | 'SHIP';
  executiveSummary: string;
}

/**
 * Runs the full 5-Pass Critique Pipeline on browser evidence.
 */
export function runFivePassCritique(
  evidence: BrowserEvidence,
  findings: UIRawFinding[],
  designContext?: DesignContext | null
): FivePassCritiqueResult {
  const surface = evidence.surface || 'unknown';

  // ── PASS 1: Evidence Collection & Mechanical Inspection ──────────────────
  const mechanicalCats = new Set(['Accessibility', 'Responsive', 'DesignSystem', 'Typography']);
  const mechanicalFindings = findings.filter(f => mechanicalCats.has(f.category));

  // ── PASS 2: Anti-Pattern Signals ──────────────────────────────────────────
  const slopFindings = findings.filter(f => f.category === 'UISlop' || f.category === 'Composition');
  const compound = findings.find(f => f.ruleId === 'UI-SLOP-COMPOUND');
  const slopSignature: string[] = [];

  if (evidence.components.cards >= 5) slopSignature.push('Card Container Wall');
  if (evidence.colors.gradients.length > 0) slopSignature.push('Decorative AI Gradient');
  if (evidence.layout.centeredElements / Math.max(1, evidence.layout.totalElements) > 0.4) slopSignature.push('Everything-Centered Layout');
  if (evidence.components.pills + evidence.components.badges >= 6) slopSignature.push('Pill/Badge Wallpaper');
  if (evidence.tokens.borderRadii.some(r => r.value === '9999px' || r.value === '50%')) slopSignature.push('Heavy Rounded Geometry');

  // ── PASS 3: Semantic Reasoning (15 Structured Questions) ──────────────────
  const evaluations = evaluateVisualReasoning(evidence);
  const primaryTaskEval = evaluations.find(e => e.questionId === 1);
  const decorativeEval = evaluations.find(e => e.questionId === 6);

  const primaryTaskClear = primaryTaskEval?.score === 'GOOD';
  const decorativeExcess = decorativeEval?.score !== 'GOOD';

  // Grounding against DESIGN.md
  let designContextViolation = false;
  if (designContext && designContext.colorSystem) {
    const primary = designContext.colorSystem.primary;
    if (primary && !evidence.tokens.colors.some(c => c.value.toLowerCase() === primary.toLowerCase())) {
      designContextViolation = true;
    }
  }

  // ── PASS 4: Interventions ─────────────────────────────────────────────────
  const interventions: CritiqueIntervention[] = [];

  // Distill interventions
  const distill = distillInterface(evidence);
  for (const dir of distill.directives) {
    interventions.push({
      action: dir.type === 'REMOVE' ? 'REMOVE' : dir.type === 'UNWRAP' ? 'SIMPLIFY' : 'RESTRUCTURE',
      title: dir.target,
      rationale: dir.rationale,
      target: dir.target
    });
  }

  // Layout interventions
  const layout = analyzeLayout(evidence);
  for (const inter of layout.interventions) {
    interventions.push({
      action: 'RESTRUCTURE',
      title: inter.title,
      rationale: inter.rationale
    });
  }

  // Typography interventions
  const typo = analyzeTypography(evidence);
  for (const tInter of typo.interventions) {
    interventions.push({
      action: 'RETYPE',
      title: tInter.title,
      rationale: tInter.rationale
    });
  }

  // Hardening interventions
  const hardening = hardenInterface(evidence);
  for (const hFix of hardening.fixes) {
    interventions.push({
      action: 'HARDEN',
      title: hFix.title,
      rationale: hFix.evidence,
      target: hFix.area
    });
  }

  // Polish interventions
  const polish = polishInterface(evidence);
  for (const pRef of polish.refinements) {
    interventions.push({
      action: pRef.area === 'COLOR' ? 'RECOLOR' : 'POLISH',
      title: `${pRef.area} alignment: ${pRef.element}`,
      rationale: pRef.rationale
    });
  }

  // ── PASS 5: Browser Verification Plan ────────────────────────────────────
  const pass5_verificationPlan = {
    targetMetrics: [
      `Reduce cards from ${evidence.components.cards} to <= ${distill.metrics.cardsRecommended}`,
      `Maintain 0 horizontal overflows on 375px/390px mobile viewports`,
      `Pass 100% WCAG AA text contrast checks (currently ${polish.contrastPassRate}%)`,
      `Achieve 0 console errors and clean DOM structure`
    ],
    criticalChecks: [
      'Take BEFORE screenshot at 375px and 1440px viewports',
      'Apply suggested REMOVE / SIMPLIFY modifications',
      'Take AFTER screenshot at matching viewports',
      'Run `ei ui detect` and verify delta shows 0 regressions'
    ]
  };

  // Determine overall critique disposition
  let disposition: 'BLOCK' | 'FIX' | 'REVIEW' | 'SHIP' = 'SHIP';
  if (hardening.fixes.some(f => f.priority === 'CRITICAL') || mechanicalFindings.some(f => f.disposition === 'BLOCK')) {
    disposition = 'BLOCK';
  } else if (interventions.some(i => i.action === 'REMOVE' || i.action === 'HARDEN') || findings.some(f => f.disposition === 'FIX')) {
    disposition = 'FIX';
  } else if (findings.length > 0 || slopSignature.length > 0) {
    disposition = 'REVIEW';
  }

  const executiveSummary = disposition === 'SHIP'
    ? '✓ Interface demonstrates disciplined typography, clean visual hierarchy, and absence of AI slop.'
    : `Found ${interventions.length} recommended interventions across 5 passes. Disposition: ${disposition}. Primary directive: REMOVE/SIMPLIFY before adding decorative styling.`;

  return {
    surface,
    pass1_evidence: {
      domElements: evidence.dom.elementCount,
      tokensSummary: {
        colors: evidence.tokens.colors.length,
        fontSizes: evidence.tokens.fontSizes.length,
        borderRadii: evidence.tokens.borderRadii.length,
        spacing: evidence.tokens.spacingValues.length
      },
      mechanicalFindings
    },
    pass2_signals: {
      slopFindings,
      compoundSlopDetected: Boolean(compound),
      slopSignature
    },
    pass3_reasoning: {
      evaluations,
      designContextViolation,
      primaryTaskClear,
      decorativeExcess
    },
    pass4_interventions: interventions,
    pass5_verificationPlan,
    disposition,
    executiveSummary
  };
}
