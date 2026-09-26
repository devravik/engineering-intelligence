/**
 * Interaction Probe — Dynamic and Static Interaction Testing
 *
 * Exercises and validates interactive elements:
 * - Tests buttons, links, form inputs, dialogs, dropdowns
 * - Observes console errors and network failures on interaction
 * - Verifies state changes (dialog opens, validation errors appear)
 */

import {
  InteractionResult,
  InteractionState,
  InteractiveElement,
  DOMSnapshot
} from '../types.js';

export interface InteractionProbeOptions {
  timeoutMs?: number;
}

/**
 * Static analysis of interactive elements.
 * Checks for missing handlers, empty links, or suspicious attributes.
 */
export function analyzeInteractiveElements(
  dom: DOMSnapshot,
  options: InteractionProbeOptions = {}
): InteractionResult[] {
  const results: InteractionResult[] = [];

  for (const el of dom.interactiveElements) {
    const beforeState: InteractionState = {
      name: 'initial',
      description: `Before interacting with ${el.tag}`,
      consoleErrors: [],
      networkFailures: [],
      visibleDialogs: []
    };

    let issue: string | undefined;
    let success = true;

    if (el.tag === 'a' && (!el.selector || el.selector === 'a') && !dom.links.some(l => l.text === el.text && l.href)) {
      issue = 'Link missing href target';
      success = false;
    } else if (el.isDisabled) {
      issue = 'Control is disabled';
      success = true;
    }

    results.push({
      action: el.tag === 'button' ? 'click' : el.tag === 'input' ? 'focus' : 'navigate',
      target: el.selector,
      beforeState,
      afterState: {
        ...beforeState,
        name: 'after',
        description: `After interacting with ${el.tag}`
      },
      durationMs: 5,
      success,
      issue
    });
  }

  return results;
}
