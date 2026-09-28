#!/usr/bin/env node

import { resolve } from 'node:path';
import { runDetectors } from '../detectors/index.js';
import { initProjectContext } from '../context/index.js';
import {
  buildReviewMatrix,
  formatReviewMatrix,
  evaluateShipGate,
  formatShipGate
} from '../reviewer/index.js';
import { analyzeImpact, formatImpactGraph } from '../impact/index.js';
import {
  loadBaseline,
  createBaselineFromFindings,
  getBaselinePath
} from '../baseline/index.js';
import {
  loadIgnores,
  addRuleIgnore,
  addFileIgnore,
  getIgnoresPath
} from '../ignores/index.js';
import { syncProviders } from '../providers/sync.js';

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';
  const repoRoot = process.cwd();

  if (args.includes('--version') || args.includes('-v') || command === 'version') {
    try {
      const { fileURLToPath } = await import('node:url');
      const { dirname, join } = await import('node:path');
      const { readFileSync } = await import('node:fs');
      const __filename = fileURLToPath(import.meta.url);
      const pkgPath = join(dirname(__filename), '../../package.json');
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      console.log(`@devravik/engineering-intelligence v${pkg.version}`);
    } catch {
      console.log('@devravik/engineering-intelligence v0.1.3');
    }
    return;
  }

  switch (command) {
    case 'init': {
      console.log('Initializing Engineering Intelligence context (.ei/)...');
      initProjectContext(repoRoot);
      console.log('✓ Created .ei/PROJECT.md');
      console.log('✓ Created .ei/ARCHITECTURE.md');
      console.log('✓ Created .ei/CONVENTIONS.md');
      console.log('✓ Created .ei/DECISIONS.md');
      console.log('✓ Created .ei/constraints.md');
      console.log('✓ Created .ei/state/ and ignores.json');
      console.log('\nEngineering Intelligence initialized. Run `ei detect` to run checks.');
      break;
    }

    case 'detect': {
      const isJson = args.includes('--json');
      const isSarif = args.includes('--sarif');
      const dynamicBaseline = args.includes('--dynamic-baseline') || args.includes('--auto-reconcile');
      const changedOnly = args.includes('--changed') || args.includes('--staged');
      const targetSubpath = args.find(a => !a.startsWith('-') && a !== 'detect');

      const result = await runDetectors(repoRoot, {
        targetSubpath,
        changedFilesOnly: changedOnly,
        dynamicMergeBase: dynamicBaseline
      });

      if (isSarif) {
        const { formatSarif } = await import('../detectors/sarif.js');
        console.log(formatSarif(result));
        process.exit(result.summary.blockers > 0 ? 1 : 0);
      }

      if (isJson) {
        console.log(JSON.stringify(result, null, 2));
        process.exit(result.summary.blockers > 0 ? 1 : 0);
      }


      console.log('\n================================================================');
      console.log('                 ENGINEERING INTELLIGENCE DETECT');
      console.log('================================================================\n');

      if (result.findings.length === 0) {
        console.log('✓ Zero findings detected. Codebase conforms to active contracts.');
      } else {
        for (const f of result.findings) {
          const badge = f.disposition === 'BLOCK' ? '🔴 BLOCK' : f.disposition === 'FIX' ? '🟡 FIX' : 'ℹ️ ADVISORY';
          console.log(`[${f.impact}] ${badge} - ${f.ruleId}: ${f.title}`);
          console.log(`  Location: ${f.filePath}:${f.line}`);
          console.log(`  Baseline Status: ${f.baselineStatus}`);
          console.log(`  Evidence: ${f.evidence}`);
          if (f.suggestedFix) console.log(`  Suggested Fix: ${f.suggestedFix}`);
          console.log('');
        }
      }

      console.log('----------------------------------------------------------------');
      console.log(
        `SUMMARY: ${result.summary.newCount} new | ` +
          `${result.summary.baselineCount} baseline | ` +
          `${result.summary.resolvedCount} resolved | ` +
          `${result.waivedCount} waived`
      );
      console.log(
        `CURRENT: ${result.summary.blockers} BLOCKERS | ` +
          `${result.summary.fixCount} FIX | ` +
          `${result.summary.advisoryCount} ADVISORY`
      );
      console.log('================================================================');

      process.exit(result.summary.blockers > 0 ? 1 : 0);
    }

    case 'review': {
      const result = await runDetectors(repoRoot, { changedFilesOnly: true });
      const matrix = buildReviewMatrix(result.findings, {
        baselineCounts: {
          baseline: result.summary.baselineCount,
          new: result.summary.newCount,
          resolved: result.summary.resolvedCount
        }
      });
      console.log(formatReviewMatrix(matrix, result.findings));
      // ei review is diagnostic: outputs findings, physical evidence, baseline attribution,
      // confidence scores, recommendations, and highlighted UNKNOWN areas.
      // It does not act as an aggressive release gate, allowing agents/devs to inspect and reason.
      process.exit(0);
    }

    case 'impact': {
      const target = args[1];
      if (!target) {
        console.error('Error: Please specify a symbol or file path. Example: `ei impact User`');
        process.exit(1);
      }
      const graph = analyzeImpact(repoRoot, target);
      console.log(formatImpactGraph(graph));
      break;
    }

    case 'ship': {
      console.log('Verifying release readiness preconditions...\n');
      const result = await runDetectors(repoRoot);
      const matrix = buildReviewMatrix(result.findings, {
        baselineCounts: {
          baseline: result.summary.baselineCount,
          new: result.summary.newCount,
          resolved: result.summary.resolvedCount
        }
      });
      const gate = evaluateShipGate(matrix, result.findings);

      console.log(formatShipGate(gate));

      process.exit(gate.passed ? 0 : 1);
    }

    case 'simplify': {
      const targetSubpath = args[1];
      console.log('Executing /simplify anti-entropy analysis...\n');
      const result = await runDetectors(repoRoot, { targetSubpath });

      const slopFindings = result.findings.filter(
        f => f.category === 'Slop' || f.category === 'Architecture' || f.category === 'CodeQuality'
      );

      if (slopFindings.length === 0) {
        console.log('✓ Codebase is already concise. No redundant factories, single-use interfaces, or dead code detected.');
      } else {
        console.log(`Identified ${slopFindings.length} candidate structural simplifications:\n`);
        for (const f of slopFindings) {
          console.log(`- [${f.ruleId}] ${f.title}`);
          console.log(`  Target: ${f.filePath}:${f.line}`);
          console.log(`  Proposal: ${f.suggestedFix}\n`);
        }
      }
      break;
    }

    case 'baseline': {
      const sub = args[1] || 'show';
      if (sub === 'create' || sub === 'update') {
        const result = await runDetectors(repoRoot);
        createBaselineFromFindings(repoRoot, result.findings);
        console.log(`✓ Baseline snapshot created with ${result.findings.length} entries at ${getBaselinePath(repoRoot)}`);
      } else {
        const state = loadBaseline(repoRoot);
        console.log(`Baseline created at: ${state.createdAt}`);
        console.log(`Total baseline entries: ${Object.keys(state.entries).length}`);
      }
      break;
    }

    case 'ignores': {
      const sub = args[1] || 'list';
      if (sub === 'add-rule') {
        const ruleId = args[2];
        const reasonIdx = args.indexOf('--reason');
        const reason = reasonIdx !== -1 ? args.slice(reasonIdx + 1).join(' ') : '';
        if (!ruleId || !reason) {
          console.error('Usage: ei ignores add-rule <RULE-ID> --reason "<explanation>"');
          process.exit(1);
        }
        addRuleIgnore(repoRoot, ruleId, reason);
        console.log(`✓ Rule waiver added for ${ruleId}: "${reason}"`);
      } else if (sub === 'add-file') {
        const pattern = args[2];
        const reasonIdx = args.indexOf('--reason');
        const reason = reasonIdx !== -1 ? args.slice(reasonIdx + 1).join(' ') : '';
        if (!pattern || !reason) {
          console.error('Usage: ei ignores add-file "<pattern>" --reason "<explanation>"');
          process.exit(1);
        }
        addFileIgnore(repoRoot, pattern, reason);
        console.log(`✓ File waiver added for pattern "${pattern}": "${reason}"`);
      } else {
        const cfg = loadIgnores(repoRoot);
        console.log(`Active Waivers (${getIgnoresPath(repoRoot)}):\n`);
        console.log('Rule Waivers:');
        if (cfg.rules.length === 0) console.log('  (none)');
        for (const r of cfg.rules) console.log(`  - ${r.ruleId}: "${r.reason}" (${r.author}, ${r.date.slice(0, 10)})`);

        console.log('\nFile Waivers:');
        if (cfg.files.length === 0) console.log('  (none)');
        for (const f of cfg.files) console.log(`  - ${f.pattern}: "${f.reason}" (${f.author}, ${f.date.slice(0, 10)})`);
      }
      break;
    }

    case 'sync-providers': {
      const installToWorkspace = args.includes('--install');
      const priorityIdx = args.indexOf('--priority') !== -1 ? args.indexOf('--priority') : args.indexOf('--tier');
      const priorityFilter = priorityIdx !== -1 ? args[priorityIdx + 1]?.split(',') : undefined;
      const providerIdx = args.indexOf('--provider');
      const providerFilter = providerIdx !== -1 ? args[providerIdx + 1]?.split(',') : undefined;

      console.log('Synchronizing provider configurations from canonical core...');
      const { providersUpdated } = syncProviders({
        repoRoot,
        installToWorkspace,
        priorityFilter,
        providerFilter
      });
      for (const p of providersUpdated) {
        console.log(`✓ Synchronized ${p}`);
      }
      if (installToWorkspace) {
        console.log('✓ Installed rules to local workspace (.agents/, .claude/, .github/, .cursor/, .zed/, etc.)');
      }
      console.log(`\nAll ${providersUpdated.length} targeted providers in sync with active detector catalog.`);
      break;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // Distribution, Installation & Doctor Commands
    // ═══════════════════════════════════════════════════════════════════════

    case 'install': {
      const isJson = args.includes('--json');
      const isYes = args.includes('--yes') || args.includes('-y');

      const scopeIdx = args.indexOf('--scope');
      const scopeVal = scopeIdx !== -1 ? args[scopeIdx + 1] : 'project';
      const scope = (scopeVal === 'global' || scopeVal === 'all') ? scopeVal : 'project';

      const provIdx = args.indexOf('--providers') !== -1 ? args.indexOf('--providers') : args.indexOf('--provider');
      const providers = provIdx !== -1 ? args[provIdx + 1]?.split(',') : undefined;

      const { detectHarnesses, installProviders } = await import('../installer/index.js');

      console.log('\n================================================================');
      console.log('             ENGINEERING INTELLIGENCE INSTALLER');
      console.log('================================================================\n');

      const detected = detectHarnesses(repoRoot);
      const detectedOnly = detected.filter(d => d.isDetected);

      console.log('Detected AI Agent Harnesses:');
      if (detectedOnly.length === 0) {
        console.log('  (no specific agent harnesses auto-detected — defaulting to P0 reference harnesses)');
      } else {
        for (const d of detectedOnly) {
          console.log(`  ✓ ${d.name.padEnd(26)} (${d.detectedReasons[0]})`);
        }
      }
      console.log('');

      const result = await installProviders({
        repoRoot,
        scope,
        providers,
        yes: isYes
      });

      if (isJson) {
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      console.log(`Installed Engineering Intelligence [Scope: ${scope}]:`);
      for (const item of result.installed) {
        console.log(`  ✓ ${item.providerName}`);
        for (const f of item.files) {
          console.log(`    → ${f}`);
        }
      }

      console.log('\n✓ Installation complete. Run `ei doctor` to verify system health.');
      console.log('================================================================\n');
      break;
    }

    case 'update': {
      const isJson = args.includes('--json');
      const { updateProviders } = await import('../installer/index.js');

      console.log('\nUpdating installed Engineering Intelligence configurations...');
      const result = await updateProviders(repoRoot);

      if (isJson) {
        console.log(JSON.stringify(result, null, 2));
        break;
      }

      console.log(`\n${result.summary}`);
      for (const item of result.updated) {
        console.log(`  ✓ ${item.providerName}`);
        for (const f of item.files) {
          console.log(`    → ${f}`);
        }
      }
      console.log('');
      break;
    }

    case 'doctor': {
      const isJson = args.includes('--json');
      const { runDoctor, formatDoctorReport } = await import('../installer/index.js');

      const report = await runDoctor(repoRoot);

      if (isJson) {
        console.log(JSON.stringify(report, null, 2));
        break;
      }

      console.log(formatDoctorReport(report));
      break;
    }

    case 'providers': {
      const { ALL_PROVIDERS } = await import('../protocol/index.js');
      console.log('\n================================================================');
      console.log('            ENGINEERING INTELLIGENCE PROVIDER MATRIX            ');
      console.log('================================================================\n');

      for (const tier of ['P0', 'P1', 'P2', 'P3'] as const) {
        const inTier = ALL_PROVIDERS.filter(p => p.priority === tier);
        console.log(`[Tier ${tier}]`);
        for (const p of inTier) {
          const channels = p.channels.join(', ');
          console.log(`  • ${p.name.padEnd(26)} | ${p.category.padEnd(10)} | Channels: [${channels}]`);
        }
        console.log('');
      }

      console.log('Total Supported Coding Agents: ' + ALL_PROVIDERS.length);
      console.log('Run `ei sync-providers` to generate provider artifacts.');
      console.log('Run `ei mcp` to start stdio Agent Client Protocol / Model Context Protocol server.');
      console.log('================================================================\n');
      break;
    }

    case 'mcp': {
      const { startMcpServer } = await import('../protocol/mcp-server.js');
      startMcpServer(repoRoot);
      break;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // UI Intelligence Commands
    case 'ui': {
      const KNOWN_SURFACES = new Set([
        'landing', 'marketing', 'dashboard', 'settings', 'checkout',
        'ecommerce', 'admin', 'mobile', 'documentation', 'developer-tool', 'consumer-app'
      ]);

      let subCommand = args[1];
      let surfaceOverride: any = undefined;

      if (!subCommand || subCommand === 'auto' || subCommand === 'reason') {
        subCommand = 'auto';
      } else if (KNOWN_SURFACES.has(subCommand)) {
        surfaceOverride = subCommand;
        subCommand = 'auto';
      }

      const targetSubpath = args.find(a => !a.startsWith('-') && a !== 'ui' && a !== args[1]);
      const isJson = args.includes('--json');

      // Lazy-load UI modules
      const { runUIDetectors, allUIDetectors } = await import('../ui/detectors/index.js');
      const { chooseWorkflows, formatWorkflowRouting, runFivePassCritique } = await import('../ui/reasoning/index.js');

      switch (subCommand) {
        case 'auto': {
          const result = await runUIDetectors(repoRoot, { targetSubpath, surface: surfaceOverride });
          const routing = chooseWorkflows(result.evidence, result.findings);

          if (isJson) {
            console.log(JSON.stringify(routing, null, 2));
            break;
          }

          console.log(formatWorkflowRouting(routing));
          break;
        }

        case 'detect': {
          const result = await runUIDetectors(repoRoot, { targetSubpath, surface: surfaceOverride });

          if (isJson) {
            console.log(JSON.stringify({
              surface: result.surface,
              summary: result.summary,
              findings: result.findings,
              tokens: {
                colors: result.evidence.tokens.colors.length,
                fontSizes: result.evidence.tokens.fontSizes.length,
                fontWeights: result.evidence.tokens.fontWeights.length,
                fontFamilies: result.evidence.tokens.fontFamilies.length,
                spacingValues: result.evidence.tokens.spacingValues.length,
                borderRadii: result.evidence.tokens.borderRadii.length,
                shadows: result.evidence.tokens.shadows.length,
              },
              components: result.evidence.components
            }, null, 2));
            break;
          }

          console.log('\n================================================================');
          console.log('               UI INTELLIGENCE DETECT');
          console.log('================================================================\n');

          console.log(`Surface:     ${result.surface}`);
          console.log(`UI Rules:    ${allUIDetectors.length} active`);
          console.log(`Findings:    ${result.summary.total}`);
          console.log('');

          // Component inventory
          const c = result.evidence.components;
          console.log('──── Component Inventory ────');
          const compEntries = Object.entries(c).filter(([, v]) => v > 0);
          if (compEntries.length > 0) {
            for (const [key, val] of compEntries) {
              console.log(`  ${key.padEnd(16)} ${val}`);
            }
          } else {
            console.log('  (no UI components detected)');
          }
          console.log('');

          // Token analysis
          const t = result.evidence.tokens;
          console.log('──── Design Token Analysis ────');
          console.log(`  Colors:         ${t.colors.length} unique values`);
          console.log(`  Font Sizes:     ${t.fontSizes.length} variants`);
          console.log(`  Font Weights:   ${t.fontWeights.length} variants`);
          console.log(`  Font Families:  ${t.fontFamilies.length}`);
          console.log(`  Spacing:        ${t.spacingValues.length} values`);
          console.log(`  Border Radii:   ${t.borderRadii.length} values`);
          console.log(`  Shadows:        ${t.shadows.length} definitions`);
          console.log('');

          // Findings
          if (result.findings.length === 0) {
            console.log('✓ Zero UI findings detected. Interface conforms to active contracts.');
          } else {
            console.log('──── Findings ────');
            for (const f of result.findings) {
              const badge = f.disposition === 'BLOCK' ? '🔴 BLOCK'
                          : f.disposition === 'FIX' ? '🟡 FIX'
                          : 'ℹ️ REVIEW';
              console.log(`[${f.impact}] ${badge} - ${f.ruleId}: ${f.title}`);
              if (f.evidence) console.log(`  Evidence: ${f.evidence.slice(0, 120)}`);
              if (f.suggestedFix) console.log(`  Fix: ${f.suggestedFix}`);
              console.log('');
            }
          }

          // Summary by category
          console.log('──── Summary by Category ────');
          for (const [cat, count] of Object.entries(result.summary.byCategory)) {
            if (count > 0) {
              console.log(`  ${cat.padEnd(16)} ${count} finding${count > 1 ? 's' : ''}`);
            }
          }
          console.log('');
          console.log(`TOTAL: ${result.summary.blockers} BLOCKERS | ${result.summary.fixCount} FIX | ${result.summary.advisoryCount} ADVISORY`);
          console.log('================================================================\n');
          break;
        }

        case 'audit': {
          console.log('\n================================================================');
          console.log('                  UI INTELLIGENCE AUDIT');
          console.log('        (Objective: a11y, responsive, performance, tokens)');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });

          // Filter to objective audit categories
          const auditCategories = new Set(['Accessibility', 'Responsive', 'DesignSystem', 'Typography']);
          const auditFindings = result.findings.filter(f => auditCategories.has(f.category));

          // Group by category
          const grouped = new Map<string, typeof auditFindings>();
          for (const f of auditFindings) {
            const arr = grouped.get(f.category) || [];
            arr.push(f);
            grouped.set(f.category, arr);
          }

          for (const [category, findings] of grouped) {
            console.log(`[${category.toUpperCase()}]`);
            for (const f of findings) {
              console.log(`  ${f.ruleId}: ${f.title}`);
              if (f.evidence) console.log(`    ${f.evidence.slice(0, 100)}`);
            }
            console.log('');
          }

          if (auditFindings.length === 0) {
            console.log('✓ UI audit clean. No objective accessibility, responsive, or design system issues detected.\n');
          }

          // Token coherence summary
          const t2 = result.evidence.tokens;
          console.log('──── Token Coherence ────');
          const dimensions = [
            { name: 'Colors', count: t2.colors.length, max: 20 },
            { name: 'Font Sizes', count: t2.fontSizes.length, max: 10 },
            { name: 'Spacing', count: t2.spacingValues.length, max: 15 },
            { name: 'Radii', count: t2.borderRadii.length, max: 6 },
            { name: 'Shadows', count: t2.shadows.length, max: 5 },
          ];

          for (const d of dimensions) {
            const status = d.count <= d.max ? '✓' : '⚠';
            console.log(`  ${status} ${d.name.padEnd(14)} ${d.count}/${d.max} (${d.count <= d.max ? 'coherent' : 'proliferating'})`);
          }

          console.log('\n================================================================\n');
          break;
        }

        case 'critique': {
          console.log('\n================================================================');
          console.log('               UI INTELLIGENCE CRITIQUE');
          console.log('         Pass A: Mechanical | Pass B: Visual/UX');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });

          // Pass A: Mechanical evidence
          console.log('── PASS A: Mechanical Evidence ──\n');

          const mechanicalCats = new Set(['Typography', 'Color', 'Spatial', 'Responsive', 'Accessibility', 'DesignSystem']);
          const passAFindings = result.findings.filter(f => mechanicalCats.has(f.category));

          if (passAFindings.length > 0) {
            for (const f of passAFindings) {
              console.log(`  [${f.category}] ${f.ruleId}: ${f.title}`);
            }
          } else {
            console.log('  ✓ No mechanical issues detected.');
          }

          console.log('');

          // Pass B: Visual/UX reasoning (anti-pattern signals)
          console.log('── PASS B: Visual/UX Anti-Pattern Signals ──\n');

          const slopFindings = result.findings.filter(f =>
            f.category === 'UISlop' || f.category === 'Composition'
          );

          if (slopFindings.length > 0) {
            for (const f of slopFindings) {
              console.log(`  [${f.category}] ${f.ruleId}: ${f.title}`);
              if (f.suggestedFix) console.log(`    → ${f.suggestedFix}`);
            }
          } else {
            console.log('  ✓ No AI slop or composition anti-patterns detected.');
          }

          console.log('');

          // Combined disposition
          const compound = result.findings.find(f => f.ruleId === 'UI-SLOP-COMPOUND');
          if (compound) {
            console.log(`── COMPOUND AI SLOP SIGNAL: ${compound.title} ──`);
            console.log(`  ${compound.evidence}`);
          } else {
            console.log('── COMPOUND SIGNAL: None (no aggregate AI-slop pattern detected) ──');
          }

          console.log('\n================================================================\n');
          break;
        }

        case 'distill': {
          console.log('\n================================================================');
          console.log('               UI INTELLIGENCE DISTILL');
          console.log('    "What can be removed? What is earning its place?"');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const c2 = result.evidence.components;

          console.log(`Surface: ${result.surface}`);
          console.log('');

          // Inventory
          console.log('──── Current Inventory ────');
          const items = [
            { name: 'Cards', count: c2.cards },
            { name: 'Badges/Pills', count: c2.badges + c2.pills },
            { name: 'Buttons', count: c2.buttons },
            { name: 'Icons', count: c2.icons },
            { name: 'Charts', count: c2.charts },
            { name: 'Banners', count: c2.banners },
            { name: 'Hero Sections', count: c2.heroSections },
            { name: 'Modals', count: c2.modals },
            { name: 'Forms', count: c2.forms },
            { name: 'Tables', count: c2.tables },
          ].filter(i => i.count > 0);

          for (const item of items) {
            console.log(`  ${item.name.padEnd(16)} ${item.count}`);
          }
          console.log('');

          // Distillation recommendations
          const distillFindings = result.findings.filter(f =>
            f.category === 'UISlop' || f.category === 'Composition' || f.category === 'Spatial'
          );

          if (distillFindings.length > 0) {
            console.log('──── Distillation Recommendations ────');
            for (const f of distillFindings) {
              const action = f.disposition === 'FIX' ? 'REMOVE/CONSOLIDATE' : 'REVIEW';
              console.log(`  ${action}: ${f.title}`);
              if (f.suggestedFix) console.log(`    → ${f.suggestedFix}`);
              console.log('');
            }
          } else {
            console.log('✓ Interface is already concise. No redundant components or decorative excess detected.');
          }

          console.log('================================================================\n');
          break;
        }

        case 'document': {
          console.log('Generating DESIGN.md from existing visual system...\n');

          const { collectStaticUIEvidence } = await import('../ui/browser/index.js');
          const { generateDesignMd, writeDesignMd } = await import('../ui/design-system/document.js');

          const evidence = collectStaticUIEvidence(repoRoot, targetSubpath);
          const content = generateDesignMd(evidence);
          const path = writeDesignMd(repoRoot, content);

          console.log(`✓ Generated DESIGN.md at ${path}`);
          console.log(`  Surface: ${evidence.surface}`);
          console.log(`  Colors: ${evidence.tokens.colors.length} unique values`);
          console.log(`  Font Families: ${evidence.tokens.fontFamilies.length}`);
          console.log(`  Spacing Values: ${evidence.tokens.spacingValues.length}`);
          console.log(`  Border Radii: ${evidence.tokens.borderRadii.length}`);
          console.log(`\nReview and curate DESIGN.md to establish project design truth.`);
          break;
        }

        case 'layout': {
          console.log('\n================================================================');
          console.log('                 UI INTELLIGENCE LAYOUT');
          console.log('      Spacing, Alignment, Hierarchy, Density Analysis');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const l = result.evidence.layout;

          console.log(`Surface:            ${result.surface}`);
          console.log(`Alignment Systems:  ${l.alignmentSystems.join(', ') || 'None'}`);
          console.log(`Grid Usage:         ${l.gridUsage ? '✓ Yes' : '✗ No'}`);
          console.log(`Flexbox Usage:      ${l.flexUsage ? '✓ Yes' : '✗ No'}`);
          console.log(`Max Nesting Depth:  ${l.maxNestingDepth}`);
          console.log(`Centered Elements:  ${l.centeredElements} / ${l.totalElements} (${l.totalElements > 0 ? ((l.centeredElements / l.totalElements) * 100).toFixed(0) : 0}%)\n`);

          const spatialFindings = result.findings.filter(f => f.category === 'Spatial' || f.category === 'Composition');
          if (spatialFindings.length > 0) {
            console.log('──── Layout & Spatial Recommendations ────');
            for (const f of spatialFindings) {
              console.log(`  [${f.ruleId}] ${f.title}`);
              console.log(`    Evidence: ${f.evidence}`);
              if (f.suggestedFix) console.log(`    → ${f.suggestedFix}`);
              console.log('');
            }
          } else {
            console.log('✓ Clean spatial composition. No nesting violations or alignment drift detected.');
          }

          console.log('================================================================\n');
          break;
        }

        case 'typeset': {
          console.log('\n================================================================');
          console.log('                 UI INTELLIGENCE TYPESET');
          console.log('        Typography Hierarchy, Readability, Font System');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const typo = result.evidence.typography;

          console.log(`Headings Count:     ${typo.headings.length}`);
          console.log(`Font Families:      ${typo.fontFamilies.join(', ') || 'None declared'}`);
          console.log(`Font Sizes:         ${result.evidence.tokens.fontSizes.map(f => f.value).join(', ') || 'None'}`);
          console.log(`Font Weights:       ${result.evidence.tokens.fontWeights.map(w => w.value).join(', ') || 'None'}\n`);

          if (typo.headings.length > 0) {
            console.log('──── Heading Hierarchy ────');
            for (const h of typo.headings) {
              console.log(`  h${h.level}: "${h.text}"`);
            }
            console.log('');
          }

          const typeFindings = result.findings.filter(f => f.category === 'Typography');
          if (typeFindings.length > 0) {
            console.log('──── Typography Recommendations ────');
            for (const f of typeFindings) {
              console.log(`  [${f.ruleId}] ${f.title}`);
              if (f.suggestedFix) console.log(`    → ${f.suggestedFix}`);
              console.log('');
            }
          } else {
            console.log('✓ Clear typographic hierarchy and readable scales detected.');
          }

          console.log('================================================================\n');
          break;
        }

        case 'adapt': {
          console.log('\n================================================================');
          console.log('                  UI INTELLIGENCE ADAPT');
          console.log('       Multi-Viewport Matrix (375, 390, 768, 1024, 1440)');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const caps = result.evidence.responsiveCaptures || [];

          for (const cap of caps) {
            console.log(`── ${cap.viewport.label} (${cap.viewport.width}x${cap.viewport.height}) ──`);
            console.log(`  Horizontal Overflows: ${cap.overflowElements.length}`);
            console.log(`  Clipped Elements:     ${cap.clippedElements.length}`);
            console.log(`  Touch Targets < 44px: ${cap.touchTargets.filter(t => t.isTooSmall).length}`);
            console.log('');
          }

          const respFindings = result.findings.filter(f => f.category === 'Responsive');
          if (respFindings.length > 0) {
            console.log('──── Responsive Issues ────');
            for (const f of respFindings) {
              console.log(`  [${f.ruleId}] ${f.title}`);
              console.log(`    ${f.evidence}`);
              if (f.suggestedFix) console.log(`    → ${f.suggestedFix}`);
              console.log('');
            }
          } else {
            console.log('✓ Interface adapts cleanly across mobile, tablet, and desktop viewports.');
          }

          console.log('================================================================\n');
          break;
        }

        case 'harden': {
          console.log('\n================================================================');
          console.log('                  UI INTELLIGENCE HARDEN');
          console.log('    Accessibility, Interactive States, Error & Form Resilience');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const a11y = result.evidence.accessibility;

          console.log(`WCAG Passes:        ${a11y.passes}`);
          console.log(`WCAG Violations:    ${a11y.violations.length}`);
          console.log(`Interactive Items:  ${result.evidence.dom.interactiveElements.length}`);
          console.log(`Forms Detected:     ${result.evidence.dom.forms.length}\n`);

          const a11yFindings = result.findings.filter(f => f.category === 'Accessibility' || f.category === 'Interaction');
          if (a11yFindings.length > 0) {
            console.log('──── Hardening Priorities ────');
            for (const f of a11yFindings) {
              console.log(`  [${f.ruleId}] ${f.title}`);
              console.log(`    ${f.evidence}`);
              if (f.suggestedFix) console.log(`    → ${f.suggestedFix}`);
              console.log('');
            }
          } else {
            console.log('✓ Accessible interactive elements and solid resilient baseline.');
          }

          console.log('================================================================\n');
          break;
        }

        case 'clarify': {
          console.log('\n================================================================');
          console.log('                 UI INTELLIGENCE CLARIFY');
          console.log('           UX Copy, Labels, and Action Clarity');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const buttons = result.evidence.dom.interactiveElements.filter(e => e.tag === 'button' || e.role === 'button');
          const links = result.evidence.dom.links;

          console.log(`Buttons Inspected:  ${buttons.length}`);
          console.log(`Links Inspected:    ${links.length}`);
          console.log(`Headings:           ${result.evidence.dom.headings.length}\n`);

          const vagueButtons = buttons.filter(b => ['click here', 'more', 'submit', 'go'].includes(b.text.toLowerCase().trim()));
          if (vagueButtons.length > 0) {
            console.log('──── Vague Action Labels ────');
            for (const b of vagueButtons) {
              console.log(`  Label "${b.text}" at ${b.selector} is generic. Replace with task-specific verb (e.g. "Create Project", "Download Report").`);
            }
            console.log('');
          } else {
            console.log('✓ Action labels communicate specific user tasks clearly.');
          }

          console.log('================================================================\n');
          break;
        }

        case 'polish': {
          console.log('\n================================================================');
          console.log('                  UI INTELLIGENCE POLISH');
          console.log('        Visual Consistency, Token Cohesion, Contrast');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const t = result.evidence.tokens;

          console.log(`Color Palette:      ${t.colors.length} unique values`);
          console.log(`Border Radii:       ${t.borderRadii.length} variants`);
          console.log(`Shadows:            ${t.shadows.length} variants`);
          console.log(`Spacing Steps:      ${t.spacingValues.length} values\n`);

          const polishFindings = result.findings.filter(f => f.category === 'Color' || f.category === 'DesignSystem');
          if (polishFindings.length > 0) {
            console.log('──── Polish Refinements ────');
            for (const f of polishFindings) {
              console.log(`  [${f.ruleId}] ${f.title}`);
              if (f.suggestedFix) console.log(`    → ${f.suggestedFix}`);
              console.log('');
            }
          } else {
            console.log('✓ Cohesive visual polish with consistent design tokens.');
          }

          console.log('================================================================\n');
          break;
        }

        case 'extract': {
          const { extractDesignSystem, formatExtractionReport } = await import('../ui/design-system/extract.js');
          const result = await runUIDetectors(repoRoot, { targetSubpath });
          const report = extractDesignSystem(result.evidence);

          if (isJson) {
            console.log(JSON.stringify(report, null, 2));
            break;
          }

          console.log(formatExtractionReport(report));
          break;
        }

        case 'onboard': {
          console.log('\n================================================================');
          console.log('                  UI INTELLIGENCE ONBOARD');
          console.log('           First-Use Path, Empty States, Time-to-Value');
          console.log('================================================================\n');

          const result = await runUIDetectors(repoRoot, { targetSubpath });
          console.log(`Surface:            ${result.surface}`);
          console.log(`Hero Section:       ${result.evidence.components.heroSections > 0 ? '✓ Present' : '✗ Missing'}`);
          console.log(`Primary Actions:    ${result.evidence.components.buttons} buttons, ${result.evidence.dom.links.length} links`);
          console.log(`Forms Detected:     ${result.evidence.dom.forms.length}\n`);

          console.log('──── First-Use Experience Checklist ────');
          console.log(`  [1] Time to First Value:    ${result.evidence.components.buttons > 0 ? '✓ Primary action is clickable immediately' : '✗ No obvious first action'}`);
          console.log(`  [2] Empty State Guidance:   ${result.evidence.components.cards > 0 ? '✓ Container cards present' : '⚠️ Verify empty state for initial load'}`);
          console.log(`  [3] Cognitive Load:         ${result.evidence.components.cards > 8 ? '⚠️ High density — consider progressive disclosure' : '✓ Manageable density'}`);

          console.log('\n================================================================\n');
          break;
        }

        default:
          console.log(`
UI Intelligence Commands:

  ei ui detect [path]       Run all UI detectors (--json for structured output)
  ei ui audit [path]        Objective audit: a11y, responsive, performance, tokens
  ei ui critique [path]     Two-pass critique: mechanical evidence + visual/UX reasoning
  ei ui distill [path]      Anti-slop: what can be removed? what earns its place?
  ei ui layout [path]       Spacing, hierarchy, density, alignment analysis
  ei ui typeset [path]      Typography hierarchy, readability, font usage
  ei ui adapt [path]        Responsive behavior across 5 viewports (375-1440px)
  ei ui harden [path]       Accessibility, interactive states, error/form resilience
  ei ui clarify [path]      UX copy, button labels, link descriptions, clarity
  ei ui polish [path]       Visual consistency, token cohesion, contrast
  ei ui document [path]     Generate/refresh DESIGN.md from existing visual system
  ei ui extract [path]      Identify reusable components and tokens
  ei ui onboard [path]      First-use path, empty state, and activation analysis
`);
      }
      break;
    }

    default:
      console.log(`
Engineering Intelligence CLI (ei)

Engineering Commands:
  ei init                          Initialize .ei/ context suite
  ei detect [path] [--changed]     Run deterministic detector rules (--json, --sarif, --dynamic-baseline)
  ei review                        Run matrix-based engineering review
  ei simplify [path]               Run anti-entropy simplification analysis
  ei impact <symbol>               Generate dependency graph & change risk
  ei ship                          Verify 10-point release gate
  ei baseline [create|show]        Manage known legacy baseline
  ei ignores [list|add-rule]       Manage rule & file waivers with reasons
  ei providers                     List all 16 supported coding agents & priority tiers
  ei sync-providers [--install]    Synchronize provider artifacts across P0-P3 tiers
  ei mcp                           Start stdio Agent Client Protocol (ACP) & MCP server

Distribution & Installation Commands:
  ei install [--scope project|global] [--providers list]   Install EI native skills/hooks for detected agents
  ei update                                                Update installed skills and configurations
  ei doctor                                                Audit installed harnesses, capabilities, and manifests

UI Intelligence Commands:
  ei ui [detect|audit|critique|distill|document] [path]
  ei ui detect [path]              Run UI detectors (typography, color, spatial, composition, slop)
  ei ui audit [path]               Objective audit: accessibility, responsive, design tokens
  ei ui critique [path]            Two-pass critique: mechanical + visual/UX reasoning
  ei ui distill [path]             Anti-slop distillation: remove before add
  ei ui document [path]            Generate DESIGN.md from existing visual system
`);
  }
}


main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});

