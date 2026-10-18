const { which } = require('../lib/shell');

/**
 * Adapter for Gemini CLI satisfying the ProviderPlugin interface (TRD §5).
 */
class GeminiAdapter {
  constructor(opts = {}) {
    this.command = opts.command || 'gemini';
    this.manifest = {
      id: 'gemini',
      contract_version: 1,
      implementation_version: '1.0.0',
    };
  }

  async probe(context = {}) {
    const resolve = context.which || which;
    const isPresent = Boolean(resolve(this.command));
    return {
      id: 'gemini',
      contract_version: 1,
      available: isPresent,
      reason: isPresent ? null : `Runner '${this.command}' was not found on PATH`,
      capabilities: [
        'stream_messages',
        'send_followup',
        'interrupt_turn',
        'tool_events',
        'permission_decisions',
        'disable_native_delegation',
      ],
    };
  }

  buildSpawnArgs({ cwd, sessionId, model } = {}) {
    const args = [
      '-p',
      '--output-format',
      'stream-json',
      '--disable-delegation',
    ];

    if (model) {
      args.push('--model', model);
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

module.exports = { GeminiAdapter };
