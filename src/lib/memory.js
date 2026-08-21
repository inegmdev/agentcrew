const path = require('path');

// The memory layer lives entirely under docs/memory/, so one directory holds
// every tier and nothing about it is spread across the repo root.
const MEMORY_DIR = path.join('docs', 'memory');
const LONG_TERM = path.join(MEMORY_DIR, 'MEMORY.md');
const SHORT_TERM = path.join(MEMORY_DIR, 'MEMORY_SHORTTERM.md');
const PROPOSAL = path.join(MEMORY_DIR, 'MEMORY.proposed.md');
const ARCHIVE_DIR = path.join(MEMORY_DIR, 'archived');

// The pre-0.5 layout: a long-term file at docs/MEMORY.md and one file per day
// under memory/. Kept here so setup can migrate a repo instead of leaving two
// memory layers side by side, one of which nothing reads any more.
const LEGACY_LONG_TERM = path.join('docs', 'MEMORY.md');
const LEGACY_LOG_DIR = 'memory';
const LEGACY_PROPOSAL = path.join('docs', 'MEMORY.proposed.md');

const DAY_HEADING = /^##\s+(\d{4}-\d{2}-\d{2})\s*$/;
const ARCHIVE_HEADING = /^##\s+Archive index\s*$/i;
const ARCHIVE_PLACEHOLDER = /^_Nothing archived yet\._$/;

/**
 * Absolute paths to every part of the memory layer for one project.
 */
function memoryPaths(projectPath) {
  const at = (rel) => path.join(projectPath, rel);
  return {
    dir: at(MEMORY_DIR),
    longTerm: at(LONG_TERM),
    shortTerm: at(SHORT_TERM),
    proposal: at(PROPOSAL),
    archiveDir: at(ARCHIVE_DIR),
    legacyLongTerm: at(LEGACY_LONG_TERM),
    legacyLogDir: at(LEGACY_LOG_DIR),
    legacyProposal: at(LEGACY_PROPOSAL),
  };
}

/**
 * Splits the short-term file into its `## YYYY-MM-DD` day sections.
 *
 * A section runs to the next `#` or `##` heading, so the surrounding furniture
 * — the archiving policy, the archive index — is never swallowed into a day.
 */
function daySections(contents) {
  const lines = contents.split('\n');
  const found = [];

  lines.forEach((line, i) => {
    const match = line.match(DAY_HEADING);
    if (match) found.push({ date: match[1], start: i });
  });

  return found.map((section) => {
    let end = lines.length;
    for (let i = section.start + 1; i < lines.length; i++) {
      if (/^#{1,2}\s+\S/.test(lines[i])) {
        end = i;
        break;
      }
    }
    return {
      ...section,
      end,
      contents: lines.slice(section.start, end).join('\n').trimEnd(),
      body: lines.slice(section.start + 1, end).join('\n').trim(),
    };
  });
}

/**
 * Appends one entry under today's day section, creating that section if this
 * is the day's first entry.
 *
 * Purely additive: existing sections, their order, and everything else in the
 * file are left exactly as they were. Nothing here removes a line — dropping
 * logs is the archiving workflow's job, and it is a human/agent decision.
 */
function appendDayEntry(contents, date, entry) {
  const section = daySections(contents).find((s) => s.date === date);

  if (!section) {
    return `${contents.replace(/\s*$/, '')}\n\n## ${date}\n\n${entry}\n`;
  }

  const lines = contents.split('\n');
  let insertAt = section.end;
  while (insertAt > section.start + 1 && lines[insertAt - 1].trim() === '') {
    insertAt--;
  }

  lines.splice(insertAt, 0, entry);
  return lines.join('\n');
}

/**
 * Adds one link to the archive index, so an archived session is always
 * reachable from the short-term file rather than only by listing a directory.
 *
 * Idempotent — re-adding a link that is already there is a no-op, which is
 * what makes it safe to call from `agentcrew update`.
 */
function addArchiveLink(contents, link) {
  if (contents.includes(link)) {
    return contents;
  }

  const lines = contents.split('\n');
  const headingAt = lines.findIndex((line) => ARCHIVE_HEADING.test(line));

  if (headingAt === -1) {
    return `${contents.replace(/\s*$/, '')}\n\n## Archive index\n\n${link}\n`;
  }

  let end = lines.length;
  for (let i = headingAt + 1; i < lines.length; i++) {
    if (/^#{1,2}\s+\S/.test(lines[i])) {
      end = i;
      break;
    }
  }

  const section = lines
    .slice(headingAt + 1, end)
    .filter((line) => !ARCHIVE_PLACEHOLDER.test(line.trim()));

  let insertAt = section.length;
  while (insertAt > 0 && section[insertAt - 1].trim() === '') insertAt--;

  const previous = insertAt > 0 ? section[insertAt - 1].trim() : '';
  const needsBlank = previous.length > 0 && !previous.startsWith('-');
  section.splice(insertAt, 0, ...(needsBlank ? ['', link] : [link]));

  // One blank line before the next heading, however many the file had.
  while (section.length > 1 && section[section.length - 1].trim() === '' && section[section.length - 2].trim() === '') {
    section.pop();
  }

  return [...lines.slice(0, headingAt + 1), ...section, ...lines.slice(end)].join('\n');
}

module.exports = {
  MEMORY_DIR,
  LONG_TERM,
  SHORT_TERM,
  PROPOSAL,
  ARCHIVE_DIR,
  LEGACY_LONG_TERM,
  LEGACY_LOG_DIR,
  LEGACY_PROPOSAL,
  memoryPaths,
  daySections,
  appendDayEntry,
  addArchiveLink,
};
