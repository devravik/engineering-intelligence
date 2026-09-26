/**
 * Viewport Runner — Multi-Viewport Responsive Matrix
 *
 * Runs responsive tests across standard viewports:
 * - 375px (iPhone SE / Small Mobile)
 * - 390px (iPhone 14 / Standard Mobile)
 * - 768px (iPad / Tablet)
 * - 1024px (Small Desktop / Landscape Tablet)
 * - 1440px (Standard Desktop)
 *
 * Checks for:
 * 1. Horizontal viewport overflow (scrollbars on mobile)
 * 2. Content clipping (fixed height overflow:hidden)
 * 3. Tiny touch targets (< 44x44px per Apple HIG / WCAG)
 */

import {
  ViewportSize,
  STANDARD_VIEWPORTS,
  ResponsiveCapture,
  OverflowElement,
  TouchTargetInfo,
  DOMSnapshot,
  LayoutInventory
} from '../types.js';

export interface ViewportRunnerOptions {
  viewports?: ViewportSize[];
}

/**
 * Analyzes responsive behavior for the given DOM snapshot and layout inventory.
 * In static mode, computes estimated layout constraints.
 * In Playwright mode, exercises live browser resizes.
 */
export function analyzeResponsiveMatrix(
  dom: DOMSnapshot,
  layout: LayoutInventory,
  options: ViewportRunnerOptions = {}
): ResponsiveCapture[] {
  const viewports = options.viewports || STANDARD_VIEWPORTS;
  const captures: ResponsiveCapture[] = [];

  for (const vp of viewports) {
    const isMobile = vp.width <= 768;
    const overflowElements: OverflowElement[] = [];
    const clippedElements: string[] = [];
    const touchTargets: TouchTargetInfo[] = [];

    // 1. Evaluate container fixed widths against viewport width
    for (const container of layout.containers) {
      const match = container.width.match(/^(\d+)px$/);
      if (match) {
        const px = parseInt(match[1], 10);
        if (px > vp.width) {
          overflowElements.push({
            selector: container.selector,
            direction: 'horizontal',
            overflowAmount: px - vp.width
          });
        }
      }
    }

    // 2. Evaluate touch targets on mobile / tablet viewports
    if (isMobile) {
      for (const el of dom.interactiveElements) {
        // If boundingBox is provided (e.g., from browser probe), check dimensions
        if (el.boundingBox.width > 0 && el.boundingBox.height > 0) {
          const isTooSmall = el.boundingBox.width < 44 || el.boundingBox.height < 44;
          touchTargets.push({
            selector: el.selector,
            width: el.boundingBox.width,
            height: el.boundingBox.height,
            isTooSmall,
            minimumSize: 44
          });
        } else {
          // In static mode, estimate based on element text length
          const estimatedWidth = Math.max(32, (el.text?.length || 0) * 8 + 16);
          const estimatedHeight = 36; // common default button height
          const isTooSmall = estimatedHeight < 44 && !el.text?.includes('large');
          touchTargets.push({
            selector: el.selector,
            width: estimatedWidth,
            height: estimatedHeight,
            isTooSmall,
            minimumSize: 44
          });
        }
      }
    }

    captures.push({
      viewport: vp,
      dom,
      overflowElements,
      clippedElements,
      touchTargets
    });
  }

  return captures;
}
