/**
 * Browser Evidence Engine — Unified Evidence Collection
 *
 * Orchestrates all probes (DOM, Style, Surface) to collect
 * the complete BrowserEvidence package from source files.
 *
 * This is the static analysis path (no Playwright required).
 * When Playwright is available, the playwright-runner extends this
 * with computed styles, bounding boxes, and screenshots.
 */

import {
  BrowserEvidence,
  ViewportSize,
  STANDARD_VIEWPORTS,
  DOMSnapshot,
  ComponentInventory,
  DesignTokenInventory,
  ColorInventory,
  TypographyInventory,
  LayoutInventory,
  AccessibilityReport,
  Surface
} from '../types.js';

import {
  collectUISourceFiles,
  countComponentPatterns,
  extractHeadings,
  extractInteractiveElements,
  extractImages,
  extractLinks,
  UISourceFile
} from './dom-probe.js';

import {
  extractDesignTokens,
  buildColorInventory,
  extractGradients,
  extractTailwindTokens
} from './style-probe.js';

import {
  classifySurface,
  extractSurfaceSignals
} from './surface.js';

import { buildStaticAccessibilityReport } from './accessibility-probe.js';
import { analyzeResponsiveMatrix } from './viewport-runner.js';
import { analyzeInteractiveElements } from './interaction-probe.js';

/**
 * Collects browser evidence from source files without launching a browser.
 *
 * This is the default analysis mode. It parses HTML/JSX/CSS source
 * to extract structural evidence about the UI.
 *
 * For rendered evidence (screenshots, computed styles, accessibility tree),
 * use collectLiveBrowserEvidence() with Playwright.
 */
export function collectStaticUIEvidence(
  repoRoot: string,
  targetSubpath?: string
): BrowserEvidence {
  const files = collectUISourceFiles(repoRoot, targetSubpath);

  const componentFiles = files.filter(f => f.type === 'component' || f.type === 'page' || f.type === 'layout');
  const styleFiles = files.filter(f => f.type === 'style');

  // Combine all component content for analysis
  const allComponentContent = componentFiles.map(f => f.content).join('\n');
  const allStyleContent = styleFiles.map(f => f.content).join('\n');
  const allContent = allComponentContent + '\n' + allStyleContent;

  // DOM analysis
  const components = aggregateComponentInventory(componentFiles);
  const headings = extractHeadings(allComponentContent);
  const interactiveElements = extractInteractiveElements(allComponentContent);
  const images = extractImages(allComponentContent);
  const links = extractLinks(allComponentContent);

  // Style analysis
  const cssContents = styleFiles.map(f => f.content);
  // Also extract inline styles and Tailwind classes from components
  const componentStyleContent = componentFiles.map(f => extractInlineStyles(f.content)).join('\n');
  const tailwindTokens = extractTailwindTokens(allComponentContent);

  const tokens = mergeTokenInventories(
    extractDesignTokens([...cssContents, componentStyleContent]),
    tailwindTokens
  );
  const colors = buildColorInventory([...cssContents, componentStyleContent]);

  // Typography inventory
  const typography = buildTypographyInventory(headings, tokens);

  // Layout inventory
  const layout = buildLayoutInventory(allContent, components);

  // Surface classification
  const surfaceSignals = extractSurfaceSignals(
    allContent,
    targetSubpath || '',
    components,
    headings
  );
  const surface = classifySurface(surfaceSignals);

  // DOM snapshot
  const dom: DOMSnapshot = {
    url: targetSubpath || repoRoot,
    title: extractTitle(allComponentContent),
    viewport: STANDARD_VIEWPORTS[4],  // Default desktop
    rootElement: {
      tag: 'body', id: '', className: '', textContent: '',
      boundingBox: { x: 0, y: 0, width: 1440, height: 900 },
      computedStyles: {}, children: [], depth: 0, selector: 'body'
    },
    elementCount: countElements(allComponentContent),
    interactiveElements,
    headings,
    images,
    links,
    forms: []
  };

  // Accessibility, responsive matrix, and interaction static evaluation
  const accessibility = buildStaticAccessibilityReport(dom, colors);
  const responsiveCaptures = analyzeResponsiveMatrix(dom, layout);
  const interactions = analyzeInteractiveElements(dom);

  return {
    url: targetSubpath || '',
    timestamp: new Date().toISOString(),
    viewport: STANDARD_VIEWPORTS[4],
    dom,
    accessibility,
    typography,
    colors,
    layout,
    components,
    tokens,
    responsiveCaptures,
    interactions,
    consoleErrors: [],
    networkFailures: [],
    surface
  };
}

// ─── Helper Functions ───────────────────────────────────────────────────────

function aggregateComponentInventory(files: UISourceFile[]): ComponentInventory {
  const total: ComponentInventory = {
    cards: 0, badges: 0, buttons: 0, modals: 0, icons: 0,
    charts: 0, banners: 0, pills: 0, images: 0, forms: 0,
    tables: 0, navElements: 0, heroSections: 0
  };

  for (const file of files) {
    const inv = countComponentPatterns(file.content);
    for (const key of Object.keys(total) as (keyof ComponentInventory)[]) {
      total[key] += inv[key];
    }
  }

  return total;
}

function extractInlineStyles(content: string): string {
  // Extract style={{ ... }} blocks from JSX
  const inlineRegex = /style=\{\{([^}]+)\}\}/g;
  const styleBlocks: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = inlineRegex.exec(content)) !== null) {
    // Convert camelCase to kebab-case for consistent parsing
    const cssified = match[1]
      .replace(/([A-Z])/g, '-$1')
      .toLowerCase()
      .replace(/['"`]/g, '');
    styleBlocks.push(cssified);
  }

  // Also extract <style> blocks
  const styleTagRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  while ((match = styleTagRegex.exec(content)) !== null) {
    styleBlocks.push(match[1]);
  }

  return styleBlocks.join('\n');
}

function extractTitle(content: string): string {
  const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
  if (titleMatch) return titleMatch[1];

  // Try h1
  const h1Match = content.match(/<h1[^>]*>([^<]*)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();

  return 'Untitled';
}

function countElements(content: string): number {
  const tags = content.match(/<[a-zA-Z][^>]*>/g);
  return tags ? tags.length : 0;
}

function buildTypographyInventory(
  headings: ReturnType<typeof extractHeadings>,
  tokens: DesignTokenInventory
): TypographyInventory {
  return {
    headings,
    bodyFontSize: tokens.fontSizes.find(t => t.value.includes('16') || t.value === '1rem' || t.value === 'base')?.value || '16px',
    bodyLineHeight: tokens.lineHeights.find(t => t.value.includes('1.5') || t.value.includes('24'))?.value || '1.5',
    fontFamilies: tokens.fontFamilies.map(t => t.value),
    fontSizeScale: tokens.fontSizes.map(t => t.value),
    fontWeightScale: tokens.fontWeights.map(t => t.value),
    maxLineLength: 0,
    maxLineWidth: 0
  };
}

function buildLayoutInventory(
  content: string,
  components: ComponentInventory
): LayoutInventory {
  const lower = content.toLowerCase();

  // Count centered elements
  const centeredPatterns = [
    /text-center/g, /text-align:\s*center/gi,
    /mx-auto/g, /margin:\s*(?:0\s+)?auto/gi,
    /items-center/g, /align-items:\s*center/gi,
    /justify-center/g, /justify-content:\s*center/gi,
    /flex\s+.*center/gi
  ];
  let centeredCount = 0;
  for (const pattern of centeredPatterns) {
    const matches = content.match(pattern);
    if (matches) centeredCount += matches.length;
  }

  // Detect grid/flex usage
  const gridUsage = /display:\s*grid|grid-template/i.test(content) || /\bgrid\b/i.test(content);
  const flexUsage = /display:\s*flex|flex-direction|flex-wrap/i.test(content) || /\bflex\b/i.test(content);

  return {
    containers: [],
    gridUsage,
    flexUsage,
    centeredElements: centeredCount,
    totalElements: countElements(content),
    maxNestingDepth: estimateNestingDepth(content),
    alignmentSystems: detectAlignmentSystems(content),
    spacingDistribution: {}
  };
}

function estimateNestingDepth(content: string): number {
  // Count maximum div nesting depth
  let maxDepth = 0;
  let currentDepth = 0;
  const divOpenRegex = /<div[^>]*>/gi;
  const divCloseRegex = /<\/div>/gi;

  const tokens = content.split(/(<\/?div[^>]*>)/gi);
  for (const token of tokens) {
    if (divOpenRegex.test(token)) {
      currentDepth++;
      maxDepth = Math.max(maxDepth, currentDepth);
      divOpenRegex.lastIndex = 0;
    } else if (divCloseRegex.test(token)) {
      currentDepth = Math.max(0, currentDepth - 1);
      divCloseRegex.lastIndex = 0;
    }
  }

  return maxDepth;
}

function detectAlignmentSystems(content: string): string[] {
  const systems: string[] = [];
  if (/display:\s*grid|grid-template/i.test(content)) systems.push('CSS Grid');
  if (/display:\s*flex/i.test(content)) systems.push('Flexbox');
  if (/\bfloat\s*:/i.test(content)) systems.push('Float (legacy)');
  if (/container|max-w-/i.test(content)) systems.push('Container');
  return systems;
}

function mergeTokenInventories(
  primary: DesignTokenInventory,
  secondary: Partial<DesignTokenInventory>
): DesignTokenInventory {
  const merged = { ...primary };

  for (const key of Object.keys(secondary) as (keyof DesignTokenInventory)[]) {
    const secondaryTokens = secondary[key];
    if (secondaryTokens && Array.isArray(secondaryTokens)) {
      const existing = new Map(merged[key].map(t => [t.value, t]));
      for (const token of secondaryTokens) {
        const ex = existing.get(token.value);
        if (ex) {
          ex.count += token.count;
        } else {
          merged[key].push(token);
        }
      }
    }
  }

  return merged;
}

export {
  collectUISourceFiles,
  countComponentPatterns,
  extractHeadings,
  extractInteractiveElements,
  extractImages,
  extractLinks
} from './dom-probe.js';

export {
  extractDesignTokens,
  buildColorInventory,
  extractColors,
  extractGradients,
  extractTailwindTokens,
  checkContrast,
  hexToRGB,
  relativeLuminance,
  contrastRatio,
  isGenericAIGradient,
  classifyFontUsage
} from './style-probe.js';

export {
  classifySurface,
  extractSurfaceSignals,
  getSurfaceThresholds
} from './surface.js';

export {
  buildStaticAccessibilityReport
} from './accessibility-probe.js';

export {
  analyzeResponsiveMatrix
} from './viewport-runner.js';

export {
  getScreenshotPath,
  createScreenshotEvidence
} from './screenshot-capture.js';

export {
  analyzeInteractiveElements
} from './interaction-probe.js';

export {
  checkPlaywrightAvailability,
  runBrowserEvidenceCollection
} from './playwright-runner.js';

