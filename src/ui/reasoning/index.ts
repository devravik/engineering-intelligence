/**
 * UI Reasoning Engine & Workflow Orchestrator
 *
 * Implements intelligent workflow routing:
 * Instead of blindly running all 12 workflows every time,
 * the reasoning layer analyzes detected problems and selects only
 * the relevant workflows:
 *
 * Detected problems:
 * - hierarchy / alignment    → layout
 * - excessive cards / slop   → distill
 * - weak type / scale drift  → typeset
 * - mobile overflow / touch  → adapt
 * - a11y / missing labels    → harden
 * - color drift / contrast   → polish
 * - repeated patterns (3+)   → extract
 * - missing design truth     → document
 */

import { BrowserEvidence, UIRawFinding, Surface, UICommand } from '../types.js';
import { runFivePassCritique, FivePassCritiqueResult } from './critique.js';
import { distillInterface, DistillationResult } from './distill.js';
import { analyzeLayout, LayoutAnalysisResult } from './layout.js';
import { analyzeTypography, TypographicAnalysisResult } from './typeset.js';
import { hardenInterface, HardeningAnalysisResult } from './harden.js';
import { polishInterface, PolishAnalysisResult } from './polish.js';
import { verifyUIChanges, VerificationDiff } from './verify.js';
import { extractDesignSystem, ExtractionReport } from '../design-system/extract.js';
import { loadDesignContext } from '../design-system/document.js';

export * from './questions.js';
export * from './distill.js';
export * from './layout.js';
export * from './typeset.js';
export * from './harden.js';
export * from './polish.js';
export * from './verify.js';
export * from './critique.js';

export interface WorkflowRoutingDecision {
  workflows: UICommand[];
  reasons: Record<UICommand, string>;
  critiqueResult: FivePassCritiqueResult;
}

/**
 * Chooses the appropriate workflows based on detected problems.
 */
export function chooseWorkflows(
  evidence: BrowserEvidence,
  findings: UIRawFinding[]
): WorkflowRoutingDecision {
  const workflows: UICommand[] = ['audit', 'critique'];
  const reasons: Record<string, string> = {
    audit: 'Standard baseline inspection',
    critique: 'Core 5-pass evaluation and visual/UX reasoning'
  };

  const categories = new Set(findings.map(f => f.category));

  // 1. Distill check: excessive cards or slop
  if (
    categories.has('UISlop') ||
    evidence.components.cards > 6 ||
    evidence.components.badges + evidence.components.pills > 6 ||
    evidence.layout.maxNestingDepth > 4
  ) {
    workflows.push('distill');
    reasons.distill = `Container/card bloat detected (${evidence.components.cards} cards, max depth: ${evidence.layout.maxNestingDepth})`;
  }

  // 2. Layout check: hierarchy or spatial
  if (
    categories.has('Spatial') ||
    categories.has('Composition') ||
    evidence.layout.centeredElements / Math.max(1, evidence.layout.totalElements) > 0.4
  ) {
    workflows.push('layout');
    reasons.layout = 'Spatial imbalance, centering overuse, or weak focal hierarchy';
  }

  // 3. Typeset check: typography
  if (
    categories.has('Typography') ||
    evidence.tokens.fontSizes.length > 8 ||
    evidence.dom.headings.length === 0
  ) {
    workflows.push('typeset');
    reasons.typeset = `Typography scale drift or missing heading structure (${evidence.tokens.fontSizes.length} font sizes)`;
  }

  // 4. Adapt check: responsive
  if (
    categories.has('Responsive') ||
    (evidence.responsiveCaptures && evidence.responsiveCaptures.some(c => c.overflowElements.length > 0))
  ) {
    workflows.push('adapt');
    reasons.adapt = 'Mobile viewport overflow or responsive scaling breakdown';
  }

  // 5. Harden check: accessibility or interaction
  if (
    categories.has('Accessibility') ||
    categories.has('Interaction') ||
    evidence.accessibility.violations.length > 0
  ) {
    workflows.push('harden');
    reasons.harden = `Resilience gaps (${evidence.accessibility.violations.length} accessibility violations)`;
  }

  // 6. Polish check: color or token drift
  if (
    categories.has('Color') ||
    categories.has('DesignSystem') ||
    evidence.tokens.colors.length > 12
  ) {
    workflows.push('polish');
    reasons.polish = `Micro-aesthetic divergence or color proliferation (${evidence.tokens.colors.length} colors)`;
  }

  // 7. Extract check: reusable patterns (3+ uses)
  const hasReusableTokens = evidence.tokens.colors.some(c => c.count >= 3) ||
                            evidence.tokens.spacingValues.some(s => s.count >= 3) ||
                            evidence.components.buttons >= 3 ||
                            evidence.components.cards >= 3;
  if (hasReusableTokens) {
    workflows.push('extract');
    reasons.extract = 'High repetition of component or token patterns (candidates for extraction)';
  }

  // 8. Document check: missing DESIGN.md
  if (findings.some(f => f.ruleId === 'UI-DS-004')) {
    workflows.push('document');
    reasons.document = 'Missing DESIGN.md design context document';
  }

  const critiqueResult = runFivePassCritique(evidence, findings);

  return {
    workflows: workflows as UICommand[],
    reasons: reasons as Record<UICommand, string>,
    critiqueResult
  };
}

/**
 * Formats a workflow routing summary for display in the CLI.
 */
export function formatWorkflowRouting(routing: WorkflowRoutingDecision): string {
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('             UI INTELLIGENCE REASONING ROUTER');
  lines.push('       "Intelligent Selection — Execute What Matters"');
  lines.push('================================================================\n');

  lines.push(`Disposition: ${routing.critiqueResult.disposition}`);
  lines.push(`Summary:     ${routing.critiqueResult.executiveSummary}\n`);

  lines.push('──── Selected Workflows & Justifications ────');
  for (const wf of routing.workflows) {
    const reason = routing.reasons[wf] || 'Selected';
    lines.push(`  → ${wf.toUpperCase().padEnd(12)} : ${reason}`);
  }
  lines.push('');

  lines.push('──── Key Interventions (Pass 4 Proposals) ────');
  for (const inter of routing.critiqueResult.pass4_interventions.slice(0, 6)) {
    lines.push(`  [${inter.action}] ${inter.title}`);
    lines.push(`    → ${inter.rationale}`);
  }
  if (routing.critiqueResult.pass4_interventions.length > 6) {
    lines.push(`  ... and ${routing.critiqueResult.pass4_interventions.length - 6} more proposed interventions`);
  }

  lines.push('\n================================================================\n');

  return lines.join('\n');
}
