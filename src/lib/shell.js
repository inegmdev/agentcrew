const { execSync, spawnSync } = require('child_process');

/**
 * Returns true if `bin` resolves on PATH.
 */
function which(bin) {
  try {
    execSync(`command -v ${bin}`, { stdio: 'ignore', shell: '/bin/bash' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs a command with inherited stdio (so interactive prompts from the
 * child process, like `guild init`, work normally). Throws on non-zero exit.
 */
function run(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(' ')}`);
  }
  return result;
}

/**
 * Runs a command and captures stdout, without showing it live. Returns
 * trimmed stdout. Throws on non-zero exit unless allowFailure is set.
 */
function runCaptured(cmd, args, opts = {}) {
  const result = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (result.status !== 0 && !opts.allowFailure) {
    throw new Error(`Command failed (${result.status}): ${cmd} ${args.join(' ')}\n${result.stderr}`);
  }
  return (result.stdout || '').trim();
}

module.exports = { which, run, runCaptured };
