import { createHash } from 'node:crypto';

export type Category =
  | 'Architecture'
  | 'Security'
  | 'Database'
  | 'CodeQuality'
  | 'Testing'
  | 'Slop';

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type Confidence = 'HIGH' | 'MEDIUM' | 'LOW';

export type BaselineStatus = 'BASELINE' | 'NEW' | 'MODIFIED' | 'RESOLVED';

export type Disposition = 'BLOCK' | 'FIX' | 'REVIEW' | 'IGNORE' | 'SHIP';

export interface Finding {
  id: string;
  ruleId: string;
  category: Category;
  title: string;
  message: string;
  filePath: string;
  line: number;
  lineEnd?: number;
  evidence: string;
  evidenceHash: string;
  baselineStatus: BaselineStatus;
  confidence: Confidence;
  impact: Severity;
  disposition: Disposition;
  firstSeen: string;
  lastVerified: string;
  suggestedFix?: string;
}

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

export function rawToFinding(raw: RawFinding, baselineStatus: BaselineStatus = 'NEW'): Finding {
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

  return {
    id: `${raw.ruleId}-${hash}`,
    ruleId: raw.ruleId,
    category: raw.category,
    title: raw.title,
    message: raw.message,
    filePath: raw.filePath,
    line: raw.line,
    lineEnd: raw.lineEnd || raw.line,
    evidence: raw.evidence,
    evidenceHash: hash,
    baselineStatus,
    confidence: raw.confidence,
    impact: raw.impact,
    disposition,
    firstSeen: now,
    lastVerified: now,
    suggestedFix: raw.suggestedFix
  };
}
