const fs = require('fs');
const path = require('path');
const { run, runCaptured } = require('../lib/shell');
const { markTool } = require('../lib/state');

// The status the wizard guarantees exists. It's the one Vibe Kanban habit
// worth keeping: a single column meaning "an agent stopped and wants you",
// whether it finished or got stuck.
const REQUIRED_STATUS = 'Needs Attention';

// Pinned to the major version the setup flags were validated against, while
// still taking patches and minors. An exact pin would freeze every project on
// one release forever, which defeats `agentcrew update`; an unbounded install
// would let a future 2.x silently change the init flags this step depends on.
const BACKLOG_PKG = 'backlog.md@^1.48.0';

/**
 * Strips anything that isn't plainly safe in a project name.
 *
 * This value reaches a command line, and on Windows that command line is
 * parsed by cmd.exe. Quoting in lib/shell.js stops metacharacters chaining
 * commands, but `%VAR%` still expands inside quotes, so the untrusted part —
 * a directory name — is reduced to a harmless charset here as well. The name
 * is cosmetic (it's the board's title), so nothing is lost by being strict.
 */
function sanitizeProjectName(name) {
  const cleaned = name.replace(/[^A-Za-z0-9 ._-]/g, '').trim();
  return cleaned || 'project';
}

/**
 * Installs the Backlog.md CLI globally and initialises it inside the target
 * project. Both halves are safe to re-run: npm install -g upgrades in place,
 * and `backlog init` rewrites its own marker-delimited block in the agent
 * instruction files rather than appending a second copy.
 */
function installBacklog(projectPath) {
  console.log('\n[3/6] Installing Backlog.md (board + tasks-as-markdown)…');

  run('npm', ['install', '-g', BACKLOG_PKG]);

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
        sanitizeProjectName(path.basename(projectPath)),
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
 * Ensures "Needs Attention" is among the board's statuses, without disturbing
 * any the project already defines.
 *
 * Handles both YAML spellings Backlog.md accepts — inline (`statuses: [a, b]`)
 * and block (`statuses:` followed by `  - a`) — because rewriting only the
 * `statuses:` line would leave a block list's entries orphaned below it and
 * corrupt the file.
 */
function ensureStatuses(projectPath) {
  const configPath = path.join(projectPath, 'backlog', 'config.yml');
  if (!fs.existsSync(configPath)) return;

  const original = fs.readFileSync(configPath, 'utf8');
  const parsed = readStatuses(original);

  if (!parsed) {
    console.log('  No statuses: key found — leaving config untouched.');
    return;
  }

  if (parsed.statuses.some((s) => s.toLowerCase() === REQUIRED_STATUS.toLowerCase())) {
    console.log(`  Statuses already include "${REQUIRED_STATUS}".`);
    return;
  }

  const merged = withRequiredStatus(parsed.statuses);
  const rendered = `statuses: [${merged.map((s) => `"${s}"`).join(', ')}]`;

  const lines = original.split('\n');
  lines.splice(parsed.startLine, parsed.lineCount, rendered);
  fs.writeFileSync(configPath, lines.join('\n'));

  console.log(`  Statuses: ${merged.join(' → ')}`);
}

/**
 * Finds the statuses key and returns its values plus the line range it
 * occupies, so the caller can replace exactly that span. Returns null when
 * there is no statuses key at all.
 */
function readStatuses(content) {
  const lines = content.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const inline = lines[i].match(/^statuses:\s*\[(.*)\]\s*$/);
    if (inline) {
      return { statuses: splitInline(inline[1]), startLine: i, lineCount: 1 };
    }

    if (/^statuses:\s*$/.test(lines[i])) {
      const statuses = [];
      let j = i + 1;
      for (; j < lines.length; j++) {
        const item = lines[j].match(/^\s+-\s*(.+?)\s*$/);
        if (!item) break;
        statuses.push(stripQuotes(item[1]));
      }
      return { statuses, startLine: i, lineCount: j - i };
    }
  }

  return null;
}

function splitInline(inner) {
  const values = [];
  const token = /"([^"]*)"|'([^']*)'|([^,]+)/g;
  let match;
  while ((match = token.exec(inner)) !== null) {
    // The bare-token branch can pick up a quoted value whole when it starts
    // mid-whitespace, so quotes are stripped from every branch rather than
    // trusting the alternation to have split them off.
    const value = stripQuotes((match[1] ?? match[2] ?? match[3] ?? '').trim());
    if (value) values.push(value);
  }
  return values;
}

function stripQuotes(value) {
  return value.replace(/^["'](.*)["']$/, '$1');
}

/**
 * Inserts the required status just before the terminal one, so a board reads
 * left-to-right in the order work actually moves. Falls back to appending.
 */
function withRequiredStatus(statuses) {
  const doneIdx = statuses.findIndex((s) => s.toLowerCase() === 'done');
  if (doneIdx === -1) return [...statuses, REQUIRED_STATUS];
  return [...statuses.slice(0, doneIdx), REQUIRED_STATUS, ...statuses.slice(doneIdx)];
}

module.exports = {
  installBacklog,
  ensureStatuses,
  readStatuses,
  withRequiredStatus,
  sanitizeProjectName,
  REQUIRED_STATUS,
};
