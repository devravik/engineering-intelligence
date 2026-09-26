/**
 * UI Distillation Reasoning Engine
 *
 * Anti-slop doctrine: "What can be removed before anything is added?"
 * Identifies container bloat, card-walls, redundant badges, and gratuitous decorations.
 */

import { BrowserEvidence, Surface } from '../types.js';

export interface DistillationDirective {
  type: 'REMOVE' | 'UNWRAP' | 'CONSOLIDATE' | 'SIMPLIFY';
  target: string;
  rationale: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedAction: string;
}

export interface DistillationResult {
  surface: Surface;
  directives: DistillationDirective[];
  metrics: {
    cardsBefore: number;
    cardsRecommended: number;
    badgesBefore: number;
    badgesRecommended: number;
    containerDepth: number;
    clutterScore: number; // 0-100 (0 = lean, 100 = heavy slop)
  };
  summary: string;
}

export function distillInterface(evidence: BrowserEvidence): DistillationResult {
  const directives: DistillationDirective[] = [];
  const c = evidence.components;
  const l = evidence.layout;
  const surface = evidence.surface || 'unknown';

  // 1. Evaluate Card Overload
  const cardThreshold = surface === 'dashboard' ? 8 : surface === 'landing' ? 4 : 6;
  if (c.cards > cardThreshold) {
    directives.push({
      type: 'CONSOLIDATE',
      target: 'Card containers',
      rationale: `Found ${c.cards} card components (recommended max: ${cardThreshold} for ${surface}). AI defaults to wrapping every datum in a rounded card.`,
      impact: 'HIGH',
      suggestedAction: 'Merge metric cards into a single summary bar or flat definition list.'
    });
  }

  // 2. Evaluate Badge & Pill Proliferation
  const badgeThreshold = 6;
  const totalBadges = c.badges + c.pills;
  if (totalBadges > badgeThreshold) {
    directives.push({
      type: 'REMOVE',
      target: 'Decorative badges and pills',
      rationale: `${totalBadges} badges create high visual vibration. Not every status, label, or chip needs a pill background.`,
      impact: 'MEDIUM',
      suggestedAction: 'Convert static label badges to plain muted text. Reserve colored pills exclusively for actionable or critical status.'
    });
  }

  // 3. Evaluate Nested Containers
  if (l.maxNestingDepth > 4) {
    directives.push({
      type: 'UNWRAP',
      target: 'Deeply nested wrapper containers',
      rationale: `Max container nesting depth is ${l.maxNestingDepth} levels. Containers inside containers create visual boxing.`,
      impact: 'HIGH',
      suggestedAction: 'Remove intermediate wrapper div/section elements and let parent grid/flex layout handle positioning.'
    });
  }

  // 4. Evaluate Decorative Gradients
  if (evidence.colors.gradients.length > 2) {
    directives.push({
      type: 'REMOVE',
      target: 'Decorative gradient backgrounds',
      rationale: `${evidence.colors.gradients.length} gradients detected. Gradients often act as AI visual filler.`,
      impact: 'LOW',
      suggestedAction: 'Replace decorative gradients with solid background colors adhering to the neutral scale.'
    });
  }

  // Calculate clutter score (0-100)
  let clutter = 0;
  if (c.cards > cardThreshold) clutter += Math.min(40, (c.cards - cardThreshold) * 8);
  if (totalBadges > badgeThreshold) clutter += Math.min(30, (totalBadges - badgeThreshold) * 5);
  if (l.maxNestingDepth > 3) clutter += (l.maxNestingDepth - 3) * 10;
  if (evidence.colors.gradients.length > 2) clutter += 10;
  clutter = Math.min(100, clutter);

  const recommendedCards = Math.min(c.cards, cardThreshold);
  const recommendedBadges = Math.min(totalBadges, badgeThreshold);

  return {
    surface,
    directives,
    metrics: {
      cardsBefore: c.cards,
      cardsRecommended: recommendedCards,
      badgesBefore: totalBadges,
      badgesRecommended: recommendedBadges,
      containerDepth: l.maxNestingDepth,
      clutterScore: clutter
    },
    summary: directives.length === 0
      ? 'Interface is disciplined. No unnecessary containerization or decorative excess detected.'
      : `Identified ${directives.length} distillation opportunities (Clutter Score: ${clutter}/100). Prioritize REMOVE/UNWRAP before adding new styles.`
  };
}
