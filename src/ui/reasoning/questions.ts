/**
 * Visual Reasoning Questions & Prompt Generator
 *
 * Implements the 15 structured visual reasoning questions from EI UI Intelligence.
 * Rather than asking vague subjective questions like "Does this design look good?",
 * these 15 questions target precise interface hierarchy, task clarity, decorative excess,
 * and AI-slop characteristics.
 */

import { BrowserEvidence, Surface } from '../types.js';

export interface VisualQuestion {
  id: number;
  question: string;
  focusArea: 'task' | 'hierarchy' | 'slop' | 'layout' | 'typography' | 'density';
  evaluator(evidence: BrowserEvidence): {
    answer: string;
    score: 'GOOD' | 'NEEDS_ATTENTION' | 'PROBLEM';
    recommendation?: string;
  };
}

export const VISUAL_REASONING_QUESTIONS: VisualQuestion[] = [
  {
    id: 1,
    question: 'What is the primary user task?',
    focusArea: 'task',
    evaluator: (evidence) => {
      const primaryBtn = evidence.dom.interactiveElements.find(e => e.tag === 'button' || e.role === 'button');
      if (primaryBtn) {
        return {
          answer: `Identified primary action "${primaryBtn.text || primaryBtn.selector}".`,
          score: 'GOOD'
        };
      }
      return {
        answer: 'No obvious primary CTA button or main interactive trigger identified.',
        score: 'PROBLEM',
        recommendation: 'Establish an unambiguous primary CTA button.'
      };
    }
  },
  {
    id: 2,
    question: 'Is it visually obvious?',
    focusArea: 'task',
    evaluator: (evidence) => {
      const buttons = evidence.dom.interactiveElements.filter(e => e.tag === 'button');
      if (buttons.length > 5) {
        return {
          answer: `Low visual prominence: ${buttons.length} buttons compete for visual attention.`,
          score: 'NEEDS_ATTENTION',
          recommendation: 'Reduce secondary buttons or distinguish primary with prominent styling.'
        };
      }
      return {
        answer: 'Primary task is not buried under excessive competing buttons.',
        score: 'GOOD'
      };
    }
  },
  {
    id: 3,
    question: 'What receives the most visual attention?',
    focusArea: 'hierarchy',
    evaluator: (evidence) => {
      if (evidence.components.heroSections > 0) {
        return { answer: 'Hero section occupies focal plane.', score: 'GOOD' };
      }
      if (evidence.components.cards > 6) {
        return {
          answer: `Attention is fragmented across ${evidence.components.cards} card containers.`,
          score: 'PROBLEM',
          recommendation: 'Flatten non-essential cards to allow hero or core task to lead.'
        };
      }
      return { answer: 'Main content area leads the visual composition.', score: 'GOOD' };
    }
  },
  {
    id: 4,
    question: 'Is that attention justified?',
    focusArea: 'hierarchy',
    evaluator: (evidence) => {
      if (evidence.components.banners > 2) {
        return {
          answer: 'Multiple notification banners divert attention from core workflow.',
          score: 'PROBLEM',
          recommendation: 'Consolidate multiple banners into a single dismissible notification.'
        };
      }
      return { answer: 'Focal weight corresponds to functional intent.', score: 'GOOD' };
    }
  },
  {
    id: 5,
    question: 'Which elements compete with the primary task?',
    focusArea: 'hierarchy',
    evaluator: (evidence) => {
      const pills = evidence.components.pills + evidence.components.badges;
      if (pills > 8) {
        return {
          answer: `${pills} badges and pills generate high visual vibration.`,
          score: 'NEEDS_ATTENTION',
          recommendation: 'Remove decorative badges; reserve pills exclusively for critical status.'
        };
      }
      return { answer: 'Low competition from decorative micro-elements.', score: 'GOOD' };
    }
  },
  {
    id: 6,
    question: 'Which elements appear decorative rather than functional?',
    focusArea: 'slop',
    evaluator: (evidence) => {
      const gradients = evidence.colors.gradients.length;
      if (gradients > 2) {
        return {
          answer: `${gradients} gradient backgrounds observed without explicit semantic role.`,
          score: 'NEEDS_ATTENTION',
          recommendation: 'Replace non-functional background gradients with solid, tinted neutrals.'
        };
      }
      return { answer: 'Minimal gratuitous decoration.', score: 'GOOD' };
    }
  },
  {
    id: 7,
    question: 'Does the page resemble a generic AI/SaaS template?',
    focusArea: 'slop',
    evaluator: (evidence) => {
      let slopSignals = 0;
      if (evidence.components.cards >= 5) slopSignals++;
      if (evidence.layout.centeredElements / Math.max(1, evidence.layout.totalElements) > 0.45) slopSignals++;
      if (evidence.colors.gradients.length > 0) slopSignals++;
      if (evidence.tokens.fontFamilies.some(f => f.value.toLowerCase().includes('inter'))) slopSignals++;

      if (slopSignals >= 3) {
        return {
          answer: `High similarity to formulaic AI SaaS template (${slopSignals}/4 stereotypical markers: cards, centering, gradients, default font).`,
          score: 'PROBLEM',
          recommendation: 'Break formulaic grid: use asymmetry, purposeful typography, and reduce containerization.'
        };
      }
      return { answer: 'Interface avoids formulaic AI layout cliches.', score: 'GOOD' };
    }
  },
  {
    id: 8,
    question: 'Is there a coherent visual identity?',
    focusArea: 'hierarchy',
    evaluator: (evidence) => {
      if (evidence.tokens.colors.length > 15) {
        return {
          answer: `Fragmented identity: ${evidence.tokens.colors.length} divergent color values found.`,
          score: 'NEEDS_ATTENTION',
          recommendation: 'Consolidate color palette to 1 primary, 1 accent, and a coherent neutral ramp.'
        };
      }
      return { answer: 'Restrained, consistent color palette observed.', score: 'GOOD' };
    }
  },
  {
    id: 9,
    question: 'Does spacing establish hierarchy?',
    focusArea: 'layout',
    evaluator: (evidence) => {
      if (evidence.tokens.spacingValues.length > 12) {
        return {
          answer: `Spacing scale is noisy (${evidence.tokens.spacingValues.length} distinct values).`,
          score: 'NEEDS_ATTENTION',
          recommendation: 'Snap spacing to a disciplined 4px / 8px harmonic grid.'
        };
      }
      return { answer: 'Spacing adheres to a consistent rhythm.', score: 'GOOD' };
    }
  },
  {
    id: 10,
    question: 'Does typography communicate hierarchy?',
    focusArea: 'typography',
    evaluator: (evidence) => {
      const h = evidence.dom.headings;
      if (h.length === 0) {
        return {
          answer: 'No heading elements found; hierarchy is flat.',
          score: 'PROBLEM',
          recommendation: 'Structure content with semantic <h1> through <h3> headings.'
        };
      }
      return {
        answer: `${h.length} headings form structural hierarchy.`,
        score: 'GOOD'
      };
    }
  },
  {
    id: 11,
    question: 'Does the layout adapt appropriately on smaller screens?',
    focusArea: 'layout',
    evaluator: (evidence) => {
      const caps = evidence.responsiveCaptures || [];
      const mobileCap = caps.find(c => c.viewport.width <= 390);
      if (mobileCap && mobileCap.overflowElements.length > 0) {
        return {
          answer: `Horizontal overflow detected on mobile viewport (${mobileCap.overflowElements.length} leaking elements).`,
          score: 'PROBLEM',
          recommendation: 'Wrap elements, remove fixed px widths, or set max-width: 100%.'
        };
      }
      return { answer: 'Mobile layout adapts without horizontal viewport breaking.', score: 'GOOD' };
    }
  },
  {
    id: 12,
    question: 'Are there unnecessary components?',
    focusArea: 'density',
    evaluator: (evidence) => {
      if (evidence.components.cards > 8) {
        return {
          answer: `High card redundancy: ${evidence.components.cards} individual cards.`,
          score: 'PROBLEM',
          recommendation: 'Merge related items into simple definition lists or tables.'
        };
      }
      return { answer: 'Component count is proportional to content volume.', score: 'GOOD' };
    }
  },
  {
    id: 13,
    question: 'Is the interface visually repetitive?',
    focusArea: 'slop',
    evaluator: (evidence) => {
      if (evidence.components.cards >= 4 && evidence.components.badges >= 4) {
        return {
          answer: 'Card + badge wallpaper effect detected across dashboard sections.',
          score: 'NEEDS_ATTENTION',
          recommendation: 'Vary presentation: use metrics, tables, and typographic emphasis.'
        };
      }
      return { answer: 'Healthy visual variety across content blocks.', score: 'GOOD' };
    }
  },
  {
    id: 14,
    question: 'Which element should be removed?',
    focusArea: 'density',
    evaluator: (evidence) => {
      if (evidence.components.cards > 6) {
        return {
          answer: 'Candidate for removal: secondary card borders and enclosing wrappers.',
          score: 'NEEDS_ATTENTION',
          recommendation: 'Unwrap card wrappers around single lines of text.'
        };
      }
      if (evidence.colors.gradients.length > 2) {
        return {
          answer: 'Candidate for removal: decorative gradient meshes.',
          score: 'NEEDS_ATTENTION',
          recommendation: 'Strip decorative gradient backgrounds.'
        };
      }
      return { answer: 'No obvious low-value elements requiring deletion.', score: 'GOOD' };
    }
  },
  {
    id: 15,
    question: 'Which element should become stronger?',
    focusArea: 'hierarchy',
    evaluator: (evidence) => {
      const h1 = evidence.dom.headings.find(h => h.level === 1);
      if (!h1) {
        return {
          answer: 'Page lacks a clear <h1> title element to anchor reader orientation.',
          score: 'PROBLEM',
          recommendation: 'Promote page section lead to clear, strong <h1> heading.'
        };
      }
      return { answer: 'Core header anchors page intent well.', score: 'GOOD' };
    }
  }
];

export interface VisualReasoningEvaluation {
  questionId: number;
  question: string;
  focusArea: string;
  answer: string;
  score: 'GOOD' | 'NEEDS_ATTENTION' | 'PROBLEM';
  recommendation?: string;
}

/**
 * Runs the 15-question visual reasoning evaluation against browser evidence.
 */
export function evaluateVisualReasoning(evidence: BrowserEvidence): VisualReasoningEvaluation[] {
  return VISUAL_REASONING_QUESTIONS.map(q => {
    const res = q.evaluator(evidence);
    return {
      questionId: q.id,
      question: q.question,
      focusArea: q.focusArea,
      answer: res.answer,
      score: res.score,
      recommendation: res.recommendation
    };
  });
}

/**
 * Generates an LLM prompt structured around the 15 questions for vision-capable models.
 */
export function generateVisionReasoningPrompt(evidence: BrowserEvidence, surface?: Surface): string {
  const s = surface || evidence.surface || 'unknown';
  const qList = VISUAL_REASONING_QUESTIONS.map(q => `${q.id}. ${q.question}`).join('\n');

  return `You are a Senior Design & Engineering Reviewer evaluating a rendered interface on surface type: [${s}].
Inspect the rendered screenshot and DOM evidence.

Do NOT give a generic "does this design look good?" critique.
Answer each of the following 15 precise questions with evidence, assessment, and actionable recommendation:

${qList}

CRITICAL RULES:
- Identify what should be REMOVED before proposing anything to add.
- Distinguish functional requirements from gratuitous AI-slop decoration.
- Ground answers in physical DOM selectors and visual hierarchy.`;
}
