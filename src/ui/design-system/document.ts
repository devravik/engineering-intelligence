/**
 * Design Context — DESIGN.md Generation & Parsing
 *
 * UI quality cannot be judged against universal taste alone.
 * A brutalist developer tool and a luxury ecommerce site
 * should not receive the same critique.
 *
 * DESIGN.md contains the project's visual identity, typography system,
 * color system, spacing system, component vocabulary, and anti-patterns.
 *
 * Analogous to PROJECT.md / ARCHITECTURE.md for engineering context.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { DesignContext, DesignTokenInventory, BrowserEvidence } from '../types.js';

const DESIGN_MD_FILENAME = 'DESIGN.md';

// ─── Load Existing Design Context ───────────────────────────────────────────

export function loadDesignContext(repoRoot: string): DesignContext | null {
  const paths = [
    join(repoRoot, '.ei', DESIGN_MD_FILENAME),
    join(repoRoot, DESIGN_MD_FILENAME)
  ];

  for (const path of paths) {
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      return parseDesignMd(content);
    }
  }

  return null;
}

// ─── Parse DESIGN.md ────────────────────────────────────────────────────────

function parseDesignMd(content: string): DesignContext {
  const ctx: DesignContext = {};

  // Extract sections by headings
  const sections = splitBySections(content);

  // Visual Identity
  const identitySection = sections.get('visual identity') || sections.get('overview');
  if (identitySection) {
    ctx.visualIdentity = identitySection.trim();
  }

  // Typography
  const typoSection = sections.get('typography');
  if (typoSection) {
    const primaryMatch = typoSection.match(/primary[:\s]+([^\n]+)/i);
    const secondaryMatch = typoSection.match(/secondary[:\s]+([^\n]+)/i);
    const monoMatch = typoSection.match(/mono(?:space)?[:\s]+([^\n]+)/i);
    const scaleMatch = typoSection.match(/scale[:\s]+([\s\S]*?)(?=\n##|\n$)/i);

    ctx.typography = {
      primary: primaryMatch?.[1]?.trim() || '',
      secondary: secondaryMatch?.[1]?.trim(),
      mono: monoMatch?.[1]?.trim(),
      scale: scaleMatch?.[1]?.split('\n')
        .map(l => l.replace(/^[-*]\s*/, '').trim())
        .filter(Boolean) || []
    };
  }

  // Color System
  const colorSection = sections.get('colors') || sections.get('color system');
  if (colorSection) {
    const primaryMatch = colorSection.match(/primary[:\s]+([^\n]+)/i);
    const secondaryMatch = colorSection.match(/secondary[:\s]+([^\n]+)/i);
    const accentMatch = colorSection.match(/accent[:\s]+([^\n]+)/i);
    const neutralMatch = colorSection.match(/neutral[:\s]+([^\n]+)/i);

    ctx.colorSystem = {
      primary: primaryMatch?.[1]?.trim() || '',
      secondary: secondaryMatch?.[1]?.trim(),
      accent: accentMatch?.[1]?.trim(),
      neutral: neutralMatch?.[1]?.trim() || '',
      semantic: {}
    };
  }

  // Spacing System
  const spacingSection = sections.get('spacing') || sections.get('layout');
  if (spacingSection) {
    ctx.spacingSystem = extractListItems(spacingSection);
  }

  // Radius System
  const radiusSection = sections.get('shapes') || sections.get('radius') || sections.get('radii');
  if (radiusSection) {
    ctx.radiusSystem = extractListItems(radiusSection);
  }

  // Component Vocabulary
  const componentSection = sections.get('components') || sections.get('component vocabulary');
  if (componentSection) {
    ctx.componentVocabulary = extractListItems(componentSection);
  }

  // Motion Principles
  const motionSection = sections.get('motion') || sections.get('animation');
  if (motionSection) {
    ctx.motionPrinciples = extractListItems(motionSection);
  }

  // Anti-patterns
  const antiSection = sections.get("don'ts") || sections.get('anti-patterns') || sections.get('avoid');
  if (antiSection) {
    ctx.antiPatterns = extractListItems(antiSection);
  }

  // Approved patterns
  const doSection = sections.get("do's") || sections.get('approved patterns') || sections.get('patterns');
  if (doSection) {
    ctx.approvedPatterns = extractListItems(doSection);
  }

  return ctx;
}

function splitBySections(content: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = content.split('\n');
  let currentSection = '';
  let currentContent: string[] = [];

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(.+)/);
    if (headingMatch) {
      if (currentSection) {
        sections.set(currentSection.toLowerCase(), currentContent.join('\n'));
      }
      currentSection = headingMatch[1].trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentSection) {
    sections.set(currentSection.toLowerCase(), currentContent.join('\n'));
  }

  return sections;
}

function extractListItems(content: string): string[] {
  return content
    .split('\n')
    .filter(l => l.match(/^[-*]\s/) || l.match(/^\d+\.\s/))
    .map(l => l.replace(/^[-*\d.]\s*/, '').trim())
    .filter(Boolean);
}

// ─── Generate DESIGN.md from Evidence ───────────────────────────────────────

/**
 * Generates DESIGN.md by extracting the existing visual system
 * from browser evidence.
 *
 * This is the `/ei ui-document` workflow:
 * Derive what is, not prescribe what should be.
 */
export function generateDesignMd(evidence: BrowserEvidence): string {
  const { tokens, colors, typography, components, surface } = evidence;

  const sections: string[] = [];

  // Title
  sections.push('# Design System');
  sections.push('');
  sections.push(`> Auto-generated by Engineering Intelligence from ${surface || 'unknown'} surface analysis.`);
  sections.push(`> Review and curate this document to establish project design truth.`);
  sections.push('');

  // Overview
  sections.push('## Overview');
  sections.push('');
  sections.push(`Surface type: **${surface}**`);
  sections.push(`Total unique colors: ${tokens.colors.length}`);
  sections.push(`Font families: ${tokens.fontFamilies.length}`);
  sections.push(`Font size variants: ${tokens.fontSizes.length}`);
  sections.push(`Spacing values: ${tokens.spacingValues.length}`);
  sections.push(`Border radius variants: ${tokens.borderRadii.length}`);
  sections.push(`Shadow definitions: ${tokens.shadows.length}`);
  sections.push('');

  // Colors
  sections.push('## Colors');
  sections.push('');
  if (colors.backgroundColors.length > 0) {
    sections.push('### Background Colors');
    for (const c of colors.backgroundColors.slice(0, 10)) {
      sections.push(`- \`${c.value}\` (used ${c.count}x)`);
    }
    sections.push('');
  }
  if (colors.textColors.length > 0) {
    sections.push('### Text Colors');
    for (const c of colors.textColors.slice(0, 10)) {
      sections.push(`- \`${c.value}\` (used ${c.count}x)`);
    }
    sections.push('');
  }
  if (colors.accentColors.length > 0) {
    sections.push('### Accent Colors');
    for (const c of colors.accentColors.slice(0, 5)) {
      sections.push(`- \`${c.value}\` (used ${c.count}x)`);
    }
    sections.push('');
  }
  if (colors.gradients.length > 0) {
    sections.push('### Gradients');
    for (const g of colors.gradients.slice(0, 5)) {
      sections.push(`- \`${g.value}\``);
    }
    sections.push('');
  }

  // Typography
  sections.push('## Typography');
  sections.push('');
  if (tokens.fontFamilies.length > 0) {
    sections.push('### Font Families');
    for (const f of tokens.fontFamilies) {
      sections.push(`- \`${f.value}\` (used ${f.count}x)`);
    }
    sections.push('');
  }
  sections.push('### Font Sizes');
  for (const s of tokens.fontSizes.sort((a, b) => parseFloat(b.value) - parseFloat(a.value))) {
    sections.push(`- \`${s.value}\` (used ${s.count}x)`);
  }
  sections.push('');
  sections.push('### Font Weights');
  for (const w of tokens.fontWeights) {
    sections.push(`- \`${w.value}\` (used ${w.count}x)`);
  }
  sections.push('');

  // Layout / Spacing
  sections.push('## Layout');
  sections.push('');
  sections.push('### Spacing Scale');
  const sortedSpacing = [...tokens.spacingValues].sort((a, b) => {
    const numA = parseFloat(a.value);
    const numB = parseFloat(b.value);
    return numA - numB;
  });
  for (const s of sortedSpacing.slice(0, 15)) {
    sections.push(`- \`${s.value}\` (used ${s.count}x)`);
  }
  if (sortedSpacing.length > 15) {
    sections.push(`- ... and ${sortedSpacing.length - 15} more values`);
  }
  sections.push('');

  // Shapes / Radii
  sections.push('## Shapes');
  sections.push('');
  sections.push('### Border Radii');
  for (const r of tokens.borderRadii) {
    sections.push(`- \`${r.value}\` (used ${r.count}x)`);
  }
  sections.push('');

  // Elevation & Depth
  if (tokens.shadows.length > 0) {
    sections.push('## Elevation & Depth');
    sections.push('');
    sections.push('### Shadows');
    for (const s of tokens.shadows) {
      sections.push(`- \`${s.value}\` (used ${s.count}x)`);
    }
    sections.push('');
  }

  // Components
  sections.push('## Components');
  sections.push('');
  sections.push(`- Cards: ${components.cards}`);
  sections.push(`- Buttons: ${components.buttons}`);
  sections.push(`- Badges/Pills: ${components.badges + components.pills}`);
  sections.push(`- Icons: ${components.icons}`);
  sections.push(`- Charts: ${components.charts}`);
  sections.push(`- Forms: ${components.forms}`);
  sections.push(`- Tables: ${components.tables}`);
  sections.push(`- Modals/Dialogs: ${components.modals}`);
  sections.push(`- Navigation: ${components.navElements}`);
  sections.push(`- Hero Sections: ${components.heroSections}`);
  sections.push('');

  // Do's and Don'ts
  sections.push("## Do's and Don'ts");
  sections.push('');
  sections.push('### Do');
  sections.push('- [Review and populate with project-specific approved patterns]');
  sections.push('');
  sections.push("### Don't");
  sections.push('- [Review and populate with project-specific anti-patterns]');
  sections.push('');

  return sections.join('\n');
}

/**
 * Writes DESIGN.md to the .ei/ directory.
 */
export function writeDesignMd(repoRoot: string, content: string): string {
  const eiDir = join(repoRoot, '.ei');
  if (!existsSync(eiDir)) mkdirSync(eiDir, { recursive: true });

  const path = join(eiDir, DESIGN_MD_FILENAME);
  writeFileSync(path, content, 'utf-8');
  return path;
}
