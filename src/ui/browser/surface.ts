/**
 * Surface Classification
 *
 * Before UI critique, EI must understand what it is looking at.
 *
 *   dashboard ≠ landing page
 *   landing page ≠ checkout
 *   checkout ≠ developer IDE
 *
 * This prevents generic design rules from becoming dogma.
 */

import { Surface, ComponentInventory, HeadingInfo } from '../types.js';

interface SurfaceSignals {
  // Path-based signals
  pathKeywords: string[];
  // Content-based signals
  headings: HeadingInfo[];
  components: ComponentInventory;
  // Structural signals
  hasNavbar: boolean;
  hasSidebar: boolean;
  hasForm: boolean;
  hasTable: boolean;
  hasHero: boolean;
  hasMetricCards: boolean;
  hasCharts: boolean;
  hasPricing: boolean;
  hasCodeBlocks: boolean;
  hasProductCards: boolean;
}

/**
 * Classifies the surface type of a page based on structural signals.
 * Used to adjust detector thresholds and critique context.
 */
export function classifySurface(signals: SurfaceSignals): Surface {
  const {
    pathKeywords, components, hasNavbar, hasSidebar, hasForm,
    hasTable, hasHero, hasMetricCards, hasCharts, hasPricing,
    hasCodeBlocks, hasProductCards
  } = signals;

  // Path-based classification (highest priority)
  const path = pathKeywords.join(' ').toLowerCase();

  if (path.match(/\b(dashboard|admin|analytics|metrics|overview)\b/)) {
    return 'dashboard';
  }
  if (path.match(/\b(settings|preferences|account|profile|config)\b/)) {
    return 'settings';
  }
  if (path.match(/\b(checkout|payment|cart|order)\b/)) {
    return 'checkout';
  }
  if (path.match(/\b(docs|documentation|guide|tutorial|api-reference|readme)\b/)) {
    return 'documentation';
  }
  if (path.match(/\b(landing|home|index|welcome)\b/)) {
    return 'landing';
  }
  if (path.match(/\b(marketing|pricing|features|about|blog)\b/)) {
    return 'marketing';
  }
  if (path.match(/\b(shop|store|product|catalog|browse)\b/)) {
    return 'ecommerce';
  }
  if (path.match(/\b(admin|manage|users|roles|permissions)\b/)) {
    return 'admin';
  }

  // Structural classification (when path is ambiguous)
  if (hasMetricCards && hasCharts && hasSidebar) return 'dashboard';
  if (hasHero && hasPricing) return 'marketing';
  if (hasHero && !hasSidebar && !hasTable) return 'landing';
  if (hasProductCards && components.cards > 4) return 'ecommerce';
  if (hasCodeBlocks && !hasCharts) return 'documentation';
  if (hasForm && !hasTable && !hasCharts) {
    if (components.forms >= 1 && components.buttons >= 1) return 'checkout';
  }
  if (hasSidebar && hasTable) return 'admin';
  if (hasTable && hasForm) return 'settings';

  // Developer tool signals
  if (path.match(/\b(terminal|console|editor|ide|debug|devtools)\b/)) {
    return 'developer-tool';
  }

  return 'unknown';
}

/**
 * Extracts surface classification signals from source content.
 */
export function extractSurfaceSignals(
  content: string,
  filePath: string,
  components: ComponentInventory,
  headings: HeadingInfo[]
): SurfaceSignals {
  const lower = content.toLowerCase();

  return {
    pathKeywords: filePath.split(/[/\\]/).filter(Boolean),
    headings,
    components,
    hasNavbar: components.navElements > 0,
    hasSidebar: /sidebar|side-bar|sideNav/i.test(content),
    hasForm: components.forms > 0,
    hasTable: components.tables > 0,
    hasHero: components.heroSections > 0 || /hero|Hero/g.test(content),
    hasMetricCards: /metric|stat|kpi|analytics/i.test(content) && components.cards > 2,
    hasCharts: components.charts > 0,
    hasPricing: /pricing|price|plan|subscription|tier/i.test(content),
    hasCodeBlocks: /<(pre|code)|```/g.test(content),
    hasProductCards: /product|item|listing|catalog/i.test(content) && components.cards > 2
  };
}

/**
 * Returns surface-specific detector thresholds.
 *
 * A dashboard has different card/badge expectations than a landing page.
 * A developer tool has different typography expectations than consumer ecommerce.
 */
export function getSurfaceThresholds(surface: Surface): {
  maxCards: number;
  maxBadges: number;
  maxGradients: number;
  allowGenericFonts: boolean;
  minContrastRatio: number;
  allowDenseLayout: boolean;
} {
  switch (surface) {
    case 'dashboard':
      return {
        maxCards: 12,
        maxBadges: 8,
        maxGradients: 2,
        allowGenericFonts: true,
        minContrastRatio: 4.5,
        allowDenseLayout: true
      };
    case 'developer-tool':
      return {
        maxCards: 4,
        maxBadges: 4,
        maxGradients: 1,
        allowGenericFonts: true,  // System fonts are fine for dev tools
        minContrastRatio: 4.5,
        allowDenseLayout: true
      };
    case 'landing':
    case 'marketing':
      return {
        maxCards: 6,
        maxBadges: 3,
        maxGradients: 3,
        allowGenericFonts: false,
        minContrastRatio: 4.5,
        allowDenseLayout: false
      };
    case 'ecommerce':
      return {
        maxCards: 20,
        maxBadges: 10,
        maxGradients: 2,
        allowGenericFonts: false,
        minContrastRatio: 4.5,
        allowDenseLayout: false
      };
    case 'checkout':
      return {
        maxCards: 3,
        maxBadges: 2,
        maxGradients: 1,
        allowGenericFonts: false,
        minContrastRatio: 7,
        allowDenseLayout: false
      };
    case 'documentation':
      return {
        maxCards: 6,
        maxBadges: 4,
        maxGradients: 1,
        allowGenericFonts: true,
        minContrastRatio: 4.5,
        allowDenseLayout: false
      };
    default:
      return {
        maxCards: 8,
        maxBadges: 5,
        maxGradients: 2,
        allowGenericFonts: false,
        minContrastRatio: 4.5,
        allowDenseLayout: false
      };
  }
}
