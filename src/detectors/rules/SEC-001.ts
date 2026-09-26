import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

// Exact known credential signatures (Tier 1: CERTAIN, HIGH confidence, CRITICAL)
const EXACT_SECRET_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: 'AWS Access Key ID',
    regex: /\b(AKIA[0-9A-Z]{16})\b/
  },
  {
    name: 'Stripe Live Secret Key',
    regex: /\b(sk_live_[0-9a-zA-Z]{24,})\b/
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /\b(ghp_[0-9a-zA-Z]{36}|github_pat_[0-9a-zA-Z_]{82})\b/
  },
  {
    name: 'OpenAI Secret Key',
    regex: /\b(sk-[a-zA-Z0-9]{20}T3BlbkFJ[a-zA-Z0-9]{20})\b/
  },
  {
    name: 'Slack Bot Token',
    regex: /\b(xoxb-[0-9]{11,13}-[0-9]{11,13}-[a-zA-Z0-9]{24})\b/
  },
  {
    name: 'RSA/EC Private Key Header',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/
  }
];

// Placeholders, dummy values, and test fixtures that must NOT be flagged
const NON_SECRET_PLACEHOLDERS = [
  'YOUR_API_KEY',
  'YOUR_KEY',
  'YOUR_SECRET',
  'EXAMPLE-KEY',
  'TEST-SECRET',
  'CHANGEME',
  'DUMMY',
  'PLACEHOLDER',
  'SK_TEST_',
  'TEST_TOKEN',
  'FAKE_KEY',
  'FAKE_SECRET',
  '00000000',
  '12345678',
  'INSERT_'
];

function isKnownPlaceholder(text: string): boolean {
  const upper = text.toUpperCase();
  return NON_SECRET_PLACEHOLDERS.some(p => upper.includes(p));
}

export const sec001: Detector = {
  id: 'SEC-001',
  name: 'hardcoded-secret',
  category: 'Security',
  severity: 'CRITICAL',
  ruleClass: 'CERTAIN',
  description: 'Detects hardcoded secrets, private keys, and high-entropy authentication tokens with confidence tiering.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      const lower = file.path.toLowerCase();
      // Skip test, fixture, documentation, lock, and example files unless targeted directly
      const isTargetedFixture = Boolean(context.targetPath && file.path.includes(context.targetPath));
      if (!isTargetedFixture) {
        if (
          lower.includes('/tests/') ||
          lower.includes('/fixtures/') ||
          lower.includes('/docs/') ||
          lower.includes('/skills/') ||
          lower.endsWith('.test.ts') ||
          lower.endsWith('.test.js') ||
          lower.endsWith('.spec.ts') ||
          lower.endsWith('.spec.js') ||
          lower.endsWith('.md') ||
          lower.endsWith('.example') ||
          lower.endsWith('.sample') ||
          lower.includes('package-lock.json') ||
          lower.includes('node_modules/')
        ) {
          continue;
        }
      }

      for (let i = 0; i < file.lines.length; i++) {
        const line = file.lines[i];
        const trimmed = line.trim();

        // Skip comment lines in detector rules or general code
        if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
          continue;
        }

        // Tier 0: Ignore explicit placeholders and test values
        if (isKnownPlaceholder(trimmed)) {
          continue;
        }

        // Tier 1: Exact known credential formats (CERTAIN / HIGH / CRITICAL / BLOCK)
        let exactMatched = false;
        for (const pattern of EXACT_SECRET_PATTERNS) {
          const match = line.match(pattern.regex);
          if (match) {
            findings.push({
              ruleId: 'SEC-001',
              category: 'Security',
              title: `Hardcoded ${pattern.name} detected`,
              message: `High-confidence plaintext secret token (${pattern.name}) committed directly in source code. Credentials must be injected via environment variables or secret manager.`,
              filePath: file.path,
              line: i + 1,
              evidence: line.trim().replace(match[1] || match[0], '***REDACTED***'),
              confidence: 'HIGH',
              impact: 'CRITICAL',
              disposition: 'BLOCK',
              ruleClass: 'CERTAIN',
              suggestedFix: 'Move secret into .env or runtime secrets manager (e.g., process.env.SECRET_KEY).'
            });
            exactMatched = true;
            break;
          }
        }

        if (exactMatched) continue;

        // Tier 2: Generic high-entropy credential assignments (PROBABLE / MEDIUM / HIGH / REVIEW)
        // Matches: const apiKey = "...", const client_secret = "..." with 32+ char hex/base64 strings
        const genericSecretMatch = line.match(
          /(?:api[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token|private[_-]?key)\s*[:=]\s*["']([A-Za-z0-9+/=_-]{32,})["']/i
        );

        if (genericSecretMatch) {
          const token = genericSecretMatch[1];
          // Exclude UUIDs, repeated characters, or obvious test patterns
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
          const hasEntropy = new Set(token).size >= 12;

          if (!isUuid && hasEntropy && !isKnownPlaceholder(token)) {
            findings.push({
              ruleId: 'SEC-001',
              category: 'Security',
              title: 'Generic high-entropy secret assignment detected',
              message:
                'Suspicious high-entropy string assigned to sensitive variable name. Verify whether this is a static credential that should be externalized.',
              filePath: file.path,
              line: i + 1,
              evidence: line.trim().replace(token, '***REDACTED***'),
              confidence: 'MEDIUM',
              impact: 'HIGH',
              disposition: 'REVIEW',
              ruleClass: 'PROBABLE',
              suggestedFix: 'Verify variable source; if sensitive, move to environment variable or secrets vault.'
            });
          }
        }
      }
    }

    return findings;
  }
};
