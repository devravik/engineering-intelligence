import { Category, Finding, EIFinding, Disposition, Severity, Confidence } from '../findings/types.js';

export interface DisciplineRow {
  category: Category;
  evidenceSymbol: '✓' | '~' | '✗';
  highestImpact: Severity | 'NONE';
  highestConfidence: Confidence | 'NONE';
  disposition: Disposition;
  findingsCount: number;
}

export interface ReviewRecommendation {
  ruleId: string;
  category: Category;
  severity: Severity;
  target: string;
  action: string;
  rationale: string;
}

export interface ReviewUnknown {
  area: string;
  reason: string;
  guidance: string;
}

export interface ReviewMatrix {
  disciplines: DisciplineRow[];
  currentCounts: {
    blockers: number;
    fix: number;
    advisory: number;
    unknown: number;
  };
  baselineAttribution: {
    baselineCount: number;
    newCount: number;
    modifiedCount: number;
    resolvedCount: number;
    unknownCount: number;
  };
  recommendations: ReviewRecommendation[];
  unknowns: ReviewUnknown[];
  finalDisposition: Disposition;
}

export interface ShipGateResult {
  passed: boolean;
  terminalDisposition: 'BLOCK' | 'FIX' | 'SHIP';
  blockers: number;
  fixes: number;
  unknowns: number;
  reasons: string[];
  matrix: ReviewMatrix;
}

/**
 * Builds the diagnostic Review Matrix for `ei review`.
 * Evaluates disciplines, evidence, attribution, confidence, recommendations, and highlighted UNKNOWN areas.
 */
export function buildReviewMatrix(
  findings: (Finding | EIFinding)[],
  options: {
    unknownCount?: number;
    baselineCounts?: {
      baseline?: number;
      new?: number;
      modified?: number;
      resolved?: number;
      unknown?: number;
    };
  } = {}
): ReviewMatrix {
  const categories: Category[] = [
    'Architecture',
    'Security',
    'Database',
    'CodeQuality',
    'Testing',
    'Slop'
  ];

  const disciplines: DisciplineRow[] = [];
  const recommendations: ReviewRecommendation[] = [];
  const unknowns: ReviewUnknown[] = [];

  let blockers = 0;
  let fix = 0;
  let advisory = 0;

  // Process findings and populate recommendations & unknowns
  for (const f of findings) {
    if (f.suggestedFix) {
      recommendations.push({
        ruleId: f.ruleId,
        category: f.category,
        severity: f.impact,
        target: `${f.filePath || f.evidence?.file || 'unknown'}:${f.line || f.evidence?.line || 1}`,
        action: f.suggestedFix,
        rationale: f.title
      });
    }

    if (f.attribution === 'UNKNOWN' || f.confidence === 'LOW') {
      unknowns.push({
        area: `${f.filePath || f.evidence?.file || 'unknown'}:${f.line || f.evidence?.line || 1} (${f.ruleId})`,
        reason: f.confidence === 'LOW' ? 'Low-confidence heuristic detection' : 'Unattributed baseline origin',
        guidance: 'Verify manually with git blame or inspect upstream contracts.'
      });
    }

    if (f.ruleId === 'TEST-001') {
      unknowns.push({
        area: `${f.filePath || f.evidence?.file || 'unknown'} (Test Coverage)`,
        reason: 'Modified source behavior without accompanying regression tests',
        guidance: 'Author explicit unit or integration tests for the modified execution path.'
      });
    }
  }

  // Handle explicit unknownCount option
  const totalUnknowns = (options.unknownCount !== undefined ? options.unknownCount : unknowns.length);
  if (options.unknownCount && unknowns.length === 0) {
    for (let i = 0; i < options.unknownCount; i++) {
      unknowns.push({
        area: `Unverified surface #${i + 1}`,
        reason: 'Unverified execution branch or omitted test verification',
        guidance: 'Perform deterministic test execution or add explicit verification waivers.'
      });
    }
  }

  for (const cat of categories) {
    const catFindings = findings.filter(f => f.category === cat);
    if (catFindings.length === 0) {
      disciplines.push({
        category: cat,
        evidenceSymbol: '✓',
        highestImpact: 'NONE',
        highestConfidence: 'NONE',
        disposition: 'SHIP',
        findingsCount: 0
      });
      continue;
    }

    let highestImpact: Severity = 'LOW';
    let highestConfidence: Confidence = 'LOW';
    let catDisposition: Disposition = 'IGNORE';

    for (const f of catFindings) {
      // Impact ranking: CRITICAL > HIGH > MEDIUM > LOW
      if (f.impact === 'CRITICAL') highestImpact = 'CRITICAL';
      else if (f.impact === 'HIGH' && highestImpact !== 'CRITICAL') highestImpact = 'HIGH';
      else if (f.impact === 'MEDIUM' && highestImpact === 'LOW') highestImpact = 'MEDIUM';

      // Confidence ranking
      if (f.confidence === 'HIGH') highestConfidence = 'HIGH';
      else if (f.confidence === 'MEDIUM' && highestConfidence === 'LOW') highestConfidence = 'MEDIUM';

      // Counts
      if (f.disposition === 'BLOCK') blockers++;
      else if (f.disposition === 'FIX') fix++;
      else advisory++;
    }

    // Determine category disposition
    if (highestImpact === 'CRITICAL') catDisposition = 'BLOCK';
    else if (highestImpact === 'HIGH') catDisposition = 'FIX';
    else if (highestImpact === 'MEDIUM') catDisposition = 'REVIEW';
    else catDisposition = 'IGNORE';

    disciplines.push({
      category: cat,
      evidenceSymbol: highestImpact === 'CRITICAL' ? '✗' : highestImpact === 'HIGH' ? '~' : '✓',
      highestImpact,
      highestConfidence,
      disposition: catDisposition,
      findingsCount: catFindings.length
    });
  }

  // Derive diagnostic summary disposition
  let finalDisposition: Disposition = 'SHIP';
  if (blockers > 0) {
    finalDisposition = 'BLOCK';
  } else if (totalUnknowns > 0) {
    finalDisposition = 'BLOCK';
  } else if (fix > 0) {
    finalDisposition = 'FIX';
  } else if (advisory > 0) {
    finalDisposition = 'REVIEW';
  }

  return {
    disciplines,
    currentCounts: {
      blockers,
      fix,
      advisory,
      unknown: totalUnknowns
    },
    baselineAttribution: {
      baselineCount: options.baselineCounts?.baseline || 0,
      newCount: options.baselineCounts?.new || 0,
      modifiedCount: options.baselineCounts?.modified || 0,
      resolvedCount: options.baselineCounts?.resolved || 0,
      unknownCount: options.baselineCounts?.unknown || totalUnknowns
    },
    recommendations,
    unknowns,
    finalDisposition
  };
}

/**
 * Formats the diagnostic output for `ei review`.
 * Emphasizes findings, evidence, attribution, confidence, recommendations, and UNKNOWN areas.
 */
export function formatReviewMatrix(matrix: ReviewMatrix, detailedFindings: (Finding | EIFinding)[] = []): string {
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('                     ENGINEERING REVIEW MATRIX                  ');
  lines.push('================================================================');
  lines.push('');
  lines.push(
    `Discipline`.padEnd(16) +
      `Evidence`.padEnd(12) +
      `Impact`.padEnd(14) +
      `Confidence`.padEnd(14) +
      `Disposition`
  );
  lines.push('----------------------------------------------------------------');

  for (const d of matrix.disciplines) {
    const impactStr = d.highestImpact === 'NONE' ? '-' : d.highestImpact;
    const confStr = d.highestConfidence === 'NONE' ? '-' : d.highestConfidence;
    lines.push(
      `${d.category}`.padEnd(16) +
        `${d.evidenceSymbol}`.padEnd(12) +
        `${impactStr}`.padEnd(14) +
        `${confStr}`.padEnd(14) +
        `${d.disposition}`
    );
  }

  lines.push('----------------------------------------------------------------');
  lines.push('BASELINE ATTRIBUTION:');
  lines.push(
    `  Baseline: ${matrix.baselineAttribution.baselineCount} existing | ` +
      `New: ${matrix.baselineAttribution.newCount} | ` +
      `Modified: ${matrix.baselineAttribution.modifiedCount} | ` +
      `Resolved: ${matrix.baselineAttribution.resolvedCount}`
  );
  lines.push('');
  lines.push('SESSION SUMMARY:');
  lines.push(`  BLOCKERS:      ${matrix.currentCounts.blockers}`);
  lines.push(`  FIX REQUIRED:  ${matrix.currentCounts.fix}`);
  lines.push(`  ADVISORY:      ${matrix.currentCounts.advisory}`);
  lines.push(`  UNKNOWN AREAS: ${matrix.currentCounts.unknown}`);

  // Highlight UNKNOWN areas requiring engineering judgment / LLM reasoning
  if (matrix.unknowns.length > 0) {
    lines.push('');
    lines.push('UNKNOWN / UNVERIFIED SURFACES (Requires Reasoning or Coverage):');
    for (const u of matrix.unknowns) {
      lines.push(`  ? ${u.area}`);
      lines.push(`    Reason:   ${u.reason}`);
      lines.push(`    Guidance: ${u.guidance}`);
    }
  }

  // Highlight actionable recommendations
  if (matrix.recommendations.length > 0) {
    lines.push('');
    lines.push('ACTIONABLE RECOMMENDATIONS:');
    for (const r of matrix.recommendations) {
      lines.push(`  → [${r.severity}] ${r.target} (${r.ruleId}): ${r.action}`);
      lines.push(`    Rationale: ${r.rationale}`);
    }
  }

  if (detailedFindings.length > 0) {
    lines.push('');
    lines.push('DETAILED FINDINGS & PHYSICAL EVIDENCE:');
    for (const f of detailedFindings) {
      const file = f.evidence?.file || f.filePath;
      const line = f.evidence?.line || f.line;
      const hash = f.evidence?.hash || f.evidenceHash;
      const snippet = f.evidence?.snippet || String(f.evidence);
      const attribution = f.attribution || f.baselineStatus;

      lines.push(`- [${f.impact}] ${f.ruleId} (${f.category}): ${f.title}`);
      lines.push(`  Location:    ${file}:${line} [hash: ${hash}]`);
      lines.push(`  Attribution: ${attribution} | Confidence: ${f.confidence} | Disposition: ${f.disposition}`);
      lines.push(`  Evidence:    ${snippet}`);
      if (f.suggestedFix) {
        lines.push(`  Action:      ${f.suggestedFix}`);
      }
      lines.push('');
    }
  }

  lines.push('================================================================');
  lines.push(`REVIEW DISPOSITION: ${matrix.finalDisposition}`);
  lines.push('================================================================');

  return lines.join('\n');
}

/**
 * Evaluates the terminal release gate for `ei ship`.
 * Strictly enforces `UNKNOWN != PASS` and blocks if blockers or required fixes remain.
 */
export function evaluateShipGate(
  matrix: ReviewMatrix,
  findings: (Finding | EIFinding)[] = []
): ShipGateResult {
  const reasons: string[] = [];
  let terminalDisposition: 'BLOCK' | 'FIX' | 'SHIP' = 'SHIP';

  if (matrix.currentCounts.blockers > 0) {
    terminalDisposition = 'BLOCK';
    reasons.push(`${matrix.currentCounts.blockers} unresolved BLOCKER(s) detected in release path.`);
  }

  if (matrix.currentCounts.unknown > 0) {
    terminalDisposition = 'BLOCK';
    reasons.push(
      `${matrix.currentCounts.unknown} UNKNOWN verification area(s) remain. UNKNOWN != PASS: release gate requires explicit verification.`
    );
  }

  if (terminalDisposition !== 'BLOCK' && matrix.currentCounts.fix > 0) {
    terminalDisposition = 'FIX';
    reasons.push(
      `${matrix.currentCounts.fix} high-priority FIX issue(s) must be resolved or explicitly waived before shipping.`
    );
  }

  const passed = terminalDisposition === 'SHIP';
  return {
    passed,
    terminalDisposition,
    blockers: matrix.currentCounts.blockers,
    fixes: matrix.currentCounts.fix,
    unknowns: matrix.currentCounts.unknown,
    reasons,
    matrix
  };
}

/**
 * Formats the release verification report for `ei ship`.
 */
export function formatShipGate(gate: ShipGateResult): string {
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('               PRODUCTION RELEASE VERIFICATION GATE             ');
  lines.push('================================================================\n');

  const check = (ok: boolean) => (ok ? '✓ PASS' : '✗ FAIL');

  lines.push('RELEASE PRECONDITIONS:');
  lines.push(`  ${check(gate.blockers === 0)} Zero Critical Blockers (${gate.blockers} active)`);
  lines.push(`  ${check(gate.unknowns === 0)} Zero Unverified Surfaces (${gate.unknowns} unknown, UNKNOWN != PASS)`);
  lines.push(`  ${check(gate.fixes === 0)} Zero Mandatory Fixes (${gate.fixes} required)`);
  lines.push('');

  lines.push('----------------------------------------------------------------');
  if (gate.terminalDisposition === 'BLOCK') {
    lines.push('🛑 RELEASE GATE VERDICT: BLOCKED');
    lines.push('----------------------------------------------------------------');
    lines.push('The release gate has rejected deployment for the following reasons:');
    for (const r of gate.reasons) {
      lines.push(`  • ${r}`);
    }
    lines.push('\nAction Required: Resolve blockers and verify all unknown surfaces before shipping.');
  } else if (gate.terminalDisposition === 'FIX') {
    lines.push('⚠️ RELEASE GATE VERDICT: ACTION REQUIRED');
    lines.push('----------------------------------------------------------------');
    lines.push('Deployment is held pending mandatory fixes:');
    for (const r of gate.reasons) {
      lines.push(`  • ${r}`);
    }
    lines.push('\nAction Required: Address flagged fixes or add explicit waivers with justifications.');
  } else {
    lines.push('🟢 RELEASE GATE VERDICT: APPROVED (SHIP)');
    lines.push('----------------------------------------------------------------');
    lines.push('✓ All deterministic contracts, baseline verifications, and gate criteria satisfied.');
    lines.push('Code is safe and ready for deployment.');
  }
  lines.push('================================================================');

  return lines.join('\n');
}
