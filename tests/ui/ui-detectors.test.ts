import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  BrowserEvidence,
  UIRawFinding,
  UIDetector,
  DesignTokenInventory,
  ComponentInventory,
  ColorInventory,
  LayoutInventory,
  TypographyInventory,
  DOMSnapshot,
  AccessibilityReport,
  Surface,
  ViewportSize,
  STANDARD_VIEWPORTS
} from '../../src/ui/types.js';

import { typographyDetectors } from '../../src/ui/detectors/rules/typography.js';
import { colorDetectors } from '../../src/ui/detectors/rules/color.js';
import { spatialDetectors } from '../../src/ui/detectors/rules/spatial.js';
import { compositionDetectors } from '../../src/ui/detectors/rules/composition.js';
import { aiSlopDetectors } from '../../src/ui/detectors/rules/ai-slop.js';
import { designSystemDetectors } from '../../src/ui/detectors/rules/design-system.js';
import { responsiveDetectors } from '../../src/ui/detectors/rules/responsive.js';
import { accessibilityDetectors } from '../../src/ui/detectors/rules/accessibility.js';
import { interactionDetectors } from '../../src/ui/detectors/rules/interaction.js';
import { allUIDetectors, runUIDetectors } from '../../src/ui/detectors/index.js';

// ─── Test Helpers ───────────────────────────────────────────────────────────

function createEmptyTokens(): DesignTokenInventory {
  return {
    colors: [], spacingValues: [], fontSizes: [], fontWeights: [],
    fontFamilies: [], borderRadii: [], shadows: [], breakpoints: [],
    lineHeights: [], letterSpacings: [], zIndices: []
  };
}

function createEmptyComponents(): ComponentInventory {
  return {
    cards: 0, badges: 0, buttons: 0, modals: 0, icons: 0,
    charts: 0, banners: 0, pills: 0, images: 0, forms: 0,
    tables: 0, navElements: 0, heroSections: 0
  };
}

function createEmptyColors(): ColorInventory {
  return {
    backgroundColors: [], textColors: [], borderColors: [],
    accentColors: [], gradients: [], contrastPairs: []
  };
}

function createEmptyDOM(): DOMSnapshot {
  return {
    url: 'test', title: 'Test', viewport: STANDARD_VIEWPORTS[4],
    rootElement: {
      tag: 'body', id: '', className: '', textContent: '',
      boundingBox: { x: 0, y: 0, width: 1440, height: 900 },
      computedStyles: {}, children: [], depth: 0, selector: 'body'
    },
    elementCount: 0, interactiveElements: [], headings: [],
    images: [], links: [], forms: []
  };
}

function createEvidence(overrides: Partial<BrowserEvidence> = {}): BrowserEvidence {
  return {
    url: 'test',
    timestamp: new Date().toISOString(),
    viewport: STANDARD_VIEWPORTS[4],
    dom: createEmptyDOM(),
    accessibility: { tree: { role: 'document', name: '', children: [] }, violations: [], passes: 0, incomplete: 0 },
    typography: { headings: [], bodyFontSize: '16px', bodyLineHeight: '1.5', fontFamilies: [], fontSizeScale: [], fontWeightScale: [], maxLineLength: 0, maxLineWidth: 0 },
    colors: createEmptyColors(),
    layout: { containers: [], gridUsage: true, flexUsage: true, centeredElements: 0, totalElements: 100, maxNestingDepth: 3, alignmentSystems: ['Flexbox'], spacingDistribution: {} },
    components: createEmptyComponents(),
    tokens: createEmptyTokens(),
    consoleErrors: [],
    networkFailures: [],
    surface: 'unknown' as Surface,
    ...overrides
  };
}

async function runDetector(detector: UIDetector, evidence: BrowserEvidence): Promise<UIRawFinding[]> {
  return detector.run(evidence);
}

// ─── Rule Catalog Tests ─────────────────────────────────────────────────────

it('UI Rule Catalog: contains expected number of detectors with unique IDs', () => {
  assert.ok(allUIDetectors.length >= 27, `Expected ≥27 UI detectors, got ${allUIDetectors.length}`);

  const ids = allUIDetectors.map(d => d.id);
  const uniqueIds = new Set(ids);
  assert.strictEqual(ids.length, uniqueIds.size, 'Duplicate detector IDs found');
});

it('UI Rule Catalog: all detectors declare ruleClass classification', () => {
  for (const detector of allUIDetectors) {
    assert.ok(
      ['CERTAIN', 'PROBABLE', 'HEURISTIC'].includes(detector.ruleClass),
      `${detector.id} missing valid ruleClass (got: ${detector.ruleClass})`
    );
  }
});

it('UI Rule Catalog: all detectors declare category from UICategory union', () => {
  const validCategories = new Set([
    'Typography', 'Color', 'Spatial', 'Composition', 'Components',
    'Interaction', 'Responsive', 'Accessibility', 'Motion', 'Content',
    'DesignSystem', 'UISlop'
  ]);

  for (const detector of allUIDetectors) {
    assert.ok(
      validCategories.has(detector.category),
      `${detector.id} has invalid category: ${detector.category}`
    );
  }
});

// ─── Typography Detector Tests ──────────────────────────────────────────────

it('UI-TYPE-001: detects missing heading hierarchy', async () => {
  const evidence = createEvidence({
    typography: { headings: [], bodyFontSize: '16px', bodyLineHeight: '1.5', fontFamilies: [], fontSizeScale: [], fontWeightScale: [], maxLineLength: 0, maxLineWidth: 0 }
  });

  const detector = typographyDetectors.find(d => d.id === 'UI-TYPE-001')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect missing heading hierarchy');
  assert.strictEqual(findings[0].ruleId, 'UI-TYPE-001');
});

it('UI-TYPE-001: detects skipped heading levels', async () => {
  const evidence = createEvidence({
    typography: {
      headings: [
        { level: 1, text: 'Title', selector: 'h1', fontSize: '32px', fontWeight: '700', color: '#000' },
        { level: 3, text: 'Subsection', selector: 'h3', fontSize: '20px', fontWeight: '600', color: '#000' }
      ],
      bodyFontSize: '16px', bodyLineHeight: '1.5', fontFamilies: [], fontSizeScale: [], fontWeightScale: [], maxLineLength: 0, maxLineWidth: 0
    }
  });

  const detector = typographyDetectors.find(d => d.id === 'UI-TYPE-001')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.some(f => f.title.includes('Skipped heading level')), 'Should detect h1 → h3 skip');
});

it('UI-TYPE-002: detects excessive font-size variants', async () => {
  const tokens = createEmptyTokens();
  tokens.fontSizes = Array.from({ length: 15 }, (_, i) => ({
    value: `${10 + i}px`, count: 1, sources: []
  }));

  const evidence = createEvidence({ tokens });
  const detector = typographyDetectors.find(d => d.id === 'UI-TYPE-002')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 15 font-size variants');
  assert.ok(findings[0].title.includes('15'), 'Should report 15 variants');
});

it('UI-TYPE-004: detects body text below readability threshold', async () => {
  const evidence = createEvidence({
    typography: { headings: [], bodyFontSize: '12px', bodyLineHeight: '1.5', fontFamilies: [], fontSizeScale: [], fontWeightScale: [], maxLineLength: 0, maxLineWidth: 0 }
  });

  const detector = typographyDetectors.find(d => d.id === 'UI-TYPE-004')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 12px body text');
  assert.strictEqual(findings[0].ruleClass, 'CERTAIN');
});

// ─── Color Detector Tests ───────────────────────────────────────────────────

it('UI-COLOR-001: detects generic AI purple/blue gradient', async () => {
  const colors = createEmptyColors();
  colors.gradients = [
    { value: 'linear-gradient(135deg, #7c3aed, #3b82f6)', count: 2, sources: [] }
  ];

  const evidence = createEvidence({ colors });
  const detector = colorDetectors.find(d => d.id === 'UI-COLOR-001')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect AI purple/blue gradient');
  assert.strictEqual(findings[0].ruleId, 'UI-COLOR-001');
});

it('UI-COLOR-001: does NOT flag non-AI gradient', async () => {
  const colors = createEmptyColors();
  colors.gradients = [
    { value: 'linear-gradient(180deg, #f5f5f5, #ffffff)', count: 1, sources: [] }
  ];

  const evidence = createEvidence({ colors });
  const detector = colorDetectors.find(d => d.id === 'UI-COLOR-001')!;
  const findings = await runDetector(detector, evidence);

  assert.strictEqual(findings.length, 0, 'Should not flag neutral gradient');
});

it('UI-COLOR-003: detects excessive color palette', async () => {
  const tokens = createEmptyTokens();
  tokens.colors = Array.from({ length: 30 }, (_, i) => ({
    value: `#${i.toString(16).padStart(2, '0')}${i.toString(16).padStart(2, '0')}ff`,
    count: 1, sources: []
  }));

  const evidence = createEvidence({ tokens });
  const detector = colorDetectors.find(d => d.id === 'UI-COLOR-003')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 30 unique colors');
});

// ─── Spatial Detector Tests ─────────────────────────────────────────────────

it('UI-SPATIAL-001: detects everything-centered layout', async () => {
  const evidence = createEvidence({
    layout: {
      containers: [], gridUsage: true, flexUsage: true,
      centeredElements: 20, totalElements: 40,
      maxNestingDepth: 3, alignmentSystems: ['Flexbox'],
      spacingDistribution: {}
    }
  });

  const detector = spatialDetectors.find(d => d.id === 'UI-SPATIAL-001')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect everything-centered layout');
  assert.ok(findings[0].title.includes('Everything-centered'));
});

it('UI-SPATIAL-001: does NOT flag reasonable centering', async () => {
  const evidence = createEvidence({
    layout: {
      containers: [], gridUsage: true, flexUsage: true,
      centeredElements: 3, totalElements: 50,
      maxNestingDepth: 3, alignmentSystems: ['Flexbox'],
      spacingDistribution: {}
    }
  });

  const detector = spatialDetectors.find(d => d.id === 'UI-SPATIAL-001')!;
  const findings = await runDetector(detector, evidence);

  assert.strictEqual(findings.length, 0, 'Should not flag 3/50 centered elements');
});

it('UI-SPATIAL-005: detects excessive nesting depth', async () => {
  const evidence = createEvidence({
    layout: {
      containers: [], gridUsage: true, flexUsage: true,
      centeredElements: 0, totalElements: 100,
      maxNestingDepth: 12, alignmentSystems: [],
      spacingDistribution: {}
    }
  });

  const detector = spatialDetectors.find(d => d.id === 'UI-SPATIAL-005')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 12-level nesting');
});

it('UI-SPATIAL-007: detects excessive border-radius variants', async () => {
  const tokens = createEmptyTokens();
  tokens.borderRadii = Array.from({ length: 10 }, (_, i) => ({
    value: `${i * 2}px`, count: 1, sources: []
  }));

  const evidence = createEvidence({ tokens });
  const detector = spatialDetectors.find(d => d.id === 'UI-SPATIAL-007')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 10 radius variants');
});

// ─── AI Slop Detector Tests ─────────────────────────────────────────────────

it('UI-SLOP-003: detects excessive card usage', async () => {
  const evidence = createEvidence({
    components: { ...createEmptyComponents(), cards: 8 },
    surface: 'landing'
  });

  const detector = aiSlopDetectors.find(d => d.id === 'UI-SLOP-003')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 8 cards on landing page');
});

it('UI-SLOP-003: respects surface-adjusted thresholds', async () => {
  const evidence = createEvidence({
    components: { ...createEmptyComponents(), cards: 8 },
    surface: 'dashboard'
  });

  const detector = aiSlopDetectors.find(d => d.id === 'UI-SLOP-003')!;
  const findings = await runDetector(detector, evidence);

  assert.strictEqual(findings.length, 0, 'Should not flag 8 cards on dashboard (threshold: 12)');
});

it('UI-SLOP-COMPOUND: detects compound AI slop signal', async () => {
  const tokens = createEmptyTokens();
  tokens.colors = Array.from({ length: 25 }, (_, i) => ({
    value: `#${i.toString(16).padStart(2, '0')}${i.toString(16).padStart(2, '0')}ff`,
    count: 1, sources: []
  }));
  tokens.borderRadii = Array.from({ length: 8 }, (_, i) => ({
    value: `${i * 2}px`, count: 1, sources: []
  }));
  tokens.fontFamilies = [{ value: 'Inter', count: 5, sources: [] }];

  const colors = createEmptyColors();
  colors.gradients = [
    { value: 'linear-gradient(135deg, #7c3aed, #3b82f6)', count: 2, sources: [] }
  ];

  const evidence = createEvidence({
    tokens,
    colors,
    components: {
      ...createEmptyComponents(),
      cards: 8, badges: 4, pills: 2, icons: 20, heroSections: 1
    },
    layout: {
      containers: [], gridUsage: true, flexUsage: true,
      centeredElements: 15, totalElements: 30,
      maxNestingDepth: 5, alignmentSystems: ['Flexbox'],
      spacingDistribution: {}
    },
    surface: 'dashboard'
  });

  const detector = aiSlopDetectors.find(d => d.id === 'UI-SLOP-COMPOUND')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect compound AI slop signal');
  assert.ok(findings[0].title.includes('Strong AI-generated UI signal'));
});

it('UI-SLOP-COMPOUND: does NOT flag clean evidence', async () => {
  const tokens = createEmptyTokens();
  tokens.colors = [{ value: '#000000', count: 5, sources: [] }];
  tokens.fontFamilies = [{ value: 'Georgia', count: 3, sources: [] }];

  const evidence = createEvidence({
    tokens,
    components: { ...createEmptyComponents(), buttons: 3, forms: 1 },
    surface: 'settings'
  });

  const detector = aiSlopDetectors.find(d => d.id === 'UI-SLOP-COMPOUND')!;
  const findings = await runDetector(detector, evidence);

  assert.strictEqual(findings.length, 0, 'Should not flag clean evidence');
});

// ─── Design System Detector Tests ───────────────────────────────────────────

it('UI-DS-001: detects excessive shadow definitions', async () => {
  const tokens = createEmptyTokens();
  tokens.shadows = Array.from({ length: 8 }, (_, i) => ({
    value: `0 ${i}px ${i * 2}px rgba(0,0,0,0.${i})`, count: 1, sources: []
  }));

  const evidence = createEvidence({ tokens });
  const detector = designSystemDetectors.find(d => d.id === 'UI-DS-001')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 8 shadow definitions');
});

it('UI-DS-002: detects absence of CSS custom properties', async () => {
  const tokens = createEmptyTokens();
  // 25 hard-coded values with no var() references
  tokens.colors = Array.from({ length: 10 }, (_, i) => ({
    value: `#${i}${i}${i}${i}${i}${i}`, count: 1, sources: []
  }));
  tokens.spacingValues = Array.from({ length: 8 }, (_, i) => ({
    value: `${i * 4}px`, count: 2, sources: []
  }));
  tokens.fontSizes = Array.from({ length: 5 }, (_, i) => ({
    value: `${12 + i * 2}px`, count: 1, sources: []
  }));

  const evidence = createEvidence({ tokens });
  const detector = designSystemDetectors.find(d => d.id === 'UI-DS-002')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect absence of CSS variables');
});

// ─── Composition Detector Tests ─────────────────────────────────────────────

it('UI-COMP-001: detects competing high-weight visual elements', async () => {
  const evidence = createEvidence({
    components: {
      ...createEmptyComponents(),
      heroSections: 2, charts: 2, banners: 1
    }
  });

  const detector = compositionDetectors.find(d => d.id === 'UI-COMP-001')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 5 competing high-weight elements');
});

it('UI-COMP-003: detects excessive component density', async () => {
  const evidence = createEvidence({
    components: {
      ...createEmptyComponents(),
      cards: 8, badges: 5, charts: 4, icons: 6, banners: 2
    }
  });

  const detector = compositionDetectors.find(d => d.id === 'UI-COMP-003')!;
  const findings = await runDetector(detector, evidence);

  assert.ok(findings.length > 0, 'Should detect 25 competing components');
});

// ─── False-Positive Traps ───────────────────────────────────────────────────

it('False-Positive Trap: UI-TYPE-006 respects developer-tool surface for generic fonts', async () => {
  const tokens = createEmptyTokens();
  tokens.fontFamilies = [{ value: 'monospace', count: 5, sources: [] }];

  const evidence = createEvidence({ tokens, surface: 'developer-tool' });
  const detector = typographyDetectors.find(d => d.id === 'UI-TYPE-006')!;
  const findings = await runDetector(detector, evidence);

  assert.strictEqual(findings.length, 0, 'Should not flag system fonts on developer-tool surface');
});

it('False-Positive Trap: UI-SLOP-001 does not fire on actual dashboard surface', async () => {
  const evidence = createEvidence({
    components: {
      ...createEmptyComponents(),
      cards: 6, charts: 2, navElements: 1, badges: 3
    },
    surface: 'dashboard'
  });

  const detector = aiSlopDetectors.find(d => d.id === 'UI-SLOP-001')!;
  const findings = await runDetector(detector, evidence);

  assert.strictEqual(findings.length, 0, 'Should not flag dashboard components on actual dashboard');
});

it('False-Positive Trap: UI-SPATIAL-002 does not flag small codebases', async () => {
  const tokens = createEmptyTokens();
  tokens.spacingValues = [
    { value: '8px', count: 3, sources: [] },
    { value: '16px', count: 4, sources: [] },
    { value: '24px', count: 2, sources: [] }
  ];

  const evidence = createEvidence({ tokens });
  const detector = spatialDetectors.find(d => d.id === 'UI-SPATIAL-002')!;
  const findings = await runDetector(detector, evidence);

  assert.strictEqual(findings.length, 0, 'Should not flag 3 spacing values');
});

// ─── Integration Test ───────────────────────────────────────────────────────

it('UI Engine: runUIDetectors produces structured UIDetectionResult', async () => {
  // Run against the EI codebase itself (has no UI files, should produce minimal findings)
  const result = await runUIDetectors(process.cwd());

  assert.ok(result.findings !== undefined, 'Should have findings array');
  assert.ok(result.evidence !== undefined, 'Should have evidence object');
  assert.ok(result.summary !== undefined, 'Should have summary');
  assert.ok(result.summary.byCategory !== undefined, 'Should have category breakdown');
  assert.ok(typeof result.summary.total === 'number', 'Total should be a number');
});

// ─── Style Probe Tests ──────────────────────────────────────────────────────

it('Style Probe: extractColors finds hex, rgb, and hsl colors', async () => {
  const { extractColors } = await import('../../src/ui/browser/style-probe.js');

  const css = `
    body { color: #333; background: rgb(255, 255, 255); }
    .accent { color: hsl(200, 80%, 50%); }
    .badge { border-color: #ff0000; }
  `;

  const colors = extractColors(css);
  assert.ok(colors.length >= 3, `Expected ≥3 colors, got ${colors.length}`);
  assert.ok(colors.some(c => c.includes('333')), 'Should find #333');
});

it('Style Probe: checkContrast calculates WCAG AA correctly', async () => {
  const { checkContrast } = await import('../../src/ui/browser/style-probe.js');

  // Black on white = 21:1 (max contrast)
  const result1 = checkContrast('#000000', '#ffffff');
  assert.ok(result1!.passes_AA, 'Black on white should pass AA');
  assert.ok(result1!.passes_AAA, 'Black on white should pass AAA');

  // Light gray on white (poor contrast)
  const result2 = checkContrast('#cccccc', '#ffffff');
  assert.ok(!result2!.passes_AA, 'Light gray on white should fail AA');
});

it('Style Probe: isGenericAIGradient detects purple/blue gradients', async () => {
  const { isGenericAIGradient } = await import('../../src/ui/browser/style-probe.js');

  assert.ok(isGenericAIGradient('linear-gradient(135deg, #7c3aed, #3b82f6)'), 'Purple to blue should be detected');
  assert.ok(isGenericAIGradient('linear-gradient(to right, purple, pink)'), 'Purple to pink should be detected');
  assert.ok(!isGenericAIGradient('linear-gradient(180deg, #f5f5f5, #ffffff)'), 'Neutral gradient should not be detected');
});

// ─── Surface Classification Tests ───────────────────────────────────────────

it('Surface Classification: classifies dashboard signals correctly', async () => {
  const { classifySurface } = await import('../../src/ui/browser/surface.js');

  const surface = classifySurface({
    pathKeywords: ['dashboard'],
    headings: [],
    components: createEmptyComponents(),
    hasNavbar: true, hasSidebar: true, hasForm: false, hasTable: true,
    hasHero: false, hasMetricCards: true, hasCharts: true,
    hasPricing: false, hasCodeBlocks: false, hasProductCards: false
  });

  assert.strictEqual(surface, 'dashboard');
});

it('Surface Classification: classifies documentation signals correctly', async () => {
  const { classifySurface } = await import('../../src/ui/browser/surface.js');

  const surface = classifySurface({
    pathKeywords: ['docs', 'api-reference'],
    headings: [],
    components: createEmptyComponents(),
    hasNavbar: true, hasSidebar: true, hasForm: false, hasTable: false,
    hasHero: false, hasMetricCards: false, hasCharts: false,
    hasPricing: false, hasCodeBlocks: true, hasProductCards: false
  });

  assert.strictEqual(surface, 'documentation');
});

it('Surface Classification: surface thresholds adjust per surface type', async () => {
  const { getSurfaceThresholds } = await import('../../src/ui/browser/surface.js');

  const dashThresholds = getSurfaceThresholds('dashboard');
  const landingThresholds = getSurfaceThresholds('landing');

  assert.ok(dashThresholds.maxCards > landingThresholds.maxCards,
    'Dashboard should allow more cards than landing page');
  assert.ok(dashThresholds.allowDenseLayout,
    'Dashboard should allow dense layout');
  assert.ok(!landingThresholds.allowDenseLayout,
    'Landing page should not allow dense layout');
});

// ─── DOM Probe Tests ────────────────────────────────────────────────────────

it('DOM Probe: countComponentPatterns counts cards, buttons, icons', async () => {
  const { countComponentPatterns } = await import('../../src/ui/browser/dom-probe.js');

  const html = `
    <Card><h3>Title</h3></Card>
    <Card><h3>Title 2</h3></Card>
    <button>Click me</button>
    <button>Submit</button>
    <button>Cancel</button>
    <Icon name="star" />
    <svg><path d="M0 0" /></svg>
  `;

  const counts = countComponentPatterns(html);
  assert.strictEqual(counts.cards, 2, 'Should find 2 cards');
  assert.strictEqual(counts.buttons, 3, 'Should find 3 buttons');
  assert.ok(counts.icons >= 2, 'Should find ≥2 icons');
});

it('DOM Probe: extractHeadings finds h1-h6 elements', async () => {
  const { extractHeadings } = await import('../../src/ui/browser/dom-probe.js');

  const html = `
    <h1>Main Title</h1>
    <h2>Section One</h2>
    <h3>Subsection</h3>
    <h2>Section Two</h2>
  `;

  const headings = extractHeadings(html);
  assert.strictEqual(headings.length, 4, 'Should find 4 headings');
  assert.strictEqual(headings[0].level, 1);
  assert.strictEqual(headings[0].text, 'Main Title');
  assert.strictEqual(headings[3].level, 2);
});

// ─── Responsive Detectors Tests ─────────────────────────────────────────────

it('UI-RESP-001: detects horizontal overflow on mobile viewports', async () => {
  const { uiResp001 } = await import('../../src/ui/detectors/rules/responsive.js');
  const evidence = createEvidence({
    responsiveCaptures: [{
      viewport: STANDARD_VIEWPORTS[0], // 375px
      dom: createEmptyDOM(),
      overflowElements: [{ selector: '.wide-table', direction: 'horizontal', overflowAmount: 120 }],
      clippedElements: [],
      touchTargets: []
    }]
  });

  const findings = await runDetector(uiResp001, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-RESP-001');
  assert.ok(findings[0].message.includes('overflows viewport horizontally'));
});

it('UI-RESP-005: detects tiny touch targets on mobile viewports', async () => {
  const { uiResp005 } = await import('../../src/ui/detectors/rules/responsive.js');
  const evidence = createEvidence({
    responsiveCaptures: [{
      viewport: STANDARD_VIEWPORTS[1], // 390px
      dom: createEmptyDOM(),
      overflowElements: [],
      clippedElements: [],
      touchTargets: [{ selector: '.close-btn', width: 24, height: 24, isTooSmall: true, minimumSize: 44 }]
    }]
  });

  const findings = await runDetector(uiResp005, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-RESP-005');
  assert.ok(findings[0].message.includes('smaller than minimum recommended'));
});

it('UI-RESP-006: detects desktop-only fixed width assumptions', async () => {
  const { uiResp006 } = await import('../../src/ui/detectors/rules/responsive.js');
  const evidence = createEvidence({
    layout: {
      ...createEvidence().layout,
      containers: [{
        selector: '.container',
        display: 'block',
        width: '1200px',
        padding: '20px',
        margin: '0 auto',
        borderRadius: '8px',
        hasNestedContainer: false,
        childCount: 4,
        depth: 1
      }]
    },
    tokens: {
      ...createEmptyTokens(),
      breakpoints: []
    }
  });

  const findings = await runDetector(uiResp006, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-RESP-006');
});

// ─── Accessibility Detectors Tests ──────────────────────────────────────────

it('UI-A11Y-001: detects missing image alt text', async () => {
  const { uiA11y001 } = await import('../../src/ui/detectors/rules/accessibility.js');
  const evidence = createEvidence({
    dom: {
      ...createEmptyDOM(),
      images: [
        { src: 'hero.png', alt: '', width: 800, height: 400, naturalWidth: 800, naturalHeight: 400, isDecorative: false, selector: 'img.hero' },
        { src: 'icon.png', alt: '', width: 24, height: 24, naturalWidth: 24, naturalHeight: 24, isDecorative: true, selector: 'img.icon' }
      ]
    }
  });

  const findings = await runDetector(uiA11y001, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-A11Y-001');
});

it('UI-A11Y-002: detects form inputs lacking associated labels', async () => {
  const { uiA11y002 } = await import('../../src/ui/detectors/rules/accessibility.js');
  const evidence = createEvidence({
    dom: {
      ...createEmptyDOM(),
      forms: [{
        action: '/login',
        method: 'POST',
        selector: 'form',
        inputs: [
          { type: 'text', name: 'email', required: true, hasVisibleLabel: false, selector: 'input[name="email"]' },
          { type: 'password', name: 'password', required: true, hasVisibleLabel: true, label: 'Password', selector: 'input[name="password"]' }
        ]
      }]
    }
  });

  const findings = await runDetector(uiA11y002, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-A11Y-002');
});

it('UI-A11Y-003: detects empty interactive elements without accessible text', async () => {
  const { uiA11y003 } = await import('../../src/ui/detectors/rules/accessibility.js');
  const evidence = createEvidence({
    dom: {
      ...createEmptyDOM(),
      interactiveElements: [
        { tag: 'button', role: 'button', text: '', selector: 'button.icon-btn', boundingBox: { x: 0, y: 0, width: 40, height: 40 }, isVisible: true, isDisabled: false, tabIndex: 0 },
        { tag: 'button', role: 'button', text: 'Submit', selector: 'button.submit', boundingBox: { x: 0, y: 0, width: 80, height: 40 }, isVisible: true, isDisabled: false, tabIndex: 0 }
      ]
    }
  });

  const findings = await runDetector(uiA11y003, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-A11Y-003');
});

it('UI-A11Y-004: detects low contrast text pairs under WCAG AA', async () => {
  const { uiA11y004 } = await import('../../src/ui/detectors/rules/accessibility.js');
  const evidence = createEvidence({
    colors: {
      ...createEmptyColors(),
      contrastPairs: [
        { foreground: '#9ca3af', background: '#ffffff', ratio: 2.8, passes_AA: false, passes_AAA: false, selector: 'p.muted', fontSize: '14px' },
        { foreground: '#111827', background: '#ffffff', ratio: 15.2, passes_AA: true, passes_AAA: true, selector: 'p.body', fontSize: '16px' }
      ]
    }
  });

  const findings = await runDetector(uiA11y004, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-A11Y-004');
  assert.ok(findings[0].message.includes('below 4.5:1'));
});

it('UI-A11Y-005: detects positive tabindex antipattern', async () => {
  const { uiA11y005 } = await import('../../src/ui/detectors/rules/accessibility.js');
  const evidence = createEvidence({
    dom: {
      ...createEmptyDOM(),
      interactiveElements: [
        { tag: 'input', role: 'textbox', text: '', selector: 'input.first', boundingBox: { x: 0, y: 0, width: 100, height: 30 }, isVisible: true, isDisabled: false, tabIndex: 5 },
        { tag: 'button', role: 'button', text: 'Save', selector: 'button', boundingBox: { x: 0, y: 0, width: 60, height: 30 }, isVisible: true, isDisabled: false, tabIndex: 0 }
      ]
    }
  });

  const findings = await runDetector(uiA11y005, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-A11Y-005');
});

// ─── Interaction Detectors Tests ────────────────────────────────────────────

it('UI-INTERACT-001: detects non-semantic elements used as buttons', async () => {
  const { uiInteract001 } = await import('../../src/ui/detectors/rules/interaction.js');
  const evidence = createEvidence({
    dom: {
      ...createEmptyDOM(),
      interactiveElements: [
        { tag: 'div', role: 'button', text: 'Click me', selector: 'div.fake-btn', boundingBox: { x: 0, y: 0, width: 100, height: 40 }, isVisible: true, isDisabled: false, tabIndex: 0 }
      ]
    }
  });

  const findings = await runDetector(uiInteract001, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-INTERACT-001');
});

// ─── AI Slop Detectors Tests ────────────────────────────────────────────────

it('UI-SLOP-002: detects purple/blue AI aesthetic palette', async () => {
  const { uiSlop002 } = await import('../../src/ui/detectors/rules/ai-slop.js');
  const evidence = createEvidence({
    tokens: {
      ...createEmptyTokens(),
      colors: [
        { value: '#8b5cf6', count: 5, sources: [] },
        { value: '#6366f1', count: 4, sources: [] }
      ]
    }
  });

  const findings = await runDetector(uiSlop002, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-SLOP-002');
});

it('UI-SLOP-007: detects everything-centered layout', async () => {
  const { uiSlop007 } = await import('../../src/ui/detectors/rules/ai-slop.js');
  const evidence = createEvidence({
    layout: {
      ...createEvidence().layout,
      centeredElements: 12,
      totalElements: 18
    }
  });

  const findings = await runDetector(uiSlop007, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-SLOP-007');
});

it('UI-SLOP-010: detects formulaic hero template on landing surface', async () => {
  const { uiSlop010 } = await import('../../src/ui/detectors/rules/ai-slop.js');
  const evidence = createEvidence({
    surface: 'landing',
    components: {
      ...createEmptyComponents(),
      heroSections: 1,
      pills: 1,
      buttons: 2
    }
  });

  const findings = await runDetector(uiSlop010, evidence);
  assert.strictEqual(findings.length, 1);
  assert.strictEqual(findings[0].ruleId, 'UI-SLOP-010');
});

// ─── Browser Probe Module Tests ─────────────────────────────────────────────

it('Accessibility Probe: buildStaticAccessibilityReport generates report with tree and violations', async () => {
  const { buildStaticAccessibilityReport } = await import('../../src/ui/browser/accessibility-probe.js');
  const dom = createEmptyDOM();
  dom.headings = [{ level: 1, text: 'Title', selector: 'h1', fontSize: '32px', fontWeight: '700', color: '#111827' }];
  dom.images = [{ src: 'broken.png', alt: '', width: 100, height: 100, naturalWidth: 100, naturalHeight: 100, isDecorative: false, selector: 'img' }];

  const report = buildStaticAccessibilityReport(dom, createEmptyColors());
  assert.strictEqual(report.tree.children.length, 1);
  assert.strictEqual(report.violations.length, 1);
  assert.strictEqual(report.violations[0].id, 'image-alt');
});

it('Viewport Runner: analyzeResponsiveMatrix evaluates 5 standard viewports', async () => {
  const { analyzeResponsiveMatrix } = await import('../../src/ui/browser/viewport-runner.js');
  const dom = createEmptyDOM();
  const layout: LayoutInventory = {
    ...createEvidence().layout,
    containers: [{
      selector: '.fixed-card',
      display: 'block',
      width: '500px',
      padding: '16px',
      margin: '0',
      borderRadius: '4px',
      hasNestedContainer: false,
      childCount: 2,
      depth: 1
    }]
  };

  const captures = analyzeResponsiveMatrix(dom, layout);
  assert.strictEqual(captures.length, 5);
  // iPhone SE (375px) should flag 500px container as overflow
  const seCapture = captures.find(c => c.viewport.width === 375);
  assert.ok(seCapture);
  assert.strictEqual(seCapture.overflowElements.length, 1);
  assert.strictEqual(seCapture.overflowElements[0].overflowAmount, 125);
});

it('Interaction Probe: analyzeInteractiveElements produces interaction results', async () => {
  const { analyzeInteractiveElements } = await import('../../src/ui/browser/interaction-probe.js');
  const dom = createEmptyDOM();
  dom.interactiveElements = [
    { tag: 'button', role: 'button', text: 'Save', selector: '#save-btn', boundingBox: { x: 0, y: 0, width: 60, height: 36 }, isVisible: true, isDisabled: false, tabIndex: 0 }
  ];

  const results = analyzeInteractiveElements(dom);
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].action, 'click');
  assert.strictEqual(results[0].target, '#save-btn');
});

it('Screenshot Capture: getScreenshotPath generates predictable paths', async () => {
  const { getScreenshotPath, createScreenshotEvidence } = await import('../../src/ui/browser/screenshot-capture.js');
  const path = getScreenshotPath('/tmp/test-repo', STANDARD_VIEWPORTS[0]);
  assert.ok(path.includes('375x812.png'));

  const evidence = createScreenshotEvidence(path, STANDARD_VIEWPORTS[0], 'http://localhost:3000');
  assert.strictEqual(evidence.viewport.width, 375);
  assert.strictEqual(evidence.url, 'http://localhost:3000');
});

it('Playwright Runner: checkPlaywrightAvailability returns status without throw', async () => {
  const { checkPlaywrightAvailability } = await import('../../src/ui/browser/playwright-runner.js');
  const status = await checkPlaywrightAvailability();
  assert.ok(typeof status.available === 'boolean');
});

// ─── Design System Extract Tests ───────────────────────────────────────────

it('Design System Extract: enforces restraint doctrine with 3+ uses threshold', async () => {
  const { extractDesignSystem, formatExtractionReport } = await import('../../src/ui/design-system/extract.js');

  const evidence = createEvidence({
    tokens: {
      ...createEvidence().tokens,
      colors: [
        { value: '#6366f1', count: 5, sources: ['.btn', '.badge'] }, // ≥ 3 -> TOKENIZE
        { value: '#ef4444', count: 1, sources: ['.error'] },          // < 3 -> DO NOT EXTRACT
      ],
      spacingValues: [
        { value: '16px', count: 8, sources: ['.card', '.nav'] },     // ≥ 3 -> TOKENIZE
        { value: '7px', count: 1, sources: ['.misc'] },              // < 3 -> DO NOT EXTRACT
      ],
      borderRadii: [
        { value: '8px', count: 4, sources: ['.card'] }               // ≥ 3 -> TOKENIZE
      ]
    },
    components: {
      ...createEvidence().components,
      buttons: 6, // ≥ 3 -> SHARE
      cards: 1    // < 3 -> DO NOT EXTRACT
    }
  });

  const report = extractDesignSystem(evidence);

  assert.strictEqual(report.tokenize.length, 3, 'Should tokenize 3 items (#6366f1, 16px, 8px)');
  assert.ok(report.tokenize.some(t => t.value === '#6366f1'));
  assert.ok(report.tokenize.some(t => t.value === '16px'));
  assert.ok(report.tokenize.some(t => t.value === '8px'));

  assert.strictEqual(report.share.length, 1, 'Should share 1 component (Button)');
  assert.strictEqual(report.share[0].name, 'Button');

  assert.ok(report.doNotExtract.length >= 2, 'Should suppress one-off colors and cards');
  assert.ok(report.generatedCssVars.includes('--color-6366f1'));

  const formatted = formatExtractionReport(report);
  assert.ok(formatted.includes('TOKENIZE'));
  assert.ok(formatted.includes('SHARE'));
  assert.ok(formatted.includes('KEEP LOCAL'));
});

// ─── Visual Reasoning Questions Tests ──────────────────────────────────────

it('Visual Reasoning: evaluates 15 structured questions against evidence', async () => {
  const { evaluateVisualReasoning, generateVisionReasoningPrompt, VISUAL_REASONING_QUESTIONS } = await import('../../src/ui/reasoning/questions.js');

  assert.strictEqual(VISUAL_REASONING_QUESTIONS.length, 15);

  const evidence = createEvidence({
    components: {
      ...createEvidence().components,
      cards: 10, // will trigger warnings on card clutter
      badges: 8
    }
  });

  const evaluations = evaluateVisualReasoning(evidence);
  assert.strictEqual(evaluations.length, 15);

  const q3 = evaluations.find(e => e.questionId === 3);
  assert.ok(q3 && q3.score === 'PROBLEM');

  const prompt = generateVisionReasoningPrompt(evidence, 'dashboard');
  assert.ok(prompt.includes('15. Which element should become stronger?'));
  assert.ok(prompt.includes('[dashboard]'));
});

// ─── Distillation Reasoning Tests ──────────────────────────────────────────

it('Distill Engine: recommends container consolidation and calculates clutter score', async () => {
  const { distillInterface } = await import('../../src/ui/reasoning/distill.js');

  const evidence = createEvidence({
    surface: 'landing',
    components: {
      ...createEvidence().components,
      cards: 8, // landing max is 4
      badges: 10,
      pills: 2
    },
    colors: {
      ...createEvidence().colors,
      gradients: [
        { value: 'linear-gradient(135deg, #667eea, #764ba2)', count: 2, sources: [] },
        { value: 'linear-gradient(45deg, #f093fb, #f5576c)', count: 1, sources: [] },
        { value: 'linear-gradient(to right, #4facfe, #00f2fe)', count: 1, sources: [] }
      ]
    }
  });

  const result = distillInterface(evidence);
  assert.ok(result.directives.length >= 2);
  assert.ok(result.directives.some(d => d.type === 'CONSOLIDATE'));
  assert.ok(result.directives.some(d => d.type === 'REMOVE'));
  assert.ok(result.metrics.clutterScore > 50);
});

// ─── Layout Reasoning Tests ────────────────────────────────────────────────

it('Layout Engine: detects excessive centering and non-harmonic spacing', async () => {
  const { analyzeLayout } = await import('../../src/ui/reasoning/layout.js');

  const evidence = createEvidence({
    layout: {
      ...createEvidence().layout,
      centeredElements: 8,
      totalElements: 10, // 80% centered!
      gridUsage: false,
      flexUsage: false
    },
    tokens: {
      ...createEvidence().tokens,
      spacingValues: [
        { value: '7px', count: 1, sources: [] },
        { value: '13px', count: 1, sources: [] },
        { value: '19px', count: 1, sources: [] },
        { value: '23px', count: 1, sources: [] }
      ]
    }
  });

  const analysis = analyzeLayout(evidence);
  assert.ok(analysis.centeringRatio > 0.7);
  assert.strictEqual(analysis.spacingHarmonicScore, 0); // 7, 13, 19, 23 not divisible by 4 or 8
  assert.ok(analysis.interventions.some(i => i.category === 'ALIGNMENT'));
  assert.ok(analysis.interventions.some(i => i.category === 'SPACING'));
});

// ─── Typography Reasoning Tests ────────────────────────────────────────────

it('Typography Engine: flags skipped heading levels and small body sizes', async () => {
  const { analyzeTypography } = await import('../../src/ui/reasoning/typeset.js');

  const evidence = createEvidence({
    typography: {
      headings: [
        { level: 1, text: 'Title', selector: 'h1', fontSize: '32px', fontWeight: '700', color: '#000' },
        { level: 4, text: 'Deep Subheading', selector: 'h4', fontSize: '18px', fontWeight: '600', color: '#333' } // skipped h2 & h3
      ],
      bodyFontSize: '11px', // under 14px threshold
      bodyLineHeight: '1.2',
      fontFamilies: ['Inter', 'sans-serif'],
      fontSizeScale: ['11px', '18px', '32px'],
      fontWeightScale: ['400', '600', '700'],
      maxLineLength: 60,
      maxLineWidth: 600
    },
    tokens: {
      ...createEvidence().tokens,
      fontSizes: [
        { value: '11px', count: 2, sources: [] },
        { value: '18px', count: 1, sources: [] },
        { value: '32px', count: 1, sources: [] }
      ]
    }
  });

  const analysis = analyzeTypography(evidence);
  assert.strictEqual(analysis.hasValidHeadingHierarchy, false);
  assert.ok(analysis.interventions.some(i => i.category === 'HIERARCHY'));
  assert.ok(analysis.interventions.some(i => i.category === 'READABILITY'));
});

// ─── Hardening Reasoning Tests ─────────────────────────────────────────────

it('Hardening Engine: identifies unlabeled inputs, small touch targets, and a11y gaps', async () => {
  const { hardenInterface } = await import('../../src/ui/reasoning/harden.js');

  const evidence = createEvidence({
    accessibility: {
      tree: { role: 'root', name: '', children: [] },
      violations: [{ id: 'color-contrast', impact: 'serious', description: 'Low contrast', helpUrl: '', nodes: [] }],
      passes: 5,
      incomplete: 0
    },
    dom: {
      ...createEmptyDOM(),
      forms: [{
        inputs: [{ type: 'text', name: 'email', required: true, hasVisibleLabel: false, selector: 'input#email' }],
        selector: 'form'
      }],
      interactiveElements: [
        { tag: 'div', role: '', text: 'Fake Button', selector: 'div.btn', boundingBox: { x: 0, y: 0, width: 30, height: 25 }, isVisible: true, isDisabled: false, tabIndex: -1 }
      ]
    },
    responsiveCaptures: [{
      viewport: STANDARD_VIEWPORTS[0], // 375px
      dom: createEmptyDOM(),
      overflowElements: [],
      clippedElements: [],
      touchTargets: [{ selector: 'div.btn', width: 30, height: 25, isTooSmall: true, minimumSize: 44 }]
    }]
  });

  const result = hardenInterface(evidence);
  assert.strictEqual(result.accessibilityViolationsCount, 1);
  assert.strictEqual(result.unlabeledInputsCount, 1);
  assert.strictEqual(result.smallTouchTargetsCount, 1);
  assert.strictEqual(result.nonSemanticClickablesCount, 1);
  assert.ok(result.readinessScore < 70);
});

// ─── Polish Reasoning Tests ────────────────────────────────────────────────

it('Polish Engine: flags color palette explosion and low contrast pass rates', async () => {
  const { polishInterface } = await import('../../src/ui/reasoning/polish.js');

  const evidence = createEvidence({
    tokens: {
      ...createEvidence().tokens,
      colors: Array.from({ length: 15 }, (_, i) => ({ value: `#${i}${i}0000`, count: 1, sources: [] })),
      borderRadii: [
        { value: '2px', count: 1, sources: [] },
        { value: '4px', count: 1, sources: [] },
        { value: '8px', count: 1, sources: [] },
        { value: '16px', count: 1, sources: [] },
        { value: '24px', count: 1, sources: [] }
      ]
    },
    colors: {
      ...createEvidence().colors,
      contrastPairs: [
        { foreground: '#fff', background: '#000', ratio: 21, passes_AA: true, passes_AAA: true, selector: 'h1', fontSize: '24px' },
        { foreground: '#888', background: '#fff', ratio: 2.8, passes_AA: false, passes_AAA: false, selector: 'p', fontSize: '14px' }
      ]
    }
  });

  const result = polishInterface(evidence);
  assert.strictEqual(result.colorCount, 15);
  assert.strictEqual(result.radiusCount, 5);
  assert.strictEqual(result.contrastPassRate, 50);
  assert.ok(result.refinements.some(r => r.area === 'COLOR'));
  assert.ok(result.refinements.some(r => r.area === 'RADIUS'));
  assert.ok(result.refinements.some(r => r.area === 'CONTRAST'));
});

// ─── Verification Engine Tests ─────────────────────────────────────────────

it('Verification Engine: computes diff, detects resolved issues and flags regressions', async () => {
  const { verifyUIChanges } = await import('../../src/ui/reasoning/verify.js');

  const beforeEvidence = createEvidence({ components: { ...createEvidence().components, cards: 8 } });
  const afterEvidence = createEvidence({ components: { ...createEvidence().components, cards: 3 } });

  const beforeFindings: UIRawFinding[] = [
    { ruleId: 'UI-SLOP-003', category: 'UISlop', title: 'Card overload', message: 'Too many cards', evidence: '8 cards', confidence: 'HIGH', impact: 'HIGH', disposition: 'FIX' }
  ];

  // Case 1: Issue resolved cleanly
  const passDiff = verifyUIChanges(beforeEvidence, afterEvidence, beforeFindings, []);
  assert.strictEqual(passDiff.verdict, 'PASS');
  assert.strictEqual(passDiff.resolvedFindings.length, 1);
  assert.strictEqual(passDiff.newFindings.length, 0);
  assert.strictEqual(passDiff.componentDiff.cardsDelta, -5);

  // Case 2: Regression introduced
  const regressionFindings: UIRawFinding[] = [
    { ruleId: 'UI-RESP-001', category: 'Responsive', title: 'Horizontal overflow', message: 'Clipped', evidence: '100px', confidence: 'HIGH', impact: 'CRITICAL', disposition: 'BLOCK' }
  ];
  const regDiff = verifyUIChanges(beforeEvidence, afterEvidence, beforeFindings, regressionFindings);
  assert.strictEqual(regDiff.verdict, 'REGRESSION');
  assert.strictEqual(regDiff.hasRegressions, true);
});

// ─── Workflow Router & 5-Pass Critique Tests ───────────────────────────────

it('Workflow Router & 5-Pass Critique: dynamically routes workflows and builds 5 passes', async () => {
  const { chooseWorkflows, runFivePassCritique } = await import('../../src/ui/reasoning/index.js');

  const evidence = createEvidence({
    components: { ...createEvidence().components, cards: 10 },
    tokens: {
      ...createEvidence().tokens,
      fontSizes: Array.from({ length: 10 }, (_, i) => ({ value: `${12 + i}px`, count: 1, sources: [] }))
    }
  });

  const findings: UIRawFinding[] = [
    { ruleId: 'UI-SLOP-003', category: 'UISlop', title: 'Card overload', message: 'Too many cards', evidence: '10 cards', confidence: 'HIGH', impact: 'HIGH', disposition: 'FIX' },
    { ruleId: 'UI-TYPE-002', category: 'Typography', title: 'Type explosion', message: '10 font sizes', evidence: '10 sizes', confidence: 'HIGH', impact: 'MEDIUM', disposition: 'REVIEW' }
  ];

  const routing = chooseWorkflows(evidence, findings);
  assert.ok(routing.workflows.includes('distill'), 'Should select distill for card overload');
  assert.ok(routing.workflows.includes('typeset'), 'Should select typeset for typography explosion');

  const critique = runFivePassCritique(evidence, findings);
  assert.strictEqual(critique.disposition, 'FIX');
  assert.ok(critique.pass2_signals.slopSignature.includes('Card Container Wall'));
  assert.ok(critique.pass4_interventions.some(i => i.action === 'RESTRUCTURE' || i.action === 'SIMPLIFY'));
  assert.ok(critique.pass5_verificationPlan.criticalChecks.length >= 4);
});


