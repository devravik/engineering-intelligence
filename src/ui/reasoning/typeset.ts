/**
 * Typography Reasoning Engine
 *
 * Evaluates typographic hierarchy, intentional font choices,
 * readability thresholds, and type scale proliferation.
 */

import { BrowserEvidence } from '../types.js';

export interface TypographicIntervention {
  category: 'HIERARCHY' | 'SCALE' | 'READABILITY' | 'IDENTITY';
  title: string;
  rationale: string;
  fix: string;
}

export interface TypographicAnalysisResult {
  hasValidHeadingHierarchy: boolean;
  fontSizeCount: number;
  fontWeightCount: number;
  bodyFontSizePx: number;
  fontFamilies: string[];
  interventions: TypographicIntervention[];
  summary: string;
}

export function analyzeTypography(evidence: BrowserEvidence): TypographicAnalysisResult {
  const interventions: TypographicIntervention[] = [];
  const typo = evidence.typography;
  const t = evidence.tokens;

  // 1. Heading Hierarchy
  const headings = typo.headings;
  let hasValidHeadingHierarchy = true;
  if (headings.length > 0) {
    const hasH1 = headings.some(h => h.level === 1);
    if (!hasH1) {
      hasValidHeadingHierarchy = false;
      interventions.push({
        category: 'HIERARCHY',
        title: 'Missing top-level <h1> heading',
        rationale: 'An interface requires an <h1> landmark for document outline and accessibility semantics.',
        fix: 'Designate the primary section or page title as an <h1> element.'
      });
    }

    // Check level skipping (e.g., h1 to h3)
    for (let i = 0; i < headings.length - 1; i++) {
      if (headings[i + 1].level > headings[i].level + 1) {
        hasValidHeadingHierarchy = false;
        interventions.push({
          category: 'HIERARCHY',
          title: `Skipped heading level: h${headings[i].level} followed immediately by h${headings[i + 1].level}`,
          rationale: 'Skipping heading levels confuses screen readers and breaks visual rhythm.',
          fix: `Change h${headings[i + 1].level} to h${headings[i].level + 1} or adjust parent level.`
        });
        break;
      }
    }
  }

  // 2. Font Size Scale Proliferation
  const fontSizeCount = t.fontSizes.length;
  if (fontSizeCount > 8) {
    interventions.push({
      category: 'SCALE',
      title: `Type size explosion: ${fontSizeCount} distinct font sizes`,
      rationale: 'Too many font sizes create typographic noise. Cohesive systems use 5-7 deliberate scale steps.',
      fix: 'Standardize on a modular scale (e.g., 12px, 14px, 16px, 20px, 24px, 32px, 48px).'
    });
  }

  // 3. Font Weight Proliferation
  const fontWeightCount = t.fontWeights.length;
  if (fontWeightCount > 4) {
    interventions.push({
      category: 'SCALE',
      title: `Excessive font-weight variants (${fontWeightCount} weights)`,
      rationale: 'Mixing 300, 400, 500, 600, 700, 800 dilutes weight-based emphasis.',
      fix: 'Limit weights to 2-3 intentional values: Regular (400), Medium (500 or 600), and Bold (700).'
    });
  }

  // 4. Body Readability
  const bodySizeMatch = typo.bodyFontSize.match(/(\d+(?:\.\d+)?)/);
  const bodyFontSizePx = bodySizeMatch ? parseFloat(bodySizeMatch[1]) : 16;
  if (bodyFontSizePx < 14) {
    interventions.push({
      category: 'READABILITY',
      title: `Body text below readability threshold (${typo.bodyFontSize})`,
      rationale: 'Text under 14px strains legibility, especially on high-density or mobile displays.',
      fix: 'Set root body font size to at least 15px or 16px.'
    });
  }

  // 5. Generic Font Evaluation
  const families = typo.fontFamilies;
  const isGenericInter = families.length > 0 &&
    families.every(f => f.toLowerCase().includes('inter') || f.toLowerCase().includes('system-ui') || f.toLowerCase().includes('sans-serif'));

  if (isGenericInter && evidence.surface !== 'developer-tool' && evidence.surface !== 'admin') {
    interventions.push({
      category: 'IDENTITY',
      title: 'Default generic typography (Inter / system-ui only)',
      rationale: 'Using default Inter without pairing or custom metrics produces an anonymous, template-like feel.',
      fix: 'Consider an intentional heading typeface (e.g. geometric, serif, or display) paired with a high-readability body font to establish product character.'
    });
  }

  return {
    hasValidHeadingHierarchy,
    fontSizeCount,
    fontWeightCount,
    bodyFontSizePx,
    fontFamilies: families,
    interventions,
    summary: interventions.length === 0
      ? 'Typographic system has clear hierarchy, restrained scale, and solid legibility.'
      : `Identified ${interventions.length} typographic improvements to clarify hierarchy and eliminate scale bloat.`
  };
}
