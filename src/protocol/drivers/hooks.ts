import { GeneratedArtifact } from '../types.js';

export interface HooksDriverOptions {
  targetPath: string;
  postToolMatcher?: string[];
  detectTimeout?: number;
  reviewTimeout?: number;
}

export class HooksDriver {
  static generate(options: HooksDriverOptions): GeneratedArtifact {
    const {
      targetPath,
      postToolMatcher = ['replace_file_content', 'write_to_file'],
      detectTimeout = 15,
      reviewTimeout = 20
    } = options;

    const postToolHooks = postToolMatcher.map(matcher => ({
      matcher,
      hooks: [
        {
          type: 'command',
          command: 'ei detect --changed',
          timeout: detectTimeout
        }
      ]
    }));

    const config = {
      'ei-quality-guard': {
        enabled: true,
        PostToolUse: postToolHooks,
        Stop: [
          {
            type: 'command',
            command: 'ei review',
            timeout: reviewTimeout
          }
        ]
      }
    };

    return {
      relativePath: targetPath,
      content: JSON.stringify(config, null, 2),
      description: 'Lifecycle hooks for edit-time detection and session-time review verification',
      channel: 'hooks'
    };
  }

  static merge(existingContent: string, newContent: string): string {
    try {
      const existing = JSON.parse(existingContent);
      const incoming = JSON.parse(newContent);
      const merged = { ...existing, ...incoming };
      return JSON.stringify(merged, null, 2);
    } catch {
      return newContent;
    }
  }
}
