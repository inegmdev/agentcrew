const fs = require('fs');
const path = require('path');
const { run, runCaptured } = require('../lib/shell');
const { markTool } = require('../lib/state');

// Statuses we want on every board. "Needs Attention" is the one Vibe Kanban
// habit worth keeping: a single column that means "an agent stopped and wants
// you", whether it finished or got stuck.
const STATUSES = ['To Do', 'In Progress', 'Needs Attention', 'Done'];

/**
 * Installs the Backlog.md CLI globally and initialises it inside the target
 * project. Both halves are safe to re-run: npm install -g upgrades in place,
 * and `backlog init` rewrites its own marker-delimited block in the agent
 * instruction files rather than appending a second copy.
 */
function installBacklog(projectPath) {
  console.log('\n[3/6] Installing Backlog.md (board + tasks-as-markdown)…');

  run('npm', ['install', '-g', 'backlog.md']);

  const version = runCaptured('backlog', ['--version'], { allowFailure: true });
  console.log(`  Backlog.md CLI: ${version || 'installed'}`);

  const alreadyInit = fs.existsSync(path.join(projectPath, 'backlog', 'config.yml'));

  if (alreadyInit) {
    console.log('  backlog/ already initialised here — leaving its config alone.');
  } else {
    // Everything is passed explicitly so init never drops into its interactive
    // wizard: `agentcrew update` has to run unattended across every project.
    run(
      'backlog',
      [
        'init',
        path.basename(projectPath),
        '--agent-instructions',
        'claude,agents,gemini',
        '--integration-mode',
        'cli',
        '--check-branches',
        'false',
        '--include-remote',
        'false',
        '--auto-open-browser',
        'false',
      ],
      { cwd: projectPath }
    );
    console.log('  Initialised backlog/ and wrote CLAUDE.md, AGENTS.md, GEMINI.md.');
  }

  ensureStatuses(projectPath);

  markTool('backlogMd', { installed: true, version: version || null });
}

/**
 * Adds our statuses to backlog/config.yml if they aren't there yet.
 *
 * Deliberately a targeted line rewrite rather than a YAML round-trip: the
 * config carries comments and ordering that a naive parse-and-dump would
 * flatten, and this is the only key we care about.
 */
function ensureStatuses(projectPath) {
  const configPath = path.join(projectPath, 'backlog', 'config.yml');
  if (!fs.existsSync(configPath)) return;

  const original = fs.readFileSync(configPath, 'utf8');
  const desired = `statuses: [${STATUSES.map((s) => `"${s}"`).join(', ')}]`;

  if (original.includes('"Needs Attention"')) {
    console.log('  Statuses already include "Needs Attention".');
    return;
  }

  const updated = original.replace(/^statuses:.*$/m, desired);

  if (updated === original) {
    console.log('  Could not find a statuses: line to update — leaving config untouched.');
    return;
  }

  fs.writeFileSync(configPath, updated);
  console.log(`  Statuses set to: ${STATUSES.join(' → ')}`);
}

module.exports = { installBacklog, ensureStatuses, STATUSES };
