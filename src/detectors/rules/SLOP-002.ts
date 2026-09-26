import { Detector, DetectorContext } from '../types.js';
import { RawFinding } from '../../findings/types.js';

export const slop002: Detector = {
  id: 'SLOP-002',
  name: 'repeated-boilerplate',
  category: 'Slop',
  severity: 'LOW',
  ruleClass: 'HEURISTIC',
  description: 'Detects tautological echo comments that restate the code line verbatim without domain context.',

  async run(context: DetectorContext): Promise<RawFinding[]> {
    const findings: RawFinding[] = [];

    for (const file of context.files) {
      if (!file.path.endsWith('.ts') && !file.path.endsWith('.js') && !file.path.endsWith('.py')) {
        continue;
      }

      for (let i = 0; i < file.lines.length - 1; i++) {
        const line = file.lines[i].trim();
        const nextLine = file.lines[i + 1].trim();

        if (line.startsWith('//') || line.startsWith('#')) {
          const commentText = line.replace(/^[/#\s]+/, '').toLowerCase().trim();

          // Patterns like: "return the user" before "return user;"
          if (
            (commentText.includes('return') && nextLine.startsWith('return')) ||
            (commentText.includes('set') && nextLine.includes('=')) ||
            (commentText.includes('get') && nextLine.includes('get')) ||
            (commentText.includes('call') && nextLine.includes('('))
          ) {
            // Check if comment tokens are a subset of the next line's identifiers
            const words = commentText.split(/\s+/).filter(w => w.length > 2 && !['the', 'and', 'for', 'from'].includes(w));
            const nextLower = nextLine.toLowerCase();
            const matchingWords = words.filter(w => nextLower.includes(w));

            if (words.length > 0 && matchingWords.length === words.length) {
              findings.push({
                ruleId: 'SLOP-002',
                category: 'Slop',
                title: 'Tautological echo comment',
                message: `Comment '${line}' verbatim restates the following code '${nextLine}' without explaining the operational rationale (the "why").`,
                filePath: file.path,
                line: i + 1,
                evidence: `${line}\n${nextLine}`,
                confidence: 'HIGH',
                impact: 'LOW',
                suggestedFix: 'Remove the echo comment or explain the non-obvious business reason why this is done.'
              });
            }
          }
        }
      }
    }

    return findings;
  }
};
