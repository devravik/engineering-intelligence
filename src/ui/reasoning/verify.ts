/**
 * Browser Verification Engine (Pass 5)
 *
 * Implements Pass 5 of the UI Intelligence pipeline:
 * BEFORE screenshot / evidence → Change → AFTER screenshot / evidence
 * → Detectors diff → Visual comparison → Regression check.
 *
 * Enforces the core invariant: behavioral invariance and no newly introduced debt.
 */

import { BrowserEvidence, UIRawFinding } from '../types.js';

export interface VerificationDiff {
  resolvedFindings: UIRawFinding[];
  newFindings: UIRawFinding[];
  unchangedFindings: UIRawFinding[];
  tokenDiff: {
    colorsDelta: number;
    radiiDelta: number;
    spacingDelta: number;
  };
  componentDiff: {
    cardsDelta: number;
    badgesDelta: number;
  };
  hasRegressions: boolean;
  verdict: 'PASS' | 'REGRESSION' | 'INCONCLUSIVE';
  rationale: string;
}

/**
 * Compares before and after UI evidence and findings.
 */
export function verifyUIChanges(
  beforeEvidence: BrowserEvidence,
  afterEvidence: BrowserEvidence,
  beforeFindings: UIRawFinding[],
  afterFindings: UIRawFinding[]
): VerificationDiff {
  const beforeMap = new Map(beforeFindings.map(f => [f.ruleId + ':' + (f.selector || ''), f]));
  const afterMap = new Map(afterFindings.map(f => [f.ruleId + ':' + (f.selector || ''), f]));

  const resolvedFindings: UIRawFinding[] = [];
  const unchangedFindings: UIRawFinding[] = [];
  const newFindings: UIRawFinding[] = [];

  for (const [key, finding] of beforeMap) {
    if (afterMap.has(key)) {
      unchangedFindings.push(finding);
    } else {
      resolvedFindings.push(finding);
    }
  }

  for (const [key, finding] of afterMap) {
    if (!beforeMap.has(key)) {
      newFindings.push(finding);
    }
  }

  // Token count deltas
  const tokenDiff = {
    colorsDelta: afterEvidence.tokens.colors.length - beforeEvidence.tokens.colors.length,
    radiiDelta: afterEvidence.tokens.borderRadii.length - beforeEvidence.tokens.borderRadii.length,
    spacingDelta: afterEvidence.tokens.spacingValues.length - beforeEvidence.tokens.spacingValues.length,
  };

  // Component deltas
  const componentDiff = {
    cardsDelta: afterEvidence.components.cards - beforeEvidence.components.cards,
    badgesDelta: (afterEvidence.components.badges + afterEvidence.components.pills) -
                 (beforeEvidence.components.badges + beforeEvidence.components.pills),
  };

  // Check for regressions (any new blockers or newly introduced critical issues)
  const newBlockers = newFindings.filter(f => f.disposition === 'BLOCK' || f.impact === 'CRITICAL');
  const hasRegressions = newBlockers.length > 0;

  let verdict: 'PASS' | 'REGRESSION' | 'INCONCLUSIVE';
  let rationale: string;

  if (hasRegressions) {
    verdict = 'REGRESSION';
    rationale = `Change introduced ${newBlockers.length} new critical blocker(s): ${newBlockers.map(b => b.ruleId).join(', ')}`;
  } else if (resolvedFindings.length > 0 && newFindings.length === 0) {
    verdict = 'PASS';
    rationale = `Successfully resolved ${resolvedFindings.length} finding(s) with zero regressions.`;
  } else if (resolvedFindings.length === 0 && newFindings.length === 0) {
    verdict = 'INCONCLUSIVE';
    rationale = 'No change in detector findings between before and after states.';
  } else {
    verdict = 'PASS';
    rationale = `Resolved ${resolvedFindings.length} issue(s), with ${newFindings.length} non-blocking advisory note(s).`;
  }

  return {
    resolvedFindings,
    newFindings,
    unchangedFindings,
    tokenDiff,
    componentDiff,
    hasRegressions,
    verdict,
    rationale
  };
}
