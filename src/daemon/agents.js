const { which } = require('../lib/shell');

/**
 * How to invoke each agent CLI non-interactively.
 *
 * `verified` records whether the invocation was actually run, not just read
 * about. Only Claude Code's `-p/--print` has been confirmed first-hand; the
 * rest are best-effort defaults from each tool's documented interface and are
 * marked accordingly, because shipping unverified flags as if they were facts
 * is the mistake that produced this project's last rewrite.
 *
 * Any entry can be overridden per-machine — see resolveAgent — so a wrong
 * default is a config change, not a code change.
 */
const HEADLESS = {
  claude: { flag: '-p', verified: true },
  gemini: { flag: '-p', verified: false },
  kimi: { flag: '-p', verified: false },
  codex: { flag: 'exec', verified: false },
  'cursor-agent': { flag: '-p', verified: false },
};

// Order matters: the first available wins when nothing is configured.
const PREFERENCE = ['claude', 'kimi', 'gemini', 'codex', 'cursor-agent'];

/**
 * Picks the agent CLI to run background work with.
 *
 * `override` comes from the daemon config and takes precedence, so a machine
 * that only has Gemini (or a CLI whose flags differ from the defaults above)
 * can be pointed at the right thing without touching this file.
 */
function resolveAgent(override) {
  if (override) {
    const spec = HEADLESS[override.bin] || {};
    return {
      bin: override.bin,
      flag: override.flag || spec.flag,
      verified: false,
      source: 'config',
    };
  }

  for (const bin of PREFERENCE) {
    if (which(bin)) {
      return { bin, ...HEADLESS[bin], source: 'detected' };
    }
  }

  return null;
}

/**
 * Builds the argv for a one-shot, non-interactive run.
 */
function headlessArgs(agent, prompt) {
  return [agent.flag, prompt];
}

module.exports = { resolveAgent, headlessArgs, HEADLESS, PREFERENCE };
