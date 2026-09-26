/**
 * Layout Reasoning Engine
 *
 * Evaluates spatial composition, alignment systems, focal hierarchy,
 * and layout anti-patterns (such as everything-centered layout).
 */

import { BrowserEvidence } from '../types.js';

export interface LayoutIntervention {
  category: 'ALIGNMENT' | 'HIERARCHY' | 'SPACING' | 'GRID';
  title: string;
  rationale: string;
  fix: string;
}

export interface LayoutAnalysisResult {
  centeringRatio: number;
  hasDominantFocalPoint: boolean;
  usesModernLayoutSystem: boolean;
  spacingHarmonicScore: number; // 0-100 (100 = perfect 4/8px grid)
  interventions: LayoutIntervention[];
  summary: string;
}

export function analyzeLayout(evidence: BrowserEvidence): LayoutAnalysisResult {
  const interventions: LayoutIntervention[] = [];
  const l = evidence.layout;
  const t = evidence.tokens;

  // 1. Centering Evaluation
  const centeringRatio = l.totalElements > 0 ? (l.centeredElements / l.totalElements) : 0;
  if (centeringRatio > 0.4 && l.totalElements >= 5) {
    interventions.push({
      category: 'ALIGNMENT',
      title: `Excessive text/element centering (${(centeringRatio * 100).toFixed(0)}% centered)`,
      rationale: 'AI interfaces frequently default to text-align: center for all content, weakening left-edge reading scanlines.',
      fix: 'Left-align long-form body text, lists, and form inputs. Reserve center alignment for single heroes, metric callouts, and empty states.'
    });
  }

  // 2. Alignment & Layout Primitives
  const usesModernLayoutSystem = l.gridUsage || l.flexUsage;
  if (!usesModernLayoutSystem && l.totalElements > 10) {
    interventions.push({
      category: 'GRID',
      title: 'Missing structured CSS Grid or Flexbox alignment system',
      rationale: 'Layout relies on ad-hoc floats, margins, or inline-block positioning.',
      fix: 'Introduce a CSS Grid or Flex container to enforce structured column tracks and consistent gutters.'
    });
  }

  // 3. Focal Hierarchy
  const hasDominantFocalPoint = evidence.components.heroSections > 0 ||
    evidence.dom.headings.some(h => h.level === 1) ||
    evidence.dom.forms.length === 1;

  if (!hasDominantFocalPoint && l.totalElements > 8) {
    interventions.push({
      category: 'HIERARCHY',
      title: 'Equal visual weight across competing components (No dominant focal point)',
      rationale: 'The interface presents multiple visual blocks at identical scale, leaving the user with no clear entry point.',
      fix: 'Elevate one primary task or metric module as the focal anchor using size, contrast, or prominent placement.'
    });
  }

  // 4. Spacing Scale Analysis (Harmonic 4/8px check)
  const spacingValues = t.spacingValues.map(s => parseInt(s.value, 10)).filter(n => !isNaN(n));
  let harmonicMatches = 0;
  for (const val of spacingValues) {
    if (val % 4 === 0 || val % 8 === 0) harmonicMatches++;
  }
  const spacingHarmonicScore = spacingValues.length > 0
    ? Math.round((harmonicMatches / spacingValues.length) * 100)
    : 100;

  if (spacingHarmonicScore < 70 && spacingValues.length >= 4) {
    interventions.push({
      category: 'SPACING',
      title: `Irregular spacing values (${spacingHarmonicScore}% harmonic match to 4px/8px scale)`,
      rationale: `Found arbitrary margins/paddings (${spacingValues.join(', ')}px) that create uneven vertical rhythm.`,
      fix: 'Snap spacing values to a disciplined scale: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px.'
    });
  }

  return {
    centeringRatio,
    hasDominantFocalPoint,
    usesModernLayoutSystem,
    spacingHarmonicScore,
    interventions,
    summary: interventions.length === 0
      ? 'Spatial composition is disciplined with clear scanlines and harmonic spacing rhythm.'
      : `Detected ${interventions.length} spatial/layout adjustments needed to strengthen visual hierarchy.`
  };
}
