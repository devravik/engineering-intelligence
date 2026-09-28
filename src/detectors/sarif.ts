import { DetectionResult } from './types.js';
import { Severity } from '../findings/types.js';

export function formatSarif(result: DetectionResult): string {
  const sarifLevel = (severity: Severity): 'error' | 'warning' | 'note' => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return 'error';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
      default:
        return 'note';
    }
  };

  const rulesMap = new Map<string, { id: string; name: string; shortDescription: { text: string } }>();

  for (const f of result.findings) {
    if (!rulesMap.has(f.ruleId)) {
      rulesMap.set(f.ruleId, {
        id: f.ruleId,
        name: f.title,
        shortDescription: { text: f.message || f.title }
      });
    }
  }

  const sarifResults = result.findings.map(f => ({
    ruleId: f.ruleId,
    level: sarifLevel(f.impact),
    message: {
      text: `${f.title}: ${f.message}`
    },
    locations: [
      {
        physicalLocation: {
          artifactLocation: {
            uri: f.filePath
          },
          region: {
            startLine: f.line,
            endLine: f.lineEnd || f.line
          }
        }
      }
    ],
    properties: {
      evidenceHash: f.evidenceHash,
      baselineStatus: f.baselineStatus,
      confidence: f.confidence,
      disposition: f.disposition,
      suggestedFix: f.suggestedFix
    }
  }));

  const sarifReport = {
    $schema: 'https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json',
    version: '2.1.0',
    runs: [
      {
        tool: {
          driver: {
            name: 'Engineering Intelligence',
            version: '0.1.3',
            informationUri: 'https://github.com/devravik/engineering-intelligence',
            rules: Array.from(rulesMap.values())
          }
        },
        results: sarifResults
      }
    ]
  };

  return JSON.stringify(sarifReport, null, 2);
}
