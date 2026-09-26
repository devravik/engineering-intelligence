/**
 * Style Probe — CSS/Style Token Analysis Engine
 *
 * Extracts visual design tokens from CSS, SCSS, and inline styles in components.
 * Detects token proliferation (14 different radii, 23 arbitrary colors, etc.)
 * which is a classic AI-generated code signature.
 *
 * The issue isn't the number itself.
 * The reasoning layer asks:
 * "Is there a coherent design system here, or did the agent
 *  invent a new value every time it needed one?"
 */

import {
  DesignTokenInventory,
  VisualToken,
  ColorInventory,
  ContrastPair
} from '../types.js';

// ─── Color Extraction ───────────────────────────────────────────────────────

const HEX_COLOR_REGEX = /#(?:[0-9a-fA-F]{3,4}){1,2}\b/g;
const RGB_REGEX = /rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+(?:\s*,\s*[\d.]+)?\s*\)/g;
const HSL_REGEX = /hsla?\(\s*\d+\s*,?\s*\d+%?\s*,?\s*\d+%?(?:\s*[,/]\s*[\d.]+%?)?\s*\)/g;
const CSS_NAMED_COLORS = new Set([
  'black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'purple',
  'pink', 'gray', 'grey', 'transparent', 'inherit', 'currentColor', 'initial'
]);

const GRADIENT_REGEX = /(?:linear|radial|conic)-gradient\([^)]+\)/g;

export function extractColors(cssContent: string): string[] {
  const colors = new Set<string>();

  // Hex colors
  const hexMatches = cssContent.match(HEX_COLOR_REGEX) || [];
  for (const c of hexMatches) colors.add(normalizeHexColor(c));

  // RGB/RGBA colors
  const rgbMatches = cssContent.match(RGB_REGEX) || [];
  for (const c of rgbMatches) colors.add(c.replace(/\s+/g, ''));

  // HSL/HSLA colors
  const hslMatches = cssContent.match(HSL_REGEX) || [];
  for (const c of hslMatches) colors.add(c.replace(/\s+/g, ''));

  return Array.from(colors);
}

export function extractGradients(cssContent: string): string[] {
  const gradients = new Set<string>();
  const matches = cssContent.match(GRADIENT_REGEX) || [];
  for (const g of matches) gradients.add(g);
  return Array.from(gradients);
}

function normalizeHexColor(hex: string): string {
  hex = hex.toLowerCase();
  // Expand shorthand: #abc → #aabbcc
  if (hex.length === 4) {
    return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return hex;
}

// ─── Spacing / Sizing Extraction ────────────────────────────────────────────

const SPACING_PROPERTIES = [
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'gap', 'row-gap', 'column-gap'
];

const FONT_SIZE_REGEX = /font-size\s*:\s*([^;}\n]+)/gi;
const FONT_WEIGHT_REGEX = /font-weight\s*:\s*([^;}\n]+)/gi;
const FONT_FAMILY_REGEX = /font-family\s*:\s*([^;}\n]+)/gi;
const BORDER_RADIUS_REGEX = /border-radius\s*:\s*([^;}\n]+)/gi;
const BOX_SHADOW_REGEX = /box-shadow\s*:\s*([^;}\n]+)/gi;
const LINE_HEIGHT_REGEX = /line-height\s*:\s*([^;}\n]+)/gi;
const LETTER_SPACING_REGEX = /letter-spacing\s*:\s*([^;}\n]+)/gi;
const Z_INDEX_REGEX = /z-index\s*:\s*([^;}\n]+)/gi;

function extractPropertyValues(cssContent: string, regex: RegExp): string[] {
  const values: string[] = [];
  let match: RegExpExecArray | null;
  // Reset lastIndex since we're reusing regexes
  regex.lastIndex = 0;
  while ((match = regex.exec(cssContent)) !== null) {
    values.push(match[1].trim());
  }
  return values;
}

function extractSpacingValues(cssContent: string): string[] {
  const values: string[] = [];
  for (const prop of SPACING_PROPERTIES) {
    const regex = new RegExp(`${prop}\\s*:\\s*([^;}\\n]+)`, 'gi');
    let match: RegExpExecArray | null;
    while ((match = regex.exec(cssContent)) !== null) {
      const val = match[1].trim();
      // Split shorthand values: "16px 24px" → ["16px", "24px"]
      const parts = val.split(/\s+/);
      for (const part of parts) {
        if (part && part !== '0' && part !== 'auto' && part !== 'inherit' && part !== 'initial') {
          values.push(part);
        }
      }
    }
  }
  return values;
}

// ─── Breakpoint Extraction ──────────────────────────────────────────────────

const MEDIA_QUERY_REGEX = /@media[^{]*\b(min-width|max-width)\s*:\s*(\d+(?:\.\d+)?(?:px|em|rem))/g;

export function extractBreakpoints(cssContent: string): string[] {
  const breakpoints = new Set<string>();
  let match: RegExpExecArray | null;
  MEDIA_QUERY_REGEX.lastIndex = 0;
  while ((match = MEDIA_QUERY_REGEX.exec(cssContent)) !== null) {
    breakpoints.add(match[2]);
  }
  return Array.from(breakpoints).sort((a, b) => {
    const numA = parseFloat(a);
    const numB = parseFloat(b);
    return numA - numB;
  });
}

// ─── Tailwind Class Token Extraction ────────────────────────────────────────

const TAILWIND_COLOR_REGEX = /(?:text|bg|border|ring|shadow|from|to|via)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}/g;
const TAILWIND_SPACING_REGEX = /(?:p|m|px|py|pt|pr|pb|pl|mx|my|mt|mr|mb|ml|gap|space-[xy])-(?:\d+(?:\.\d+)?|px|auto)/g;
const TAILWIND_RADIUS_REGEX = /rounded(?:-(?:sm|md|lg|xl|2xl|3xl|full|none))?/g;
const TAILWIND_FONT_SIZE_REGEX = /text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl)/g;
const TAILWIND_FONT_WEIGHT_REGEX = /font-(?:thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g;

export function extractTailwindTokens(content: string): Partial<DesignTokenInventory> {
  return {
    colors: toVisualTokens(content.match(TAILWIND_COLOR_REGEX) || []),
    spacingValues: toVisualTokens(content.match(TAILWIND_SPACING_REGEX) || []),
    borderRadii: toVisualTokens(content.match(TAILWIND_RADIUS_REGEX) || []),
    fontSizes: toVisualTokens(content.match(TAILWIND_FONT_SIZE_REGEX) || []),
    fontWeights: toVisualTokens(content.match(TAILWIND_FONT_WEIGHT_REGEX) || [])
  };
}

function toVisualTokens(values: string[]): VisualToken[] {
  const counts = new Map<string, number>();
  for (const v of values) {
    counts.set(v, (counts.get(v) || 0) + 1);
  }
  return Array.from(counts.entries()).map(([value, count]) => ({
    value,
    count,
    sources: []
  }));
}

// ─── Full Token Inventory ───────────────────────────────────────────────────

/**
 * Extracts the complete design token inventory from CSS content.
 * This is the primary data source for detecting token proliferation
 * and design system coherence.
 */
export function extractDesignTokens(cssContents: string[]): DesignTokenInventory {
  const allCSS = cssContents.join('\n');

  const colors = extractColors(allCSS);
  const spacingValues = extractSpacingValues(allCSS);
  const fontSizes = extractPropertyValues(allCSS, new RegExp(FONT_SIZE_REGEX.source, 'gi'));
  const fontWeights = extractPropertyValues(allCSS, new RegExp(FONT_WEIGHT_REGEX.source, 'gi'));
  const fontFamilies = extractPropertyValues(allCSS, new RegExp(FONT_FAMILY_REGEX.source, 'gi'));
  const borderRadii = extractPropertyValues(allCSS, new RegExp(BORDER_RADIUS_REGEX.source, 'gi'));
  const shadows = extractPropertyValues(allCSS, new RegExp(BOX_SHADOW_REGEX.source, 'gi'));
  const breakpoints = extractBreakpoints(allCSS);
  const lineHeights = extractPropertyValues(allCSS, new RegExp(LINE_HEIGHT_REGEX.source, 'gi'));
  const letterSpacings = extractPropertyValues(allCSS, new RegExp(LETTER_SPACING_REGEX.source, 'gi'));
  const zIndices = extractPropertyValues(allCSS, new RegExp(Z_INDEX_REGEX.source, 'gi'));

  return {
    colors: toVisualTokens(colors),
    spacingValues: toVisualTokens(spacingValues),
    fontSizes: toVisualTokens(fontSizes),
    fontWeights: toVisualTokens(fontWeights),
    fontFamilies: toVisualTokens(fontFamilies),
    borderRadii: toVisualTokens(borderRadii),
    shadows: toVisualTokens(shadows),
    breakpoints: toVisualTokens(breakpoints),
    lineHeights: toVisualTokens(lineHeights),
    letterSpacings: toVisualTokens(letterSpacings),
    zIndices: toVisualTokens(zIndices)
  };
}

// ─── Color Inventory Builder ────────────────────────────────────────────────

export function buildColorInventory(cssContents: string[]): ColorInventory {
  const allCSS = cssContents.join('\n');

  // Categorize colors by property context
  const bgColors: string[] = [];
  const textColors: string[] = [];
  const borderColors: string[] = [];
  const accentColors: string[] = [];

  // Background colors
  const bgRegex = /background(?:-color)?\s*:\s*([^;}\n]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = bgRegex.exec(allCSS)) !== null) {
    const colors = extractColors(match[1]);
    bgColors.push(...colors);
  }

  // Text colors
  const colorRegex = /(?:^|[^-])color\s*:\s*([^;}\n]+)/gi;
  while ((match = colorRegex.exec(allCSS)) !== null) {
    const colors = extractColors(match[1]);
    textColors.push(...colors);
  }

  // Border colors
  const borderRegex = /border(?:-color)?\s*:\s*([^;}\n]+)/gi;
  while ((match = borderRegex.exec(allCSS)) !== null) {
    const colors = extractColors(match[1]);
    borderColors.push(...colors);
  }

  // Accent / focus colors
  const accentRegex = /(?:accent-color|outline-color|caret-color|--(?:primary|accent|brand))\s*:\s*([^;}\n]+)/gi;
  while ((match = accentRegex.exec(allCSS)) !== null) {
    const colors = extractColors(match[1]);
    accentColors.push(...colors);
  }

  const gradients = extractGradients(allCSS);

  return {
    backgroundColors: toVisualTokens(bgColors),
    textColors: toVisualTokens(textColors),
    borderColors: toVisualTokens(borderColors),
    accentColors: toVisualTokens(accentColors),
    gradients: toVisualTokens(gradients),
    contrastPairs: []  // Requires computed styles from browser
  };
}

// ─── Contrast Calculation ───────────────────────────────────────────────────

/**
 * Calculate WCAG 2.1 relative luminance and contrast ratio.
 * Used for deterministic contrast checks on extracted color pairs.
 */
export function hexToRGB(hex: string): { r: number; g: number; b: number } | null {
  hex = hex.replace('#', '');
  if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  if (hex.length !== 6) return null;

  return {
    r: parseInt(hex.substring(0, 2), 16),
    g: parseInt(hex.substring(2, 4), 16),
    b: parseInt(hex.substring(4, 6), 16)
  };
}

export function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function contrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Check WCAG AA and AAA contrast compliance.
 * AA: 4.5:1 for normal text, 3:1 for large text (>= 18pt or 14pt bold)
 * AAA: 7:1 for normal text, 4.5:1 for large text
 */
export function checkContrast(fg: string, bg: string): { ratio: number; passes_AA: boolean; passes_AAA: boolean } | null {
  const fgRGB = hexToRGB(fg);
  const bgRGB = hexToRGB(bg);
  if (!fgRGB || !bgRGB) return null;

  const fgL = relativeLuminance(fgRGB.r, fgRGB.g, fgRGB.b);
  const bgL = relativeLuminance(bgRGB.r, bgRGB.g, bgRGB.b);
  const ratio = contrastRatio(fgL, bgL);

  return {
    ratio: Math.round(ratio * 100) / 100,
    passes_AA: ratio >= 4.5,
    passes_AAA: ratio >= 7
  };
}

// ─── AI Gradient Detection ──────────────────────────────────────────────────

/**
 * Detects the classic "AI purple/blue gradient" pattern.
 * This is not "purple = bad"; it is:
 *   repeated generic palette + no product rationale + high visual prominence
 */
export function isGenericAIGradient(gradient: string): boolean {
  const lower = gradient.toLowerCase();

  // Check for purple/blue/indigo/violet dominant gradients
  const aiColorTerms = ['purple', 'indigo', 'violet', '#7c3aed', '#6366f1', '#8b5cf6',
    '#a855f7', '#818cf8', '#4f46e5', '#7e22ce', '#9333ea', '#6d28d9',
    'rgb(124,58,237)', 'rgb(99,102,241)', 'rgb(139,92,246)'];

  const hasAIColors = aiColorTerms.some(c => lower.includes(c));
  const hasPink = lower.includes('pink') || lower.includes('#ec4899') || lower.includes('#f472b6');
  const hasBlue = lower.includes('blue') || lower.includes('#3b82f6') || lower.includes('#2563eb');

  // Classic AI gradient: purple-to-blue or purple-to-pink
  return hasAIColors && (hasPink || hasBlue);
}

// ─── Generic Font Detection ─────────────────────────────────────────────────

const GENERIC_SYSTEM_FONTS = new Set([
  'arial', 'helvetica', 'times new roman', 'times', 'courier new',
  'courier', 'verdana', 'georgia', 'palatino', 'garamond',
  'comic sans ms', 'impact', 'trebuchet ms', 'lucida console',
  'tahoma', 'sans-serif', 'serif', 'monospace', 'system-ui',
  'ui-sans-serif', 'ui-serif', 'ui-monospace', '-apple-system',
  'blinkmacsystemfont', 'segoe ui'
]);

const OVER_USED_AI_FONTS = new Set([
  'inter', 'poppins', 'outfit', 'dm sans', 'plus jakarta sans',
  'space grotesk', 'sora', 'manrope', 'satoshi', 'general sans'
]);

export function classifyFontUsage(fontFamily: string): 'generic' | 'overused-ai' | 'custom' {
  const lower = fontFamily.toLowerCase().replace(/["']/g, '').trim();

  // Split comma-separated font stacks
  const fonts = lower.split(',').map(f => f.trim());
  const primaryFont = fonts[0];

  if (!primaryFont) return 'generic';
  if (GENERIC_SYSTEM_FONTS.has(primaryFont)) return 'generic';
  if (OVER_USED_AI_FONTS.has(primaryFont)) return 'overused-ai';
  return 'custom';
}
