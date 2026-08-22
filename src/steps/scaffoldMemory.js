const fs = require('fs');
const path = require('path');
const { markTool } = require('../lib/state');
const { memoryPaths, addArchiveLink, ARCHIVE_DIR } = require('../lib/memory');

const TEMPLATES = path.join(__dirname, '..', '..', 'templates');
const LONG_TERM_TEMPLATE = path.join(TEMPLATES, 'MEMORY.template.md');
const SHORT_TERM_TEMPLATE = path.join(TEMPLATES, 'MEMORY_SHORTTERM.template.md');
const ARCHIVE_README_TEMPLATE = path.join(TEMPLATES, 'ARCHIVED.readme.md');

const LEGACY_LOG = /^(\d{4})-(\d{2})-(\d{2})\.md$/;

/**
 * Creates the memory layer in the target project: everything lives under
 * docs/memory/ — the long-term MEMORY.md, the short-term MEMORY_SHORTTERM.md,
 * and archived/ for retired logs.
 *
 * Never overwrites an existing MEMORY.md — by the time this re-runs, the file
 * is the project's accumulated knowledge and clobbering it would be the single
 * most destructive thing this wizard could do. The same holds for the
 * short-term log and anything already archived.
 */
function scaffoldMemory(projectPath) {
  console.log('\n[4/6] Scaffolding the memory layer…');

  const paths = memoryPaths(projectPath);

  fs.mkdirSync(paths.dir, { recursive: true });
  fs.mkdirSync(paths.archiveDir, { recursive: true });

  scaffoldLongTerm(paths);
  moveLegacyProposal(paths);
  scaffoldShortTerm(paths);
  scaffoldArchiveReadme(paths);
  migrateLegacyLogs(paths);

  markTool('memoryLayer', { scaffolded: true });
}

function scaffoldLongTerm(paths) {
  if (fs.existsSync(paths.longTerm)) {
    console.log('  docs/memory/MEMORY.md exists — left untouched.');
    return;
  }

  // Pre-0.5 repos keep long-term memory at docs/MEMORY.md. Moving it is the
  // whole migration: the file is the project's accumulated knowledge, and
  // leaving it behind would strand it somewhere nothing reads any more.
  if (fs.existsSync(paths.legacyLongTerm)) {
    fs.renameSync(paths.legacyLongTerm, paths.longTerm);
    console.log('  Moved docs/MEMORY.md → docs/memory/MEMORY.md.');
    return;
  }

  fs.copyFileSync(LONG_TERM_TEMPLATE, paths.longTerm);
  console.log('  Created docs/memory/MEMORY.md from template.');
}

/**
 * A pending consolidation proposal is waiting on a human, so it moves with the
 * file it is a proposal for rather than being left behind unreviewed.
 */
function moveLegacyProposal(paths) {
  if (!fs.existsSync(paths.legacyProposal) || fs.existsSync(paths.proposal)) return;

  fs.renameSync(paths.legacyProposal, paths.proposal);
  console.log('  Moved docs/MEMORY.proposed.md → docs/memory/MEMORY.proposed.md.');
}

function scaffoldShortTerm(paths) {
  if (fs.existsSync(paths.shortTerm)) {
    console.log('  docs/memory/MEMORY_SHORTTERM.md exists — left untouched.');
    return;
  }

  fs.copyFileSync(SHORT_TERM_TEMPLATE, paths.shortTerm);
  console.log('  Created docs/memory/MEMORY_SHORTTERM.md from template.');
}

function scaffoldArchiveReadme(paths) {
  const readme = path.join(paths.archiveDir, 'README.md');
  if (fs.existsSync(readme)) return;

  fs.copyFileSync(ARCHIVE_README_TEMPLATE, readme);
  console.log(`  Created ${ARCHIVE_DIR}/ with README.`);
}

/**
 * Migrates pre-0.5 `memory/YYYY-MM-DD.md` logs into the archive.
 *
 * They are archived rather than folded into the new short-term file, because
 * that is exactly what the archiving policy would have done with them: they
 * are past sessions, kept whole and linked, not active context to reload.
 * Nothing is deleted here — every log is moved, and the index links it.
 */
function migrateLegacyLogs(paths) {
  if (!fs.existsSync(paths.legacyLogDir)) return;

  const entries = fs.readdirSync(paths.legacyLogDir);
  const logs = entries.filter((name) => LEGACY_LOG.test(name)).sort();
  if (logs.length === 0) return;

  let shortTerm = fs.readFileSync(paths.shortTerm, 'utf8');

  for (const log of logs) {
    const [, year, month, day] = log.match(LEGACY_LOG);
    const archived = `session_${year}_${month}_${day}.md`;
    const target = path.join(paths.archiveDir, archived);

    if (fs.existsSync(target)) {
      console.log(`  ${ARCHIVE_DIR}/${archived} exists — left untouched.`);
      continue;
    }

    fs.renameSync(path.join(paths.legacyLogDir, log), target);
    shortTerm = addArchiveLink(shortTerm, `- [${year}-${month}-${day}](archived/${archived})`);
  }

  fs.writeFileSync(paths.shortTerm, shortTerm);
  console.log(`  Archived ${logs.length} legacy memory/ log(s) and indexed them.`);

  // The old directory's README described a layout that no longer exists, so
  // it goes with the logs. Anything else in there is someone's, and stays.
  const left = fs.readdirSync(paths.legacyLogDir);
  if (left.length === 1 && left[0] === 'README.md') {
    fs.rmSync(path.join(paths.legacyLogDir, 'README.md'));
  }
  if (fs.readdirSync(paths.legacyLogDir).length === 0) {
    fs.rmdirSync(paths.legacyLogDir);
    console.log('  Removed the empty memory/ directory (git still has it).');
  } else {
    console.log('  memory/ still has files that are not daily logs — left in place.');
  }
}

module.exports = { scaffoldMemory };
