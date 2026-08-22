const fs = require('fs');
const path = require('path');
const { memoryPaths, appendDayEntry } = require('../lib/memory');

const SHORT_TERM_HEADER = `# Short-term memory

Append-only working log. One \`## YYYY-MM-DD\` section per day, newest at the
bottom. Archive old sections into \`docs/memory/archived/\` rather than
deleting them.

## Archive index

<!-- One link per archived session, newest last. -->

## Active logs
`;

/**
 * Appends to the short-term memory log.
 *
 * This is the safe half of the memory layer: additive only, never rewritten,
 * and recoverable from git even if edited. Consolidation — the half that drops
 * things — is deliberately kept out of here, and so is archiving, which moves
 * old sections out to `docs/memory/archived/` under human or agent judgement.
 */
function appendToJournal(projectPath, line, now = new Date()) {
  const { dir, shortTerm } = memoryPaths(projectPath);

  fs.mkdirSync(dir, { recursive: true });

  const existing = fs.existsSync(shortTerm)
    ? fs.readFileSync(shortTerm, 'utf8')
    : SHORT_TERM_HEADER;

  const entry = `- ${isoTime(now)} ${line}`;
  const updated = appendDayEntry(existing, isoDate(now), entry);

  fs.writeFileSync(shortTerm, updated.endsWith('\n') ? updated : `${updated}\n`);
  return shortTerm;
}

/**
 * Renders a status transition as a journal line.
 *
 * Phrased as an event rather than a status dump so the log reads as a
 * narrative when an agent skims it weeks later.
 */
function describeTransition(transition) {
  const { id, from, to, title } = transition;

  if (from === null) {
    return `${id} created (${to}) — ${title}`;
  }
  return `${id} ${from} → ${to} — ${title}`;
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function isoTime(d) {
  return d.toISOString().slice(11, 16);
}

module.exports = { appendToJournal, describeTransition, isoDate, SHORT_TERM_HEADER };
