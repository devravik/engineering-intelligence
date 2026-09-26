import {
  RawFinding,
  EIFinding,
  Attribution,
  EIEvidence,
  computeEvidenceHash,
  rawToFinding
} from './types.js';

/**
 * FindingNormalizer:
 * Subsystem that converts raw detector output into the canonical EIFinding contract.
 *
 * Normalizes file paths (POSIX slashes, relative resolution), sanitizes line ranges,
 * calculates SHA-256 evidence hashes, formats evidence snippets, and establishes
 * initial attribution ('UNKNOWN' or 'NEW') before baseline reconciliation.
 */
export class FindingNormalizer {
  /**
   * Normalizes a single raw finding or partial finding into the canonical EIFinding contract.
   */
  static normalize(raw: RawFinding | Partial<EIFinding>, defaultAttribution: Attribution = 'NEW'): EIFinding {
    const rawRecord = raw as Record<string, unknown>;

    // 1. Sanitize file path to standard POSIX relative format
    const rawPath = String(rawRecord.filePath || (rawRecord.evidence as Record<string, unknown>)?.file || 'unknown');
    const normalizedFilePath = rawPath.replace(/\\/g, '/').replace(/^\.\//, '');

    // 2. Sanitize line boundaries
    const rawLine = Number(rawRecord.line || (rawRecord.evidence as Record<string, unknown>)?.line || 1);
    const line = Math.max(1, rawLine || 1);
    const rawLineEnd = Number(rawRecord.lineEnd || (rawRecord.evidence as Record<string, unknown>)?.lineEnd || line);
    const lineEnd = rawLineEnd >= line ? rawLineEnd : line;

    // 3. Extract snippet
    let snippet = '';
    if (typeof rawRecord.evidence === 'string') {
      snippet = rawRecord.evidence;
    } else if (rawRecord.evidence && typeof (rawRecord.evidence as Record<string, unknown>).snippet === 'string') {
      snippet = (rawRecord.evidence as Record<string, unknown>).snippet as string;
    }
    snippet = snippet.trim();

    // 4. Compute deterministic evidence hash
    const ruleId = String(rawRecord.ruleId || 'RULE-000');
    const existingHash = (rawRecord.evidence as Record<string, unknown>)?.hash || rawRecord.evidenceHash;
    const hash = typeof existingHash === 'string' && existingHash.length > 0
      ? existingHash
      : computeEvidenceHash(ruleId, normalizedFilePath, snippet);

    // 5. Construct canonical evidence contract
    const evidence: EIEvidence = {
      file: normalizedFilePath,
      line,
      lineEnd,
      snippet,
      hash,
      toString: () => snippet
    };

    // 6. Derive canonical attribution
    const attribution: Attribution =
      (rawRecord.attribution as Attribution) ||
      (rawRecord.baselineStatus as Attribution) ||
      defaultAttribution;

    // 7. Derive canonical impact and severity
    const impact = (rawRecord.impact || rawRecord.severity || 'MEDIUM') as EIFinding['impact'];
    const severity = impact;
    const confidence = (rawRecord.confidence || 'HIGH') as EIFinding['confidence'];

    // 8. Derive initial disposition
    let disposition: EIFinding['disposition'] = (rawRecord.disposition as EIFinding['disposition']) || 'REVIEW';
    if (!rawRecord.disposition) {
      if (impact === 'CRITICAL') {
        disposition = 'BLOCK';
      } else if (impact === 'HIGH') {
        disposition = 'FIX';
      } else if (impact === 'LOW') {
        disposition = 'IGNORE';
      }
    }

    const now = new Date().toISOString();

    return {
      id: `${ruleId}-${hash}`,
      ruleId,
      category: (rawRecord.category || 'CodeQuality') as EIFinding['category'],
      severity,
      title: String(rawRecord.title || ruleId),
      message: String(rawRecord.message || rawRecord.title || ''),
      evidence,
      attribution,
      confidence,
      impact,
      disposition,
      suggestedFix: typeof rawRecord.suggestedFix === 'string' ? rawRecord.suggestedFix : undefined,
      firstSeen: String(rawRecord.firstSeen || now),
      lastVerified: now,

      // Backward-compatible properties
      filePath: normalizedFilePath,
      line,
      lineEnd,
      evidenceHash: hash,
      baselineStatus: attribution
    };
  }

  /**
   * Batch-normalizes a collection of raw or partial findings.
   */
  static normalizeBatch(rawFindings: (RawFinding | EIFinding)[], defaultAttribution: Attribution = 'NEW'): EIFinding[] {
    return rawFindings.map(raw => this.normalize(raw, defaultAttribution));
  }
}
