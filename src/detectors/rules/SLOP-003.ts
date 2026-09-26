import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const slop003: Detector = {
  id: 'SLOP-003',
  name: 'speculative-infrastructure',
  category: 'Slop',
  severity: 'HIGH',
  ruleClass: 'HEURISTIC',
  description: 'Detects extensible plugin or strategy registries that maintain exactly one registered implementation.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js')) continue;
      if (file.path.includes('/detectors/') || file.path.includes('/tests/') || file.path.includes('node_modules/')) {
        continue;
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // Match: class PluginRegistry or class StrategyRegistry or class ProviderRegistry
        const registryMatch = line.match(/class\s+([A-Za-z0-9_]*(?:Registry|PluginManager|StrategySelector))\b/);
        if (registryMatch) {
          const registryName = registryMatch[1];
          // Check entire codebase for register calls on this registry
          let registrationCount = 0;
          const regRegex = new RegExp(`(?:${registryName}|registry)\\.register\\b`);

          for (const f of context.files) {
            const matches = f.content.match(regRegex);
            if (matches) registrationCount += matches.length;
          }

          if (registrationCount <= 1) {
            findings.push({
              ruleId: 'SLOP-003',
              category: 'Slop',
              title: `Speculative infrastructure: '${registryName}' with 1 implementation`,
              message: `'${registryName}' introduces an extensible plugin architecture, but only ${registrationCount} implementation is ever registered across the repository. This is speculative over-engineering.`,
              filePath: file.path,
              line: i + 1,
              evidence: line.trim(),
              confidence: 'HIGH',
              impact: 'HIGH',
              suggestedFix: `Replace dynamic registry with direct invocation of the concrete strategy.`
            });
          }
        }
      }
    }

    return findings;
  }
};
