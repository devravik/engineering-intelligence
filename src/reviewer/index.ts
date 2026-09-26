import { Category, Finding, Disposition, Severity, Confidence } from '../findings/types.js';

export interface DisciplineRow {
  category: Category;
  evidenceSymbol: '✓' | '~' | '✗';
  highestImpact: Severity | 'NONE';
  highestConfidence: Confidence | 'NONE';
  disposition: Disposition;
  findingsCount: number;
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
    resolvedCount: number;
  };
  finalDisposition: Disposition;
}

export function buildReviewMatrix(
  findings: Finding[],
  options: {
    unknownCount?: number;
    baselineCounts?: { baseline: number; new: number; resolved: number };
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
  let blockers = 0;
  let fix = 0;
  let advisory = 0;
  const unknown = options.unknownCount || 0;

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
      evidenceSymbol: '✓',
      highestImpact,
      highestConfidence,
      disposition: catDisposition,
      findingsCount: catFindings.length
    });
  }

  // Derive final terminal disposition
  let finalDisposition: Disposition = 'SHIP';
  if (blockers > 0) {
    finalDisposition = 'BLOCK';
  } else if (unknown > 0) {
    // UNKNOWN != PASS rule
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
      unknown
    },
    baselineAttribution: {
      baselineCount: options.baselineCounts?.baseline || 0,
      newCount: options.baselineCounts?.new || 0,
      resolvedCount: options.baselineCounts?.resolved || 0
    },
    finalDisposition
  };
}

export function formatReviewMatrix(matrix: ReviewMatrix, detailedFindings: Finding[] = []): string {
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
  lines.push('ATTRIBUTION:');
  lines.push(
    `  Baseline: ${matrix.baselineAttribution.baselineCount} existing | ` +
      `New: ${matrix.baselineAttribution.newCount} | ` +
      `Resolved: ${matrix.baselineAttribution.resolvedCount}`
  );
  lines.push('');
  lines.push('CURRENT STATE:');
  lines.push(`  BLOCKERS:  ${matrix.currentCounts.blockers}`);
  lines.push(`  FIX:       ${matrix.currentCounts.fix}`);
  lines.push(`  ADVISORY:  ${matrix.currentCounts.advisory}`);
  lines.push(`  UNKNOWN:   ${matrix.currentCounts.unknown}`);
  lines.push('');
  lines.push('================================================================');
  lines.push(`FINAL DISPOSITION: ${matrix.finalDisposition}`);
  lines.push('================================================================');

  if (detailedFindings.length > 0) {
    lines.push('');
    lines.push('DETAILED FINDINGS:');
    for (const f of detailedFindings) {
      lines.push(`- [${f.impact}] ${f.ruleId} (${f.category}): ${f.title}`);
      lines.push(`  File: ${f.filePath}:${f.line}`);
      lines.push(`  Baseline Status: ${f.baselineStatus} | Disposition: ${f.disposition}`);
      lines.push(`  Evidence: ${f.evidence}`);
      if (f.suggestedFix) {
        lines.push(`  Fix: ${f.suggestedFix}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
