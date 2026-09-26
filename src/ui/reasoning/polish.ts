/**
 * UI Polish Reasoning Engine
 *
 * Micro-aesthetic refinement, token cohesion, elevation shadows,
 * border-radius harmony, and contrast calibration.
 */

import { BrowserEvidence } from '../types.js';

export interface PolishRefinement {
  area: 'COLOR' | 'RADIUS' | 'SHADOW' | 'CONTRAST';
  element: string;
  currentValue: string;
  proposedValue: string;
  rationale: string;
}

export interface PolishAnalysisResult {
  colorCount: number;
  radiusCount: number;
  shadowCount: number;
  contrastPassRate: number; // percentage
  refinements: PolishRefinement[];
  cohesionScore: number; // 0-100 (100 = perfectly cohesive)
  summary: string;
}

export function polishInterface(evidence: BrowserEvidence): PolishAnalysisResult {
  const refinements: PolishRefinement[] = [];
  const t = evidence.tokens;
  const colors = evidence.colors;

  // 1. Color Palette Cohesion
  const colorCount = t.colors.length;
  if (colorCount > 12) {
    refinements.push({
      area: 'COLOR',
      element: 'Global Color Palette',
      currentValue: `${colorCount} unique colors`,
      proposedValue: 'Consolidate to 6-8 core colors',
      rationale: 'Too many near-duplicate color shades create visual noise and lack of polish.'
    });
  }

  // 2. Border Radius Cohesion
  const radiusCount = t.borderRadii.length;
  if (radiusCount > 3) {
    refinements.push({
      area: 'RADIUS',
      element: 'Container Corner Radii',
      currentValue: `${radiusCount} variants (${t.borderRadii.map(r => r.value).join(', ')})`,
      proposedValue: 'Standardize on 2-3 scale steps (e.g. 4px, 8px, 16px)',
      rationale: 'Inconsistent corner radii make adjacent components feel like they belong to different design systems.'
    });
  }

  // 3. Shadow / Elevation Cohesion
  const shadowCount = t.shadows.length;
  if (shadowCount > 4) {
    refinements.push({
      area: 'SHADOW',
      element: 'Elevation Shadows',
      currentValue: `${shadowCount} distinct box-shadow declarations`,
      proposedValue: 'Standardize on 3 levels: sm, md, lg',
      rationale: 'Arbitrary shadow blurs and spreads ruin spatial depth perception.'
    });
  }

  // 4. Contrast Calibration
  const pairs = colors.contrastPairs;
  let passCount = 0;
  for (const pair of pairs) {
    if (pair.passes_AA) {
      passCount++;
    } else {
      refinements.push({
        area: 'CONTRAST',
        element: pair.selector,
        currentValue: `${pair.ratio.toFixed(2)}:1 (fg: ${pair.foreground} / bg: ${pair.background})`,
        proposedValue: 'At least 4.5:1 for WCAG AA normal text',
        rationale: 'Insufficient text contrast impairs legibility.'
      });
    }
  }

  const contrastPassRate = pairs.length > 0 ? Math.round((passCount / pairs.length) * 100) : 100;

  // Calculate cohesion score
  let score = 100;
  if (colorCount > 12) score -= Math.min(25, (colorCount - 12) * 3);
  if (radiusCount > 3) score -= Math.min(20, (radiusCount - 3) * 5);
  if (shadowCount > 4) score -= Math.min(20, (shadowCount - 4) * 5);
  score -= (100 - contrastPassRate) * 0.35;
  const cohesionScore = Math.max(0, Math.round(score));

  return {
    colorCount,
    radiusCount,
    shadowCount,
    contrastPassRate,
    refinements,
    cohesionScore,
    summary: refinements.length === 0
      ? 'Visual polish is cohesive with aligned tokens, disciplined elevation, and strong contrast.'
      : `Identified ${refinements.length} polish refinements (Visual Cohesion Score: ${cohesionScore}/100).`
  };
}
