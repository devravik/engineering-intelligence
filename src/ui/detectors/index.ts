/**
 * UI Detector Engine
 *
 * Runs the UI Intelligence detector catalog against browser evidence.
 * Parallel to src/detectors/index.ts but for rendered UI analysis.
 *
 *                      ENGINEERING INTELLIGENCE
 *                               │
 *              ┌────────────────┴────────────────┐
 *              │                                 │
 *       Engineering Intelligence          UI Intelligence
 *              │                                 │
 *       Code / architecture               Source + Browser
 *       DB / API / security                     │
 *       tests / performance              ┌──────┴──────┐
 *              │                         │             │
 *       deterministic                 DOM/CSS      Screenshot
 *       detectors                     analysis      analysis
 *              │                         │             │
 *              └──────────────┬──────────┴─────────────┘
 *                             │
 *                      Finding Normalizer
 *                             │
 *                      Project Context
 *                             │
 *                      Semantic Reasoning
 *                             │
 *                          Decision
 *                             │
 *                          Verify
 */

import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  UIDetector,
  UIRawFinding,
  UIDetectionResult,
  UICategory,
  BrowserEvidence,
  Surface
} from '../types.js';

import { collectStaticUIEvidence } from '../browser/index.js';
import { loadDesignContext } from '../design-system/document.js';

// Import detector catalogs
import { typographyDetectors } from './rules/typography.js';
import { colorDetectors } from './rules/color.js';
import { spatialDetectors } from './rules/spatial.js';
import { compositionDetectors } from './rules/composition.js';
import { aiSlopDetectors } from './rules/ai-slop.js';
import { designSystemDetectors } from './rules/design-system.js';
import { responsiveDetectors } from './rules/responsive.js';
import { accessibilityDetectors } from './rules/accessibility.js';
import { interactionDetectors } from './rules/interaction.js';

// ─── Registry ───────────────────────────────────────────────────────────────

export const allUIDetectors: UIDetector[] = [
  ...typographyDetectors,
  ...colorDetectors,
  ...spatialDetectors,
  ...compositionDetectors,
  ...aiSlopDetectors,
  ...designSystemDetectors,
  ...responsiveDetectors,
  ...accessibilityDetectors,
  ...interactionDetectors,
];

// ─── UI Detection Runner ────────────────────────────────────────────────────

export interface UIDetectOptions {
  targetSubpath?: string;
  detectors?: UIDetector[];
  evidence?: BrowserEvidence;
  surface?: Surface;
}

/**
 * Runs the UI Intelligence detector engine.
 *
 * 1. Collects browser evidence (static source analysis by default)
 * 2. Runs all UI detectors against the evidence
 * 3. Returns structured UIDetectionResult
 */
export async function runUIDetectors(
  repoRoot: string,
  options: UIDetectOptions = {}
): Promise<UIDetectionResult> {
  // Step 1: Collect evidence
  const evidence = options.evidence || collectStaticUIEvidence(repoRoot, options.targetSubpath);

  // Override surface if specified
  if (options.surface) {
    evidence.surface = options.surface;
  }

  // Step 2: Check for DESIGN.md context
  const designCtx = loadDesignContext(repoRoot);
  const hasDesignContext = designCtx !== null;

  // Add DESIGN.md check
  if (!hasDesignContext) {
    // Check if there are UI source files at all
    const hasUIFiles = evidence.dom.elementCount > 0 ||
                       evidence.tokens.colors.length > 0 ||
                       evidence.tokens.fontFamilies.length > 0;

    if (hasUIFiles) {
      // Will be handled by UI-DS-004 or added as a finding
    }
  }

  // Step 3: Run detectors
  const detectorsToRun = options.detectors || allUIDetectors;
  const rawFindings: UIRawFinding[] = [];

  for (const detector of detectorsToRun) {
    try {
      const results = await detector.run(evidence);
      for (const finding of results) {
        if (!finding.ruleClass) {
          finding.ruleClass = detector.ruleClass;
        }
      }
      rawFindings.push(...results);
    } catch (err) {
      console.error(`UI Detector ${detector.id} encountered error:`, err);
    }
  }

  // Step 4: Add DESIGN.md finding if missing
  if (!hasDesignContext && evidence.tokens.colors.length > 0) {
    rawFindings.push({
      ruleId: 'UI-DS-004',
      category: 'DesignSystem',
      title: 'No DESIGN.md design context document',
      message: 'No .ei/DESIGN.md or DESIGN.md found. UI quality cannot be judged against universal taste alone. Create a DESIGN.md to establish project design identity, typography, color system, and anti-patterns.',
      evidence: 'DESIGN.md not found in .ei/ or project root',
      confidence: 'HIGH',
      impact: 'MEDIUM',
      disposition: 'REVIEW',
      ruleClass: 'CERTAIN',
      suggestedFix: 'Run `/ei ui-document` to auto-generate DESIGN.md from existing visual system, then curate it.'
    });
  }

  // Step 5: Build summary
  const byCategory: Record<UICategory, number> = {
    Typography: 0, Color: 0, Spatial: 0, Composition: 0,
    Components: 0, Interaction: 0, Responsive: 0, Accessibility: 0,
    Motion: 0, Content: 0, DesignSystem: 0, UISlop: 0
  };

  let blockers = 0;
  let fixCount = 0;
  let advisoryCount = 0;

  for (const f of rawFindings) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;

    const disposition = f.disposition || 'REVIEW';
    if (disposition === 'BLOCK') blockers++;
    else if (disposition === 'FIX') fixCount++;
    else advisoryCount++;
  }

  return {
    findings: rawFindings,
    evidence,
    surface: evidence.surface,
    summary: {
      total: rawFindings.length,
      blockers,
      fixCount,
      advisoryCount,
      byCategory
    }
  };
}

// ─── Exports ────────────────────────────────────────────────────────────────

export { typographyDetectors } from './rules/typography.js';
export { colorDetectors } from './rules/color.js';
export { spatialDetectors } from './rules/spatial.js';
export { compositionDetectors } from './rules/composition.js';
export { aiSlopDetectors } from './rules/ai-slop.js';
export { designSystemDetectors } from './rules/design-system.js';
