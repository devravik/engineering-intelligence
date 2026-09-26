/**
 * Screenshot Capture — Multi-Viewport Screenshot Management
 *
 * Coordinates screenshot evidence capture for rendered verification:
 * - Maps viewports to consistent file naming (.ei/screenshots/)
 * - Organizes BEFORE / AFTER comparison passes
 * - Tracks metadata for vision-capable LLM analysis
 */

import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { ViewportSize, ScreenshotEvidence, STANDARD_VIEWPORTS } from '../types.js';

export interface ScreenshotOptions {
  outputDir?: string;
  prefix?: string;
  fullPage?: boolean;
}

/**
 * Returns canonical file path for a viewport screenshot.
 */
export function getScreenshotPath(
  repoRoot: string,
  viewport: ViewportSize,
  options: ScreenshotOptions = {}
): string {
  const dir = options.outputDir || join(repoRoot, '.ei', 'screenshots');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  const prefix = options.prefix ? `${options.prefix}-` : '';
  const filename = `${prefix}${viewport.width}x${viewport.height}.png`;
  return join(dir, filename);
}

/**
 * Creates ScreenshotEvidence record for captured viewports.
 */
export function createScreenshotEvidence(
  filePath: string,
  viewport: ViewportSize,
  url: string,
  label?: string
): ScreenshotEvidence {
  return {
    path: filePath,
    viewport,
    timestamp: new Date().toISOString(),
    url,
    label
  };
}
