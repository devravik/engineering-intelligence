/**
 * DOM Probe — Static DOM Analysis Engine
 *
 * Extracts structural information from HTML content without a browser.
 * This serves as the lightweight analysis path when Playwright is unavailable,
 * and as the primary source-code-level UI analysis engine.
 *
 * For rendered analysis (computed styles, bounding boxes), use the browser runner.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import {
  DOMSnapshot,
  HeadingInfo,
  ComponentInventory,
  InteractiveElement,
  ImageInfo,
  LinkInfo,
  FormInfo,
  FormInputInfo,
  ViewportSize
} from '../types.js';

// ─── HTML/JSX Element Counting ──────────────────────────────────────────────

/**
 * Counts occurrences of specific element patterns in HTML/JSX source.
 * Not a full parser—uses structural regex patterns appropriate for
 * the common shapes of AI-generated React/HTML code.
 */
export function countComponentPatterns(content: string): ComponentInventory {
  const lines = content.split('\n');
  const joined = content;

  return {
    cards: countPattern(joined, /<(?!\/)[^>]*(?:card|Card)[^>]*>/gi),
    badges: countPattern(joined, /<(?!\/)[^>]*(?:badge|Badge|chip|Chip|tag|Tag)[^>]*>/gi),
    buttons: countPattern(joined, /<(?!\/)(?:button|Button)[^>]*>/gi),
    modals: countPattern(joined, /<(?!\/)[^>]*(?:modal|Modal|dialog|Dialog)[^>]*>/gi),
    icons: countPattern(joined, /<(?!\/)[^>]*(?:icon|Icon|svg|SVG)[^>]*>/gi),
    charts: countPattern(joined, /<(?!\/)[^>]*(?:chart|Chart|graph|Graph|recharts|Victory|Nivo)[^>]*>/gi),
    banners: countPattern(joined, /<(?!\/)[^>]*(?:banner|Banner|alert|Alert|toast|Toast)[^>]*>/gi),
    pills: countPattern(joined, /<(?!\/)[^>]*(?:pill|Pill)[^>]*>/gi) + countPillPatterns(joined),
    images: countPattern(joined, /<(?!\/)(?:img|Image)[^>]*>/gi),
    forms: countPattern(joined, /<(?!\/)(?:form|Form)[^>]*>/gi),
    tables: countPattern(joined, /<(?!\/)(?:table|Table)[^>]*>/gi),
    navElements: countPattern(joined, /<(?!\/)(?:nav|Nav|Navbar|navbar|sidebar|Sidebar|menu|Menu)[^>]*>/gi),
    heroSections: countPattern(joined, /<(?!\/)[^>]*(?:hero|Hero)[^>]*>/gi)
  };
}

function countPattern(text: string, regex: RegExp): number {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function countPillPatterns(text: string): number {
  // Detect pill-like patterns: small rounded elements with short text
  const roundedSmall = text.match(/rounded-full[^>]*text-(?:xs|sm)/gi);
  return roundedSmall ? roundedSmall.length : 0;
}

// ─── Heading Extraction ─────────────────────────────────────────────────────

export function extractHeadings(content: string): HeadingInfo[] {
  const headings: HeadingInfo[] = [];
  const headingRegex = /<h([1-6])[^>]*>([^<]*(?:<[^/h][^>]*>[^<]*)*)<\/h\1>/gi;

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    const level = parseInt(match[1], 10);
    const rawText = match[2].replace(/<[^>]+>/g, '').trim();

    headings.push({
      level,
      text: rawText,
      selector: `h${level}`,
      fontSize: '',
      fontWeight: '',
      color: ''
    });
  }

  return headings;
}

// ─── Interactive Element Detection ──────────────────────────────────────────

export function extractInteractiveElements(content: string): InteractiveElement[] {
  const elements: InteractiveElement[] = [];
  const interactiveRegex = /<(button|a|input|select|textarea|details)([^>]*)>/gi;

  let match: RegExpExecArray | null;
  while ((match = interactiveRegex.exec(content)) !== null) {
    const tag = match[1].toLowerCase();
    const attrs = match[2];

    const roleMatch = attrs.match(/role=["']([^"']+)["']/);
    const textMatch = content.slice(match.index).match(new RegExp(`<${tag}[^>]*>([^<]*)<`, 'i'));

    elements.push({
      tag,
      role: roleMatch?.[1] || tag,
      text: textMatch?.[1]?.trim() || '',
      selector: tag,
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      isVisible: !attrs.includes('hidden') && !attrs.includes('display: none'),
      isDisabled: attrs.includes('disabled'),
      tabIndex: getTabIndex(attrs, tag)
    });
  }

  return elements;
}

function getTabIndex(attrs: string, tag: string): number {
  const tabMatch = attrs.match(/tabindex=["'](-?\d+)["']/i);
  if (tabMatch) return parseInt(tabMatch[1], 10);
  // Naturally focusable elements
  if (['button', 'a', 'input', 'select', 'textarea'].includes(tag)) return 0;
  return -1;
}

// ─── Image Extraction ───────────────────────────────────────────────────────

export function extractImages(content: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  const imgRegex = /<(?:img|Image)\s([^>]*)>/gi;

  let match: RegExpExecArray | null;
  while ((match = imgRegex.exec(content)) !== null) {
    const attrs = match[1];
    const srcMatch = attrs.match(/src=["']([^"']+)["']/);
    const altMatch = attrs.match(/alt=["']([^"']*?)["']/);
    const widthMatch = attrs.match(/width=["']?(\d+)["']?/);
    const heightMatch = attrs.match(/height=["']?(\d+)["']?/);

    images.push({
      src: srcMatch?.[1] || '',
      alt: altMatch?.[1] || '',
      width: widthMatch ? parseInt(widthMatch[1], 10) : 0,
      height: heightMatch ? parseInt(heightMatch[1], 10) : 0,
      naturalWidth: 0,
      naturalHeight: 0,
      isDecorative: attrs.includes('alt=""') || attrs.includes("alt=''") || attrs.includes('role="presentation"'),
      selector: 'img'
    });
  }

  return images;
}

// ─── Link Extraction ────────────────────────────────────────────────────────

export function extractLinks(content: string): LinkInfo[] {
  const links: LinkInfo[] = [];
  const linkRegex = /<a\s([^>]*)>([^<]*(?:<[^/a][^>]*>[^<]*)*)<\/a>/gi;

  let match: RegExpExecArray | null;
  while ((match = linkRegex.exec(content)) !== null) {
    const attrs = match[1];
    const text = match[2].replace(/<[^>]+>/g, '').trim();
    const hrefMatch = attrs.match(/href=["']([^"']+)["']/);

    links.push({
      href: hrefMatch?.[1] || '',
      text,
      isExternal: Boolean(hrefMatch?.[1]?.startsWith('http')),
      selector: 'a'
    });
  }

  return links;
}

// ─── Source File Collection ─────────────────────────────────────────────────

const UI_FILE_EXTENSIONS = new Set([
  '.tsx', '.jsx', '.html', '.vue', '.svelte', '.astro'
]);

const CSS_FILE_EXTENSIONS = new Set([
  '.css', '.scss', '.sass', '.less', '.styl'
]);

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
  'coverage', '.ei', '.agents', '.claude'
]);

export interface UISourceFile {
  path: string;       // relative path
  fullPath: string;   // absolute path
  content: string;
  type: 'component' | 'style' | 'page' | 'layout';
}

/**
 * Collects UI-relevant source files from the repository.
 * Returns component files (JSX/TSX/HTML/Vue/Svelte) and style files (CSS/SCSS).
 */
export function collectUISourceFiles(repoRoot: string, targetSubpath?: string): UISourceFile[] {
  const files: UISourceFile[] = [];
  const startDir = targetSubpath ? join(repoRoot, targetSubpath) : repoRoot;

  function walk(dir: string) {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) {
          walk(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (UI_FILE_EXTENSIONS.has(ext) || CSS_FILE_EXTENSIONS.has(ext)) {
          try {
            const content = readFileSync(fullPath, 'utf-8');
            const relPath = relative(repoRoot, fullPath);
            const type = classifyUIFile(relPath, content, ext);
            files.push({ path: relPath, fullPath, content, type });
          } catch {
            // Skip unreadable files
          }
        }
      }
    }
  }

  if (existsSync(startDir)) {
    if (statSync(startDir).isFile()) {
      const ext = extname(startDir).toLowerCase();
      if (UI_FILE_EXTENSIONS.has(ext) || CSS_FILE_EXTENSIONS.has(ext)) {
        const content = readFileSync(startDir, 'utf-8');
        const relPath = relative(repoRoot, startDir);
        files.push({ path: relPath, fullPath: startDir, content, type: classifyUIFile(relPath, content, ext) });
      }
    } else {
      walk(startDir);
    }
  }

  return files;
}

function classifyUIFile(path: string, content: string, ext: string): UISourceFile['type'] {
  if (CSS_FILE_EXTENSIONS.has(ext)) return 'style';
  if (path.includes('/pages/') || path.includes('/app/') || path.match(/page\.(tsx|jsx|ts|js)$/)) return 'page';
  if (path.includes('/layout') || path.match(/layout\.(tsx|jsx|ts|js)$/)) return 'layout';
  return 'component';
}
