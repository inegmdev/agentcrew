const fs = require('fs');
const path = require('path');

/**
 * Appends to the short-term memory log.
 *
 * This is the safe half of the memory layer: append-only, never rewritten, and
 * recoverable from git even if deleted. Consolidation — the half that drops
 * things — is deliberately kept out of here.
 */
function appendToJournal(projectPath, line, now = new Date()) {
  const dir = path.join(projectPath, 'memory');
  const file = path.join(dir, `${isoDate(now)}.md`);

  fs.mkdirSync(dir, { recursive: true });

  const header = `# ${isoDate(now)}\n\n`;
  const exists = fs.existsSync(file);
  const prefix = exists ? '' : header;
  const entry = `- ${isoTime(now)} ${line}\n`;

  fs.appendFileSync(file, prefix + entry);
  return file;
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

module.exports = { appendToJournal, describeTransition, isoDate };
