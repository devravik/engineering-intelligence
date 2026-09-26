#!/usr/bin/env node

import { resolve } from 'node:path';
import { runDetectors } from '../detectors/index.js';
import { initProjectContext } from '../context/index.js';
import { buildReviewMatrix, formatReviewMatrix } from '../reviewer/index.js';
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
      const changedOnly = args.includes('--changed') || args.includes('--staged');
      const targetSubpath = args.find(a => !a.startsWith('-') && a !== 'detect');

      const result = await runDetectors(repoRoot, {
        targetSubpath,
        changedFilesOnly: changedOnly
      });

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
      process.exit(matrix.finalDisposition === 'BLOCK' ? 1 : 0);
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
      const matrix = buildReviewMatrix(result.findings);

      console.log(formatReviewMatrix(matrix));

      if (matrix.finalDisposition === 'BLOCK') {
        console.log('\n🛑 SHIP GATE: REJECTED');
        console.log('Unresolved BLOCKERS prevent release. UNKNOWN != PASS.');
        process.exit(1);
      } else if (matrix.finalDisposition === 'FIX') {
        console.log('\n⚠️ SHIP GATE: ACTION REQUIRED');
        console.log('High-priority fixes must be addressed or explicitly waived.');
        process.exit(1);
      } else {
        console.log('\n🟢 SHIP GATE: APPROVED');
        console.log('All deterministic contracts and verification gates passed.');
        process.exit(0);
      }
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
        // Map active findings to raw
        const raw = result.findings.map(f => ({
          ruleId: f.ruleId,
          category: f.category,
          title: f.title,
          message: f.message,
          filePath: f.filePath,
          line: f.line,
          evidence: f.evidence,
          confidence: f.confidence,
          impact: f.impact
        }));
        createBaselineFromFindings(repoRoot, raw);
        console.log(`✓ Baseline snapshot created with ${raw.length} entries at ${getBaselinePath(repoRoot)}`);
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
      console.log('Synchronizing provider configurations from canonical core...');
      const { providersUpdated } = syncProviders({ repoRoot, installToWorkspace });
      for (const p of providersUpdated) {
        console.log(`✓ Synchronized ${p}`);
      }
      if (installToWorkspace) {
        console.log('✓ Installed rules to local workspace (.claude/, .cursor/, .agents/)');
      }
      console.log('\nAll providers in sync with active detector catalog.');
      break;
    }

    default:
      console.log(`
Engineering Intelligence CLI (ei)

Commands:
  ei init                          Initialize .ei/ context suite
  ei detect [path] [--changed]     Run deterministic detector rules
  ei review                        Run matrix-based engineering review
  ei simplify [path]               Run anti-entropy simplification analysis
  ei impact <symbol>               Generate dependency graph & change risk
  ei ship                          Verify 10-point release gate
  ei baseline [create|show]        Manage known legacy baseline
  ei ignores [list|add-rule]       Manage rule & file waivers with reasons
  ei sync-providers [--install]    Synchronize provider adapters (Claude, Cursor, Codex, OpenCode)
`);
  }
}

main().catch(err => {
  console.error('Fatal CLI Error:', err);
  process.exit(1);
});
