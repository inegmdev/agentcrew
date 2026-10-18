const { which } = require('../lib/shell');

/**
 * Adapter for Antigravity CLI (agy) satisfying the ProviderPlugin interface (TRD §5).
 */
class AgyAdapter {
  constructor(opts = {}) {
    this.command = opts.command || 'agy';
    this.manifest = {
      id: 'agy',
      contract_version: 1,
      implementation_version: '1.0.0',
    };
  }

  async probe(context = {}) {
    const resolve = context.which || which;
    const isPresent = Boolean(resolve(this.command));
    return {
      id: 'agy',
      contract_version: 1,
      available: isPresent,
      reason: isPresent ? null : `Runner '${this.command}' was not found on PATH`,
      capabilities: [
        'stream_messages',
        'send_followup',
        'native_resume',
        'interrupt_turn',
        'tool_events',
        'permission_decisions',
        'disable_native_delegation',
      ],
    };
  }

  buildSpawnArgs({ cwd, sessionId, resumeFrom, model } = {}) {
    const args = [
      '-p',
      '--input-format',
      'stream-json',
      '--output-format',
      'stream-json',
      '--disable-slash-commands',
    ];

    if (model) {
      args.push('--model', model);
    }

    if (resumeFrom) {
      args.push('--conversation', resumeFrom);
    }

    return args;
  }

  parseStreamEvent(rawLine) {
    if (!rawLine || !rawLine.trim()) return null;
    try {
      return JSON.parse(rawLine.trim());
    } catch {
      return { type: 'raw.output', text: rawLine };
    }
  }
}

module.exports = { AgyAdapter };
