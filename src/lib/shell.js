const { spawnSync } = require('child_process');

const IS_WINDOWS = process.platform === 'win32';

/**
 * Returns true if `bin` resolves on PATH.
 *
 * Spawned directly rather than through a shell so this works on Windows too —
 * `command -v` is a POSIX shell builtin and has no equivalent there.
 */
function which(bin) {
  const finder = IS_WINDOWS ? 'where' : 'which';
  const result = spawnSync(finder, [bin], { stdio: 'ignore' });
  return result.status === 0;
}

/**
 * On Windows the commands we invoke (`npm`, `backlog`) are .cmd shims, which
 * CreateProcess cannot execute directly — they need a shell. Once a shell is
 * involved, arguments containing spaces have to be quoted by hand, because
 * Node stops doing it for us.
 */
function spawnOptions(opts) {
  return IS_WINDOWS ? { shell: true, ...opts } : opts;
}

function quoteArgs(args) {
  if (!IS_WINDOWS) return args;
  return args.map((arg) => (/\s/.test(arg) ? `"${arg}"` : arg));
}

/**
 * Runs a command with inherited stdio, so anything interactive the child does
 * still reaches the user. Throws on non-zero exit.
 */
function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, quoteArgs(args), spawnOptions({ stdio: 'inherit', ...opts }));
  if (result.error) {
    throw new Error(`Could not run ${cmd}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(' ')}`);
  }
  return result;
}

/**
 * Runs a command and captures stdout without showing it live. Returns trimmed
 * stdout. Throws on non-zero exit unless allowFailure is set.
 */
function runCaptured(cmd, args, opts = {}) {
  const result = spawnSync(cmd, quoteArgs(args), spawnOptions({ encoding: 'utf8', ...opts }));
  if (result.status !== 0 && !opts.allowFailure) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(' ')}\n${result.stderr}`);
  }
  return (result.stdout || '').trim();
}

module.exports = { which, run, runCaptured, IS_WINDOWS };
