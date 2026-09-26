/**
 * UI Intelligence Type System
 *
 * Defines the complete type vocabulary for the UI Intelligence Engine,
 * which extends Engineering Intelligence to understand rendered interfaces,
 * not just source code.
 *
 * Key principle: Engineering evidence comes from code.
 *               UI evidence comes from code → rendered page → observation.
 */

// ─── UI Categories ──────────────────────────────────────────────────────────

export type UICategory =
  | 'Typography'
  | 'Color'
  | 'Spatial'
  | 'Composition'
  | 'Components'
  | 'Interaction'
  | 'Responsive'
  | 'Accessibility'
  | 'Motion'
  | 'Content'
  | 'DesignSystem'
  | 'UISlop';

// ─── Surface Classification ─────────────────────────────────────────────────

/**
 * Before UI critique, EI must understand what surface it is evaluating.
 * A brutalist developer tool and a luxury ecommerce site should not receive
 * the same critique.
 */
export type Surface =
  | 'landing'
  | 'marketing'
  | 'dashboard'
  | 'settings'
  | 'checkout'
  | 'ecommerce'
  | 'admin'
  | 'mobile'
  | 'documentation'
  | 'developer-tool'
  | 'consumer-app'
  | 'unknown';

// ─── Visual Tokens ──────────────────────────────────────────────────────────

export interface VisualToken {
  value: string;
  count: number;
  sources: string[];  // CSS selectors where observed
}

export interface DesignTokenInventory {
  colors: VisualToken[];
  spacingValues: VisualToken[];
  fontSizes: VisualToken[];
  fontWeights: VisualToken[];
  fontFamilies: VisualToken[];
  borderRadii: VisualToken[];
  shadows: VisualToken[];
  breakpoints: VisualToken[];
  lineHeights: VisualToken[];
  letterSpacings: VisualToken[];
  zIndices: VisualToken[];
}

// ─── DOM Evidence ───────────────────────────────────────────────────────────

export interface DOMElement {
  tag: string;
  id?: string;
  className?: string;
  textContent?: string;
  role?: string;
  ariaLabel?: string;
  boundingBox: BoundingBox;
  computedStyles: Record<string, string>;
  children: DOMElement[];
  depth: number;
  selector: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DOMSnapshot {
  url: string;
  title: string;
  viewport: ViewportSize;
  rootElement: DOMElement;
  elementCount: number;
  interactiveElements: InteractiveElement[];
  headings: HeadingInfo[];
  images: ImageInfo[];
  links: LinkInfo[];
  forms: FormInfo[];
}

export interface InteractiveElement {
  tag: string;
  role: string;
  text: string;
  selector: string;
  boundingBox: BoundingBox;
  isVisible: boolean;
  isDisabled: boolean;
  tabIndex: number;
}

export interface HeadingInfo {
  level: number;
  text: string;
  selector: string;
  fontSize: string;
  fontWeight: string;
  color: string;
}

export interface ImageInfo {
  src: string;
  alt: string;
  width: number;
  height: number;
  naturalWidth: number;
  naturalHeight: number;
  isDecorative: boolean;
  selector: string;
}

export interface LinkInfo {
  href: string;
  text: string;
  isExternal: boolean;
  selector: string;
}

export interface FormInfo {
  action?: string;
  method?: string;
  inputs: FormInputInfo[];
  selector: string;
}

export interface FormInputInfo {
  type: string;
  name?: string;
  label?: string;
  placeholder?: string;
  required: boolean;
  hasVisibleLabel: boolean;
  selector: string;
}

// ─── Accessibility Evidence ─────────────────────────────────────────────────

export interface AccessibilityNode {
  role: string;
  name: string;
  description?: string;
  value?: string;
  level?: number;
  children: AccessibilityNode[];
}

export interface AccessibilityViolation {
  id: string;
  impact: 'critical' | 'serious' | 'moderate' | 'minor';
  description: string;
  helpUrl: string;
  nodes: Array<{
    html: string;
    target: string[];
    failureSummary: string;
  }>;
}

export interface AccessibilityReport {
  tree: AccessibilityNode;
  violations: AccessibilityViolation[];
  passes: number;
  incomplete: number;
}

// ─── Typography Evidence ────────────────────────────────────────────────────

export interface TypographyInventory {
  headings: HeadingInfo[];
  bodyFontSize: string;
  bodyLineHeight: string;
  fontFamilies: string[];
  fontSizeScale: string[];
  fontWeightScale: string[];
  maxLineLength: number;   // characters
  maxLineWidth: number;    // pixels
}

// ─── Color Evidence ─────────────────────────────────────────────────────────

export interface ColorInventory {
  backgroundColors: VisualToken[];
  textColors: VisualToken[];
  borderColors: VisualToken[];
  accentColors: VisualToken[];
  gradients: VisualToken[];
  contrastPairs: ContrastPair[];
}

export interface ContrastPair {
  foreground: string;
  background: string;
  ratio: number;
  passes_AA: boolean;
  passes_AAA: boolean;
  selector: string;
  fontSize: string;
}

// ─── Layout Evidence ────────────────────────────────────────────────────────

export interface LayoutInventory {
  containers: ContainerInfo[];
  gridUsage: boolean;
  flexUsage: boolean;
  centeredElements: number;
  totalElements: number;
  maxNestingDepth: number;
  alignmentSystems: string[];
  spacingDistribution: Record<string, number>;
}

export interface ContainerInfo {
  selector: string;
  display: string;
  width: string;
  padding: string;
  margin: string;
  borderRadius: string;
  hasNestedContainer: boolean;
  childCount: number;
  depth: number;
}

// ─── Component Evidence ─────────────────────────────────────────────────────

export interface ComponentInventory {
  cards: number;
  badges: number;
  buttons: number;
  modals: number;
  icons: number;
  charts: number;
  banners: number;
  pills: number;
  images: number;
  forms: number;
  tables: number;
  navElements: number;
  heroSections: number;
}

// ─── Viewport & Responsive Evidence ─────────────────────────────────────────

export interface ViewportSize {
  width: number;
  height: number;
  label: string;
}

export const STANDARD_VIEWPORTS: ViewportSize[] = [
  { width: 375, height: 812, label: 'iPhone SE / Small Mobile' },
  { width: 390, height: 844, label: 'iPhone 14 / Standard Mobile' },
  { width: 768, height: 1024, label: 'iPad / Tablet' },
  { width: 1024, height: 768, label: 'Small Desktop / Landscape Tablet' },
  { width: 1440, height: 900, label: 'Desktop / Standard Monitor' },
];

export interface ResponsiveCapture {
  viewport: ViewportSize;
  screenshotPath?: string;
  dom: DOMSnapshot;
  overflowElements: OverflowElement[];
  clippedElements: string[];
  touchTargets: TouchTargetInfo[];
}

export interface OverflowElement {
  selector: string;
  direction: 'horizontal' | 'vertical';
  overflowAmount: number;
}

export interface TouchTargetInfo {
  selector: string;
  width: number;
  height: number;
  isTooSmall: boolean;
  minimumSize: number;
}

// ─── Interaction Evidence ───────────────────────────────────────────────────

export interface InteractionState {
  name: string;
  description: string;
  screenshot?: string;
  consoleErrors: string[];
  networkFailures: string[];
  focusedElement?: string;
  visibleDialogs: string[];
}

export interface InteractionResult {
  action: string;
  target: string;
  beforeState: InteractionState;
  afterState: InteractionState;
  durationMs: number;
  success: boolean;
  issue?: string;
}

// ─── Screenshot Evidence ────────────────────────────────────────────────────

export interface ScreenshotEvidence {
  path: string;
  viewport: ViewportSize;
  timestamp: string;
  url: string;
  label?: string;
}

// ─── Browser Evidence Collection ────────────────────────────────────────────

/**
 * The complete evidence package collected from a single page render.
 *
 * This is the fundamental input to the UI detector engine.
 * Code detectors analyze source files.
 * UI detectors analyze BrowserEvidence.
 */
export interface BrowserEvidence {
  url: string;
  timestamp: string;
  viewport: ViewportSize;
  screenshot?: ScreenshotEvidence;
  dom: DOMSnapshot;
  accessibility: AccessibilityReport;
  typography: TypographyInventory;
  colors: ColorInventory;
  layout: LayoutInventory;
  components: ComponentInventory;
  tokens: DesignTokenInventory;
  responsiveCaptures?: ResponsiveCapture[];
  interactions?: InteractionResult[];
  consoleErrors: string[];
  networkFailures: string[];
  surface: Surface;
}

// ─── UI Finding ─────────────────────────────────────────────────────────────

/**
 * A UI finding follows the same evidence-grounded contract as engineering findings,
 * but references rendered evidence (screenshot, DOM selector, viewport, computed style)
 * rather than source file lines.
 */
export interface UIRawFinding {
  ruleId: string;
  category: UICategory;
  title: string;
  message: string;

  // UI findings reference rendered evidence, not source lines
  selector?: string;
  viewport?: ViewportSize;
  screenshotPath?: string;
  computedValue?: string;

  // Some UI rules trace back to source (e.g., CSS files)
  filePath?: string;
  line?: number;

  evidence: string;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  disposition?: 'BLOCK' | 'FIX' | 'REVIEW' | 'IGNORE';
  ruleClass?: 'CERTAIN' | 'PROBABLE' | 'HEURISTIC';
  suggestedFix?: string;
}

// ─── UI Detector ────────────────────────────────────────────────────────────

/**
 * UI Detectors analyze BrowserEvidence (the rendered page) rather than
 * raw source files. They emit UIRawFindings which are normalized into
 * the shared EIFinding pipeline.
 */
export interface UIDetector {
  id: string;
  name: string;
  category: UICategory;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  ruleClass: 'CERTAIN' | 'PROBABLE' | 'HEURISTIC';
  description: string;
  run(evidence: BrowserEvidence): Promise<UIRawFinding[]>;
}

export interface UIDetectionResult {
  findings: UIRawFinding[];
  evidence: BrowserEvidence;
  surface: Surface;
  summary: {
    total: number;
    blockers: number;
    fixCount: number;
    advisoryCount: number;
    byCategory: Record<UICategory, number>;
  };
}

// ─── UI Critique & Reasoning ────────────────────────────────────────────────

/**
 * The two-pass critique model:
 * Pass A: Mechanical evidence (deterministic)
 * Pass B: Visual/UX reasoning (semantic)
 */
export interface UICritique {
  passA: {
    findings: UIRawFinding[];
    tokenAnalysis: DesignTokenInventory;
    accessibilityReport: AccessibilityReport;
    responsiveIssues: UIRawFinding[];
  };
  passB: {
    hierarchyAssessment: string;
    compositionAssessment: string;
    clarityAssessment: string;
    identityAssessment: string;
    cognitiveLoadAssessment: string;
    slopSignals: string[];
    removalRecommendations: string[];
    strengtheningRecommendations: string[];
  };
  combinedDisposition: 'BLOCK' | 'FIX' | 'REVIEW' | 'SHIP';
}

// ─── Design Context ─────────────────────────────────────────────────────────

export interface DesignContext {
  visualIdentity?: string;
  typography?: {
    primary: string;
    secondary?: string;
    mono?: string;
    scale: string[];
  };
  colorSystem?: {
    primary: string;
    secondary?: string;
    accent?: string;
    neutral: string;
    semantic: Record<string, string>;
  };
  spacingSystem?: string[];
  radiusSystem?: string[];
  componentVocabulary?: string[];
  motionPrinciples?: string[];
  accessibilityRequirements?: string[];
  brandAssets?: string[];
  antiPatterns?: string[];
  approvedPatterns?: string[];
}

// ─── UI Command Configuration ───────────────────────────────────────────────

export type UICommand =
  | 'audit'
  | 'critique'
  | 'distill'
  | 'layout'
  | 'typeset'
  | 'adapt'
  | 'harden'
  | 'clarify'
  | 'polish'
  | 'document'
  | 'extract'
  | 'onboard';

export interface UICommandConfig {
  url: string;
  surface?: Surface;
  viewports?: ViewportSize[];
  designContextPath?: string;
  outputDir?: string;
  commands?: UICommand[];
  screenshotDir?: string;
}
