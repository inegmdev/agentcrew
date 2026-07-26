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
 * CreateProcess cannot execute directly — they need a shell.
 */
function spawnOptions(opts) {
  return IS_WINDOWS ? { shell: true, ...opts } : opts;
}

/**
 * Makes arguments safe to hand to cmd.exe.
 *
 * Once `shell: true` is set, cmd.exe parses the command line and treats
 * `& | < > ( ) ^` as control characters — so an argument like `foo&whoami`
 * would chain a second command rather than being passed through as text.
 * Inside a double-quoted region cmd treats all of them as literals, so every
 * argument is quoted unconditionally and any embedded quote is doubled (the
 * cmd.exe escape) to stop it terminating the region early.
 *
 * `%VAR%` expansion still happens inside quotes, which is why callers must not
 * pass unsanitised input — see sanitizeProjectName in steps/installBacklog.js.
 */
function quoteArgs(args) {
  if (!IS_WINDOWS) return args;
  return args.map((arg) => `"${String(arg).replace(/"/g, '""')}"`);
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

  // A spawn failure (missing binary, no permission) leaves status null, so it
  // has to be checked before allowFailure — that option is for commands that
  // ran and exited non-zero, not for ones that never started.
  if (result.error) {
    throw new Error(`Could not run ${cmd}: ${result.error.message}`);
  }
  if (result.status !== 0 && !opts.allowFailure) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(' ')}\n${result.stderr}`);
  }
  return (result.stdout || '').trim();
}

module.exports = { which, run, runCaptured, quoteArgs, IS_WINDOWS };
