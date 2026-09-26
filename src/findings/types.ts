import { createHash } from 'node:crypto';

export type Category =
  | 'Architecture'
  | 'Security'
  | 'Database'
  | 'CodeQuality'
  | 'Testing'
  | 'Slop';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Impact = Severity;

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type Attribution =
  | 'BASELINE'
  | 'NEW'
  | 'MODIFIED'
  | 'RESOLVED'
  | 'UNKNOWN';

export type BaselineStatus = Attribution;

export type Disposition = 'BLOCK' | 'FIX' | 'REVIEW' | 'IGNORE' | 'SHIP';

/**
 * Structured, physical evidence contract for a finding.
 * Contains the exact file, line boundaries, code snippet, and cryptographic hash.
 */
export interface EIEvidence {
  file: string;
  line: number;
  lineEnd?: number;
  snippet: string;
  hash: string;
  toString?: () => string;
}

/**
 * The Canonical Internal Finding Contract of Engineering Intelligence.
 *
 * Serves as the stable interface between deterministic analysis, baseline attribution,
 * project context, and LLM reasoning layers.
 *
 * NOTE ON CONSERVATIVE COMPLETENESS:
 * A finding means: "EI found concrete evidence matching this rule."
 * It does NOT mean: "EI proved that no other instance exists."
 * Deterministic detection provides grounded evidence, not formal proofs of absence.
 */
export interface EIFinding {
  id: string;
  ruleId: string;
  category: Category;
  severity: Severity;
  title: string;
  message: string;

  evidence: EIEvidence;
  attribution: Attribution;
  confidence: Confidence;
  impact: Impact;
  disposition: Disposition;

  suggestedFix?: string;
  firstSeen: string;
  lastVerified: string;

  // Flattened convenience properties for backward compatibility
  filePath: string;
  line: number;
  lineEnd?: number;
  evidenceHash: string;
  baselineStatus: Attribution;
}

// Backward-compatible type alias
export type Finding = EIFinding;

export interface RawFinding {
  ruleId: string;
  category: Category;
  title: string;
  message: string;
  filePath: string;
  line: number;
  lineEnd?: number;
  evidence: string;
  confidence: Confidence;
  impact: Severity;
  suggestedFix?: string;
}

export function computeEvidenceHash(ruleId: string, filePath: string, evidence: string): string {
  const normalized = evidence.replace(/\s+/g, ' ').trim();
  return createHash('sha256')
    .update(`${ruleId}:${filePath}:${normalized}`)
    .digest('hex')
    .slice(0, 16);
}

export function rawToFinding(raw: RawFinding, attribution: Attribution = 'NEW'): EIFinding {
  const hash = computeEvidenceHash(raw.ruleId, raw.filePath, raw.evidence);
  const now = new Date().toISOString();

  // Mechanically derive initial disposition based on impact and confidence
  let disposition: Disposition = 'REVIEW';
  if (raw.impact === 'CRITICAL') {
    disposition = 'BLOCK';
  } else if (raw.impact === 'HIGH') {
    disposition = 'FIX';
  } else if (raw.impact === 'LOW') {
    disposition = 'IGNORE';
  }

  const structuredEvidence: EIEvidence = {
    file: raw.filePath,
    line: raw.line,
    lineEnd: raw.lineEnd || raw.line,
    snippet: raw.evidence,
    hash,
    toString: () => raw.evidence
  };

  return {
    id: `${raw.ruleId}-${hash}`,
    ruleId: raw.ruleId,
    category: raw.category,
    severity: raw.impact,
    title: raw.title,
    message: raw.message,
    evidence: structuredEvidence,
    attribution,
    confidence: raw.confidence,
    impact: raw.impact,
    disposition,
    firstSeen: now,
    lastVerified: now,
    suggestedFix: raw.suggestedFix,

    // Flattened aliases
    filePath: raw.filePath,
    line: raw.line,
    lineEnd: raw.lineEnd || raw.line,
    evidenceHash: hash,
    baselineStatus: attribution
  };
}
