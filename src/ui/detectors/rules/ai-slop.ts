/**
 * AI UI Slop Detectors (UI-SLOP-001 through UI-SLOP-014)
 *
 * These are evidence signals, not automatic verdicts.
 *
 * purple gradient is not slop.
 *
 * But:
 *   purple gradient
 *   + Inter
 *   + rounded cards
 *   + glass effect
 *   + glowing icons
 *   + centered hero
 *   + generic dashboard
 * is a strong AI-generated-style signal.
 *
 * The compound signal detector (UI-SLOP-COMPOUND) evaluates
 * the aggregate pattern, not individual signals in isolation.
 */

import { UIDetector, UIRawFinding, BrowserEvidence, ComponentInventory } from '../../types.js';
import { isGenericAIGradient, classifyFontUsage } from '../../browser/style-probe.js';

// ─── UI-SLOP-001: Generic SaaS Dashboard Composition ───────────────────────

export const uiSlop001: UIDetector = {
  id: 'UI-SLOP-001',
  name: 'generic-saas-dashboard',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects the generic SaaS dashboard composition: sidebar + metric cards + charts + tables.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const c = evidence.components;

    // Dashboard-specific: only trigger on dashboard surfaces
    if (evidence.surface !== 'dashboard' && evidence.surface !== 'admin') {
      // On non-dashboard pages, a dashboard composition IS slop
      if (c.cards > 4 && c.charts > 0 && c.navElements > 0 && c.badges > 2) {
        findings.push({
          ruleId: 'UI-SLOP-001',
          category: 'UISlop',
          title: 'Generic dashboard composition on non-dashboard page',
          message: `This ${evidence.surface || 'unknown'} page has dashboard components (${c.cards} cards, ${c.charts} charts, ${c.badges} badges, ${c.navElements} nav elements) typically seen in AI-generated dashboard templates.`,
          evidence: `cards=${c.cards} charts=${c.charts} badges=${c.badges} nav=${c.navElements}`,
          confidence: 'MEDIUM',
          impact: 'MEDIUM',
          disposition: 'REVIEW',
          ruleClass: 'HEURISTIC',
          suggestedFix: 'Consider whether this page genuinely needs dashboard components or if a simpler composition serves the user task better.'
        });
      }
    }

    return findings;
  }
};

// ─── UI-SLOP-003: Rounded-Card-Everything ───────────────────────────────────

export const uiSlop003: UIDetector = {
  id: 'UI-SLOP-003',
  name: 'rounded-card-everything',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive card usage suggesting "card-everything" AI composition pattern.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const { cards } = evidence.components;

    // Surface-adjusted thresholds
    const maxCards = evidence.surface === 'dashboard' ? 12 :
                     evidence.surface === 'ecommerce' ? 20 : 6;

    if (cards > maxCards) {
      findings.push({
        ruleId: 'UI-SLOP-003',
        category: 'UISlop',
        title: `Rounded-card-everything: ${cards} card components`,
        message: `Found ${cards} card components on a ${evidence.surface || 'unknown'} surface (threshold: ${maxCards}). AI agents default to wrapping every piece of information in a rounded card. Not every element needs a container.`,
        evidence: `${cards} cards detected (surface: ${evidence.surface}, max: ${maxCards})`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Ask: Does each card justify its own container? Consider inline layouts, tables, or lists for simpler presentations.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-005: Decorative Gradient Overuse ───────────────────────────────

export const uiSlop005: UIDetector = {
  id: 'UI-SLOP-005',
  name: 'decorative-gradient-overuse',
  category: 'UISlop',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive decorative gradient usage without functional purpose.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const gradients = evidence.colors.gradients;

    if (gradients.length > 4) {
      const totalUsage = gradients.reduce((sum, g) => sum + g.count, 0);
      findings.push({
        ruleId: 'UI-SLOP-005',
        category: 'UISlop',
        title: `Decorative gradient overuse: ${gradients.length} gradients (${totalUsage} uses)`,
        message: 'Excessive gradient definitions often indicate the AI agent is using gradients as visual filler rather than serving a design purpose.',
        evidence: `${gradients.length} unique gradients, ${totalUsage} total uses`,
        confidence: 'MEDIUM',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Limit gradients to intentional visual purposes. Solid colors are often more effective and maintain better contrast.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-006: Excessive Glassmorphism ───────────────────────────────────

export const uiSlop006: UIDetector = {
  id: 'UI-SLOP-006',
  name: 'excessive-glassmorphism',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive use of backdrop-blur/glass effects.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    // This detector works on source content from the token analysis
    // backdrop-filter, glassmorphism patterns would be detected through
    // the CSS tokens or Tailwind classes
    const findings: UIRawFinding[] = [];
    const shadows = evidence.tokens.shadows;

    // Count glass-effect indicators
    let glassCount = 0;
    for (const shadow of shadows) {
      if (shadow.value.includes('blur') || shadow.value.includes('inset')) {
        glassCount += shadow.count;
      }
    }

    if (glassCount > 5) {
      findings.push({
        ruleId: 'UI-SLOP-006',
        category: 'UISlop',
        title: `Excessive glassmorphism: ${glassCount} blur/glass effects`,
        message: 'Heavy use of backdrop-blur and glass effects is a common AI aesthetic cliché. Glass effects reduce text readability and add rendering cost without functional purpose.',
        evidence: `${glassCount} glass/blur effect declarations`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Use glass effects sparingly (e.g., one navigation overlay). Prefer solid backgrounds with subtle transparency for readability.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-008: Excessive Pills/Badges ────────────────────────────────────

export const uiSlop008: UIDetector = {
  id: 'UI-SLOP-008',
  name: 'excessive-pills-badges',
  category: 'UISlop',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive badge/pill/chip/tag usage that creates visual clutter.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const { badges, pills } = evidence.components;
    const total = badges + pills;

    const threshold = evidence.surface === 'dashboard' ? 10 : 5;

    if (total > threshold) {
      findings.push({
        ruleId: 'UI-SLOP-008',
        category: 'UISlop',
        title: `Excessive pills/badges: ${total} badge-like elements`,
        message: `Found ${total} badge/pill/chip/tag elements (threshold: ${threshold} for ${evidence.surface || 'unknown'} surface). AI agents sprinkle badges to make interfaces feel "feature-rich" without adding information value.`,
        evidence: `badges=${badges} pills=${pills} total=${total}`,
        confidence: 'MEDIUM',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Ask: Does each badge communicate essential status? Remove decorative badges that don\'t help the user make decisions.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-009: Generic Metric-Card Wall ──────────────────────────────────

export const uiSlop009: UIDetector = {
  id: 'UI-SLOP-009',
  name: 'metric-card-wall',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects walls of metric/stat cards that create visual noise without prioritizing information.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const { cards, charts, icons } = evidence.components;

    // Metric card wall = many cards + icons + few/no charts + dashboard context
    if (cards > 6 && icons > cards * 0.5 && evidence.surface === 'dashboard') {
      findings.push({
        ruleId: 'UI-SLOP-009',
        category: 'UISlop',
        title: `Generic metric-card wall: ${cards} cards with ${icons} icons`,
        message: 'Wall of metric cards with icons is the most common AI dashboard composition. Every metric appears equally important, preventing the user from identifying what actually matters.',
        evidence: `${cards} cards, ${icons} icons, ${charts} charts`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Prioritize: Which 2-3 metrics matter most? Make those visually dominant. Demote secondary metrics to a compact table or summary row.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-012: Decorative UI Without Functional Purpose ──────────────────

export const uiSlop012: UIDetector = {
  id: 'UI-SLOP-012',
  name: 'decorative-ui-without-purpose',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects excessive decorative elements (icons, banners, badges) relative to functional elements.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const c = evidence.components;

    const decorative = c.icons + c.banners + c.badges + c.pills;
    const functional = c.buttons + c.forms + c.tables + c.charts;

    if (decorative > 0 && functional > 0 && decorative > functional * 3) {
      findings.push({
        ruleId: 'UI-SLOP-012',
        category: 'UISlop',
        title: `Decorative elements outnumber functional elements ${Math.round(decorative / functional)}:1`,
        message: `${decorative} decorative elements (icons, banners, badges) vs ${functional} functional elements (buttons, forms, tables, charts). High decorative-to-functional ratio suggests visual noise.`,
        evidence: `decorative=${decorative} (icons=${c.icons} banners=${c.banners} badges=${c.badges}) functional=${functional}`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Remove decorative elements that don\'t help users accomplish their task. Each visual element should earn its place.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-013: Component Variant Explosion ───────────────────────────────

export const uiSlop013: UIDetector = {
  id: 'UI-SLOP-013',
  name: 'component-variant-explosion',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'PROBABLE',
  description: 'Detects design token proliferation across multiple dimensions simultaneously.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const t = evidence.tokens;

    // Count dimensions with high proliferation
    let proliferatingDimensions = 0;
    const issues: string[] = [];

    if (t.colors.length > 20) { proliferatingDimensions++; issues.push(`${t.colors.length} colors`); }
    if (t.fontSizes.length > 10) { proliferatingDimensions++; issues.push(`${t.fontSizes.length} font sizes`); }
    if (t.spacingValues.length > 15) { proliferatingDimensions++; issues.push(`${t.spacingValues.length} spacing values`); }
    if (t.borderRadii.length > 6) { proliferatingDimensions++; issues.push(`${t.borderRadii.length} border radii`); }
    if (t.shadows.length > 5) { proliferatingDimensions++; issues.push(`${t.shadows.length} shadows`); }

    if (proliferatingDimensions >= 3) {
      findings.push({
        ruleId: 'UI-SLOP-013',
        category: 'UISlop',
        title: `Design token proliferation across ${proliferatingDimensions} dimensions`,
        message: `Multiple design dimensions show excessive variant counts: ${issues.join(', ')}. This is the strongest indicator that an AI agent invented new values on every request rather than maintaining a coherent design system.`,
        evidence: issues.join('; '),
        confidence: 'HIGH',
        impact: 'MEDIUM',
        disposition: 'FIX',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Run `/ei ui-document` to capture current values, then consolidate into a deliberate design token system.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-002: Purple/Blue AI Aesthetic ─────────────────────────────────

export const uiSlop002: UIDetector = {
  id: 'UI-SLOP-002',
  name: 'purple-blue-ai-aesthetic',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects the clichéd purple/indigo AI aesthetic in color palette.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const purpleBlueHexes = ['#8b5cf6', '#6366f1', '#7c3aed', '#a855f7', '#3b82f6', '#4f46e5'];

    const matchedColors = evidence.tokens.colors.filter(c =>
      purpleBlueHexes.some(p => c.value.toLowerCase().includes(p.toLowerCase()))
    );

    const hasAIGradient = evidence.colors.gradients.some(g => isGenericAIGradient(g.value));

    if (matchedColors.length >= 2 || hasAIGradient) {
      findings.push({
        ruleId: 'UI-SLOP-002',
        category: 'UISlop',
        title: 'Clichéd purple/indigo AI aesthetic palette detected',
        message: 'The color scheme relies on standard AI generative presets (purple/indigo/violet accents). This aesthetic immediately flags an interface as automated.',
        evidence: `AI colors: ${matchedColors.map(c => c.value).join(', ')}; gradient: ${hasAIGradient}`,
        confidence: 'MEDIUM',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Select a brand palette that reflects the specific problem domain, not the tool used to generate the code.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-004: Icon Tile Above Every Heading ────────────────────────────

export const uiSlop004: UIDetector = {
  id: 'UI-SLOP-004',
  name: 'icon-tile-above-every-heading',
  category: 'UISlop',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects the repetitive pattern where every heading is preceded by an icon tile container.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const { icons, cards } = evidence.components;
    const h3Count = evidence.dom.headings.filter(h => h.level === 3).length;

    if (icons >= 4 && h3Count >= 4 && Math.abs(icons - h3Count) <= 2 && cards >= 3) {
      findings.push({
        ruleId: 'UI-SLOP-004',
        category: 'UISlop',
        title: `Icon-tile-above-every-heading pattern (${icons} icons for ${h3Count} headings)`,
        message: 'Every feature section pairs an icon container with a heading. This formulaic composition produces monotonous visual rhythm.',
        evidence: `${icons} icons matching ${h3Count} h3 headings across ${cards} cards`,
        confidence: 'MEDIUM',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Vary presentation: use data visualizations, concise typography, interactive previews, or remove decorative icons.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-007: Everything-Centered Layout ────────────────────────────────

export const uiSlop007: UIDetector = {
  id: 'UI-SLOP-007',
  name: 'everything-centered-layout',
  category: 'UISlop',
  severity: 'MEDIUM',
  ruleClass: 'HEURISTIC',
  description: 'Detects pervasive center alignment across multiple page sections.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const { centeredElements, totalElements } = evidence.layout;
    const ratio = totalElements > 0 ? centeredElements / totalElements : 0;

    if (centeredElements >= 8 && ratio >= 0.5) {
      findings.push({
        ruleId: 'UI-SLOP-007',
        category: 'UISlop',
        title: `Everything-centered layout (${centeredElements} elements, ${(ratio * 100).toFixed(0)}% of layout)`,
        message: 'More than half of elements are center-aligned. Left-aligned content has a stronger reading anchor and improves scannability.',
        evidence: `Centered ratio: ${(ratio * 100).toFixed(1)}% (${centeredElements}/${totalElements})`,
        confidence: 'MEDIUM',
        impact: 'MEDIUM',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Anchor content with strong left alignment; reserve centering for isolated hero statements or dialog actions.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-010: Formulaic Hero Template ──────────────────────────────────

export const uiSlop010: UIDetector = {
  id: 'UI-SLOP-010',
  name: 'formulaic-hero-template',
  category: 'UISlop',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects the formulaic hero template: pill badge + centered H1 + subtitle + dual CTA buttons.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];
    const c = evidence.components;

    const hasHero = c.heroSections > 0 || (evidence.dom.headings.some(h => h.level === 1) && c.buttons >= 2);
    const hasPillBadge = c.pills > 0 || c.badges > 0;
    const hasDualCTA = c.buttons >= 2;

    if (hasHero && hasPillBadge && hasDualCTA && evidence.surface === 'landing') {
      findings.push({
        ruleId: 'UI-SLOP-010',
        category: 'UISlop',
        title: 'Formulaic SaaS hero composition detected',
        message: 'Hero combines pill announcement badge + headline + dual CTAs (Primary + Secondary). This cookie-cutter formula lacks distinct brand character.',
        evidence: `hero=${c.heroSections}, pills/badges=${c.pills + c.badges}, buttons=${c.buttons}`,
        confidence: 'MEDIUM',
        impact: 'LOW',
        disposition: 'REVIEW',
        ruleClass: 'HEURISTIC',
        suggestedFix: 'Differentiate the entrance: lead with a live product interactive demo, immediate value calculation, or contextual work surface.'
      });
    }

    return findings;
  }
};

// ─── UI-SLOP-COMPOUND: Compound AI Slop Signal ──────────────────────────────

export const uiSlopCompound: UIDetector = {
  id: 'UI-SLOP-COMPOUND',
  name: 'compound-ai-slop-signal',
  category: 'UISlop',
  severity: 'HIGH',
  ruleClass: 'PROBABLE',
  description: 'Evaluates the aggregate AI-generated-UI signal across multiple dimensions.',

  async run(evidence: BrowserEvidence): Promise<UIRawFinding[]> {
    const findings: UIRawFinding[] = [];

    // Collect individual signals
    let slopScore = 0;
    const signals: string[] = [];

    // 1. Generic AI gradient
    const hasAIGradient = evidence.colors.gradients.some(g => isGenericAIGradient(g.value));
    if (hasAIGradient) { slopScore += 2; signals.push('purple/blue AI gradient'); }

    // 2. Overused AI font
    const hasAIFont = evidence.tokens.fontFamilies.some(f =>
      classifyFontUsage(f.value) === 'overused-ai'
    );
    if (hasAIFont) { slopScore += 1; signals.push('overused AI font (Inter, Poppins, etc.)'); }

    // 3. Excessive cards
    const excessiveCards = evidence.components.cards > 6 && evidence.surface !== 'ecommerce';
    if (excessiveCards) { slopScore += 1; signals.push(`${evidence.components.cards} card components`); }

    // 4. Excessive badges/pills
    const excessiveBadges = evidence.components.badges + evidence.components.pills > 5;
    if (excessiveBadges) { slopScore += 1; signals.push(`${evidence.components.badges + evidence.components.pills} badges/pills`); }

    // 5. Token proliferation
    const tokenProliferation = evidence.tokens.colors.length > 20 &&
                               evidence.tokens.borderRadii.length > 6;
    if (tokenProliferation) { slopScore += 2; signals.push('token proliferation'); }

    // 6. Everything centered
    const { centeredElements, totalElements } = evidence.layout;
    const centeredRatio = totalElements > 0 ? centeredElements / totalElements : 0;
    if (centeredElements > 5 && centeredRatio > 0.4) {
      slopScore += 1; signals.push('everything-centered layout');
    }

    // 7. Hero section with generic structure
    if (evidence.components.heroSections > 0 && evidence.surface !== 'landing') {
      slopScore += 1; signals.push('hero section on non-landing page');
    }

    // 8. Excessive icons
    if (evidence.components.icons > 15) {
      slopScore += 1; signals.push(`${evidence.components.icons} icon elements`);
    }

    // Threshold: 4+ signals indicate a strong AI-generated pattern
    if (slopScore >= 4) {
      const confidence = slopScore >= 6 ? 'HIGH' : 'MEDIUM';
      const impact = slopScore >= 6 ? 'HIGH' : 'MEDIUM';

      findings.push({
        ruleId: 'UI-SLOP-COMPOUND',
        category: 'UISlop',
        title: `Strong AI-generated UI signal (score: ${slopScore}/10)`,
        message: `Multiple AI aesthetic signals detected simultaneously: ${signals.join(', ')}. Individually, each signal is not slop. Combined, they strongly indicate a generic AI-generated interface lacking deliberate product design.`,
        evidence: `Slop score: ${slopScore}/10 — ${signals.join('; ')}`,
        confidence,
        impact,
        disposition: 'REVIEW',
        ruleClass: 'PROBABLE',
        suggestedFix: 'Run `/ei ui-distill` to identify what can be removed. Then `/ei ui-document` to establish project design identity.'
      });
    }

    return findings;
  }
};

export const aiSlopDetectors: UIDetector[] = [
  uiSlop001,
  uiSlop002,
  uiSlop003,
  uiSlop004,
  uiSlop005,
  uiSlop006,
  uiSlop007,
  uiSlop008,
  uiSlop009,
  uiSlop010,
  uiSlop012,
  uiSlop013,
  uiSlopCompound
];
