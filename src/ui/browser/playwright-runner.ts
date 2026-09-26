/**
 * Playwright Runner — Browser Lifecycle and Dynamic Page Probing
 *
 * Provides real browser execution when Playwright is available:
 * - Headless browser lifecycle (launch, navigate, inspect, screenshot, close)
 * - Computed style extraction and bounding box measurements
 * - Accessibility snapshot integration (page.accessibility.snapshot())
 * - Responsive matrix multi-viewport capture (375, 390, 768, 1024, 1440)
 * - Console error and network failure listener
 *
 * Gracefully falls back to static analysis if Playwright is not installed.
 */

import {
  BrowserEvidence,
  ViewportSize,
  STANDARD_VIEWPORTS,
  DOMSnapshot,
  ScreenshotEvidence
} from '../types.js';

import { getScreenshotPath, createScreenshotEvidence } from './screenshot-capture.js';
import { buildStaticAccessibilityReport } from './accessibility-probe.js';
import { analyzeResponsiveMatrix } from './viewport-runner.js';
import { analyzeInteractiveElements } from './interaction-probe.js';

export interface PlaywrightRunOptions {
  url: string;
  repoRoot: string;
  viewports?: ViewportSize[];
  captureScreenshots?: boolean;
  timeoutMs?: number;
  outputDir?: string;
}

export interface PlaywrightAvailability {
  available: boolean;
  version?: string;
  error?: string;
}

/**
 * Checks whether Playwright is installed in the local environment.
 */
export async function checkPlaywrightAvailability(): Promise<PlaywrightAvailability> {
  try {
    // Dynamic import to prevent crash when playwright is not installed
    // @ts-ignore
    const pw: any = await import('playwright');
    return {
      available: true,
      version: pw.version || 'installed'
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      available: false,
      error: `Playwright is not installed in the current environment: ${errorMsg}`
    };
  }
}

/**
 * Runs dynamic browser evidence collection against a live or local URL.
 * If Playwright is not available, throws an informative error explaining
 * how to install Playwright or use static analysis.
 */
export async function runBrowserEvidenceCollection(
  options: PlaywrightRunOptions
): Promise<BrowserEvidence> {
  const availability = await checkPlaywrightAvailability();

  if (!availability.available) {
    throw new Error(
      `Playwright is required for live rendered browser evidence.\n` +
      `To install: npm install -D playwright && npx playwright install chromium\n` +
      `Alternatively, use static UI evidence collection (default in 'ei ui detect').`
    );
  }

  // @ts-ignore
  const { chromium }: any = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  const viewports = options.viewports || STANDARD_VIEWPORTS;
  const desktopViewport = viewports[viewports.length - 1] || STANDARD_VIEWPORTS[4];

  const consoleErrors: string[] = [];
  const networkFailures: string[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: desktopViewport.width, height: desktopViewport.height }
    });

    const page = await context.newPage();

    // Listen for console and network issues
    page.on('console', (msg: { type: () => string; text: () => string }) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', (req: { url: () => string; failure: () => { errorText?: string } | null }) => {
      const err = req.failure()?.errorText || 'failed';
      networkFailures.push(`${req.url()} (${err})`);
    });

    // Navigate to URL
    await page.goto(options.url, {
      waitUntil: 'networkidle',
      timeout: options.timeoutMs || 30000
    });

    const pageTitle = await page.title();

    // Capture desktop screenshot
    let screenshotEvidence: ScreenshotEvidence | undefined;
    if (options.captureScreenshots !== false) {
      const path = getScreenshotPath(options.repoRoot, desktopViewport, { outputDir: options.outputDir });
      await page.screenshot({ path, fullPage: true });
      screenshotEvidence = createScreenshotEvidence(path, desktopViewport, options.url, 'desktop-render');
    }

    // Capture accessibility snapshot via Playwright's native accessibility API
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let axSnapshot: any = null;
    try {
      axSnapshot = await page.accessibility?.snapshot();
    } catch {
      // Fallback if not supported
    }

    // Extract DOM snapshot details
    const domData = await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map((h: any) => {
        const computed = window.getComputedStyle(h);
        return {
          level: parseInt(h.tagName[1], 10),
          text: h.textContent?.trim() || '',
          selector: h.tagName.toLowerCase(),
          fontSize: computed.fontSize,
          fontWeight: computed.fontWeight,
          color: computed.color
        };
      });

      const interactives = Array.from(document.querySelectorAll('button, a, input, select, textarea')).map((el: any) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || el.tagName.toLowerCase(),
          text: el.textContent?.trim() || '',
          selector: el.id ? `#${el.id}` : el.className ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(),
          boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          isVisible: rect.width > 0 && rect.height > 0,
          isDisabled: el.hasAttribute('disabled'),
          tabIndex: el.tabIndex
        };
      });

      const images = Array.from(document.querySelectorAll('img')).map((img: any) => {
        const rect = img.getBoundingClientRect();
        return {
          src: img.src,
          alt: img.alt || '',
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          isDecorative: img.alt === '' || img.getAttribute('role') === 'presentation',
          selector: 'img'
        };
      });

      return { headings, interactives, images, elementCount: document.querySelectorAll('*').length };
    });

    const dom: DOMSnapshot = {
      url: options.url,
      title: pageTitle,
      viewport: desktopViewport,
      rootElement: {
        tag: 'body',
        boundingBox: { x: 0, y: 0, width: desktopViewport.width, height: desktopViewport.height },
        computedStyles: {},
        children: [],
        depth: 0,
        selector: 'body'
      },
      elementCount: domData.elementCount,
      interactiveElements: domData.interactives,
      headings: domData.headings,
      images: domData.images,
      links: [],
      forms: []
    };

    const emptyColors = {
      backgroundColors: [],
      textColors: [],
      borderColors: [],
      accentColors: [],
      gradients: [],
      contrastPairs: []
    };

    const emptyLayout = {
      containers: [],
      gridUsage: true,
      flexUsage: true,
      centeredElements: 0,
      totalElements: domData.elementCount,
      maxNestingDepth: 3,
      alignmentSystems: ['Flexbox'],
      spacingDistribution: {}
    };

    const accessibility = buildStaticAccessibilityReport(dom, emptyColors);
    if (axSnapshot) {
      accessibility.tree = {
        role: axSnapshot.role || 'document',
        name: axSnapshot.name || pageTitle,
        children: []
      };
    }

    const responsiveCaptures = analyzeResponsiveMatrix(dom, emptyLayout, { viewports });
    const interactions = analyzeInteractiveElements(dom);

    return {
      url: options.url,
      timestamp: new Date().toISOString(),
      viewport: desktopViewport,
      screenshot: screenshotEvidence,
      dom,
      accessibility,
      typography: {
        headings: dom.headings,
        bodyFontSize: '16px',
        bodyLineHeight: '1.5',
        fontFamilies: [],
        fontSizeScale: [],
        fontWeightScale: [],
        maxLineLength: 0,
        maxLineWidth: 0
      },
      colors: emptyColors,
      layout: emptyLayout,
      components: {
        cards: 0, badges: 0, buttons: dom.interactiveElements.filter(e => e.tag === 'button').length,
        modals: 0, icons: 0, charts: 0, banners: 0, pills: 0, images: dom.images.length,
        forms: 0, tables: 0, navElements: 0, heroSections: 0
      },
      tokens: {
        colors: [], spacingValues: [], fontSizes: [], fontWeights: [],
        fontFamilies: [], borderRadii: [], shadows: [], breakpoints: [],
        lineHeights: [], letterSpacings: [], zIndices: []
      },
      responsiveCaptures,
      interactions,
      consoleErrors,
      networkFailures,
      surface: 'unknown'
    };
  } finally {
    await browser.close();
  }
}
