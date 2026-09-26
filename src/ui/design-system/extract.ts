/**
 * Design System Extraction Engine
 *
 * Implements the extract workflow with restraint doctrine:
 * Extract things that are genuinely reusable now (3+ uses threshold),
 * not everything that might someday become reusable.
 *
 * Output categories:
 * - SHARE: Repeated component pattern (used 3+ times)
 * - TOKENIZE: Repeated value (colors, spacing, radii used 3+ times)
 * - DO NOT EXTRACT: One-off components or rare values (1-2 uses)
 */

import { BrowserEvidence, VisualToken } from '../types.js';

export interface TokenExtractionCandidate {
  category: 'color' | 'spacing' | 'fontSize' | 'borderRadius' | 'shadow';
  value: string;
  count: number;
  cssVarName: string;
  recommendation: 'TOKENIZE' | 'DO_NOT_EXTRACT';
  rationale: string;
}

export interface ComponentExtractionCandidate {
  name: string;
  count: number;
  recommendation: 'SHARE' | 'DO_NOT_EXTRACT';
  rationale: string;
}

export interface ExtractionReport {
  tokenize: TokenExtractionCandidate[];
  share: ComponentExtractionCandidate[];
  doNotExtract: (TokenExtractionCandidate | ComponentExtractionCandidate)[];
  generatedCssVars: string;
  summary: {
    totalTokenCandidates: number;
    tokensToExtract: number;
    totalComponentCandidates: number;
    componentsToShare: number;
    suppressedItems: number;
  };
}

const REUSE_THRESHOLD = 3;

/**
 * Converts a token value to a slug suitable for CSS variable names.
 */
function toVarSlug(category: string, value: string, index: number): string {
  const cleanVal = value
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return `--${category}-${cleanVal || index + 1}`;
}

/**
 * Extracts candidate tokens and components from browser evidence.
 */
export function extractDesignSystem(evidence: BrowserEvidence): ExtractionReport {
  const tokenize: TokenExtractionCandidate[] = [];
  const share: ComponentExtractionCandidate[] = [];
  const doNotExtract: (TokenExtractionCandidate | ComponentExtractionCandidate)[] = [];

  const t = evidence.tokens;
  const c = evidence.components;

  // 1. Analyze Colors
  t.colors.forEach((color, idx) => {
    const candidate: TokenExtractionCandidate = {
      category: 'color',
      value: color.value,
      count: color.count,
      cssVarName: toVarSlug('color', color.value, idx),
      recommendation: color.count >= REUSE_THRESHOLD ? 'TOKENIZE' : 'DO_NOT_EXTRACT',
      rationale: color.count >= REUSE_THRESHOLD
        ? `Used across ${color.count} elements; standardizing as CSS variable eliminates color drift.`
        : `Only used ${color.count} time(s); premature tokenization creates variable bloat.`
    };

    if (candidate.recommendation === 'TOKENIZE') {
      tokenize.push(candidate);
    } else {
      doNotExtract.push(candidate);
    }
  });

  // 2. Analyze Spacing Values
  t.spacingValues.forEach((spacing, idx) => {
    const candidate: TokenExtractionCandidate = {
      category: 'spacing',
      value: spacing.value,
      count: spacing.count,
      cssVarName: toVarSlug('space', spacing.value, idx),
      recommendation: spacing.count >= REUSE_THRESHOLD ? 'TOKENIZE' : 'DO_NOT_EXTRACT',
      rationale: spacing.count >= REUSE_THRESHOLD
        ? `Appears in layout ${spacing.count} times; promote to spacing scale.`
        : `Infrequent spacing value (${spacing.count} occurrence(s)); avoid over-indexing.`
    };

    if (candidate.recommendation === 'TOKENIZE') {
      tokenize.push(candidate);
    } else {
      doNotExtract.push(candidate);
    }
  });

  // 3. Analyze Border Radii
  t.borderRadii.forEach((radius, idx) => {
    const candidate: TokenExtractionCandidate = {
      category: 'borderRadius',
      value: radius.value,
      count: radius.count,
      cssVarName: toVarSlug('radius', radius.value, idx),
      recommendation: radius.count >= REUSE_THRESHOLD ? 'TOKENIZE' : 'DO_NOT_EXTRACT',
      rationale: radius.count >= REUSE_THRESHOLD
        ? `Consistent container curvature (${radius.count} uses); enforce as standard radius token.`
        : `One-off radius (${radius.count} use); preserve as local override or align with standard scale.`
    };

    if (candidate.recommendation === 'TOKENIZE') {
      tokenize.push(candidate);
    } else {
      doNotExtract.push(candidate);
    }
  });

  // 4. Analyze Font Sizes
  t.fontSizes.forEach((fontSize, idx) => {
    const candidate: TokenExtractionCandidate = {
      category: 'fontSize',
      value: fontSize.value,
      count: fontSize.count,
      cssVarName: toVarSlug('font-size', fontSize.value, idx),
      recommendation: fontSize.count >= REUSE_THRESHOLD ? 'TOKENIZE' : 'DO_NOT_EXTRACT',
      rationale: fontSize.count >= REUSE_THRESHOLD
        ? `Typographic step used ${fontSize.count} times; formalize in type scale.`
        : `Ad-hoc size used ${fontSize.count} time(s); review for consolidation.`
    };

    if (candidate.recommendation === 'TOKENIZE') {
      tokenize.push(candidate);
    } else {
      doNotExtract.push(candidate);
    }
  });

  // 5. Analyze Component Repetition
  const componentCatalog: Array<{ name: string; count: number }> = [
    { name: 'Button', count: c.buttons },
    { name: 'Card', count: c.cards },
    { name: 'Badge/Pill', count: c.badges + c.pills },
    { name: 'Modal/Dialog', count: c.modals },
    { name: 'Form', count: c.forms },
    { name: 'Table', count: c.tables },
    { name: 'Banner/Alert', count: c.banners },
  ];

  for (const comp of componentCatalog) {
    if (comp.count === 0) continue;

    const candidate: ComponentExtractionCandidate = {
      name: comp.name,
      count: comp.count,
      recommendation: comp.count >= REUSE_THRESHOLD ? 'SHARE' : 'DO_NOT_EXTRACT',
      rationale: comp.count >= REUSE_THRESHOLD
        ? `Repeated ${comp.count} times across templates; extract into shared component primitive.`
        : `Appears only ${comp.count} time(s); keep as local element to prevent premature abstraction.`
    };

    if (candidate.recommendation === 'SHARE') {
      share.push(candidate);
    } else {
      doNotExtract.push(candidate);
    }
  }

  // 6. Generate CSS Custom Properties for Tokenized Items
  const cssLines: string[] = [':root {'];
  for (const tok of tokenize) {
    cssLines.push(`  ${tok.cssVarName}: ${tok.value}; /* used ${tok.count}x */`);
  }
  cssLines.push('}');
  const generatedCssVars = cssLines.join('\n');

  return {
    tokenize,
    share,
    doNotExtract,
    generatedCssVars,
    summary: {
      totalTokenCandidates: tokenize.length + doNotExtract.filter(i => 'category' in i).length,
      tokensToExtract: tokenize.length,
      totalComponentCandidates: share.length + doNotExtract.filter(i => !('category' in i)).length,
      componentsToShare: share.length,
      suppressedItems: doNotExtract.length
    }
  };
}

/**
 * Formats an extraction report into readable CLI text.
 */
export function formatExtractionReport(report: ExtractionReport): string {
  const lines: string[] = [];

  lines.push('================================================================');
  lines.push('             DESIGN SYSTEM EXTRACTION ANALYSIS');
  lines.push('         Restraint Doctrine: 3+ Reuses Threshold');
  lines.push('================================================================\n');

  lines.push('──── Candidates to TOKENIZE (3+ Usages) ────');
  if (report.tokenize.length === 0) {
    lines.push('  (no token values meet the 3+ reuse threshold)');
  } else {
    for (const t of report.tokenize) {
      lines.push(`  TOKENIZE  ${t.cssVarName.padEnd(24)} = ${t.value.padEnd(16)} (${t.count}x)`);
      lines.push(`            → ${t.rationale}`);
    }
  }
  lines.push('');

  lines.push('──── Components to SHARE (3+ Usages) ────');
  if (report.share.length === 0) {
    lines.push('  (no components meet the 3+ reuse threshold)');
  } else {
    for (const c of report.share) {
      lines.push(`  SHARE     ${c.name.padEnd(20)} (${c.count} instances)`);
      lines.push(`            → ${c.rationale}`);
    }
  }
  lines.push('');

  lines.push('──── DO NOT EXTRACT (Suppressed / One-Off) ────');
  const suppressed = report.doNotExtract.slice(0, 10);
  for (const item of suppressed) {
    if ('category' in item) {
      lines.push(`  KEEP LOCAL ${item.category.padEnd(14)} ${item.value.padEnd(16)} (${item.count}x) — ${item.rationale}`);
    } else {
      lines.push(`  KEEP LOCAL ${item.name.padEnd(14)} (${item.count}x) — ${item.rationale}`);
    }
  }
  if (report.doNotExtract.length > 10) {
    lines.push(`  ... and ${report.doNotExtract.length - 10} more suppressed infrequent items`);
  }
  lines.push('');

  lines.push('──── Generated CSS Custom Properties ────');
  lines.push(report.generatedCssVars);
  lines.push('\n================================================================\n');

  return lines.join('\n');
}
