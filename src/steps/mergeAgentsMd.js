const fs = require('fs');
const path = require('path');

const START = '<!-- agentcrew:start -->';
const END = '<!-- agentcrew:end -->';

// Backlog.md writes its own managed block into each instruction file. It is
// generated content, identical across the three, so a pointer file losing it
// loses nothing.
const BACKLOG_BLOCK = /<!--\s*BACKLOG\.MD GUIDELINES START[\s\S]*?BACKLOG\.MD GUIDELINES END\s*-->/gi;

// One file holds the rules; the rest point at it. Claude Code reads CLAUDE.md
// and Gemini CLI reads GEMINI.md, but AGENTS.md is the cross-agent standard —
// so it is the source of truth, and the other two are one-line redirects.
// Both agents expand an `@path` reference, so the redirect is a real import
// rather than a hint the agent may or may not follow.
const RULES_FILE = 'AGENTS.md';
const POINTERS = {
  'CLAUDE.md': `All agent rules live in @${RULES_FILE} — read that file.\n`,
  'GEMINI.md': `All agent rules live in @./${RULES_FILE} — read that file.\n`,
};
const TARGETS = [RULES_FILE, ...Object.keys(POINTERS)];

/**
 * Puts the agentcrew block in AGENTS.md and turns CLAUDE.md and GEMINI.md into
 * one-line redirects to it.
 *
 * Idempotent: the block is delimited by markers and replaced in place on
 * re-run, and a pointer file that already points at AGENTS.md is left alone.
 * Content outside the markers in AGENTS.md — including Backlog.md's own
 * managed block — is preserved.
 */
function mergeAgentsMd(projectPath) {
  console.log(`\n[5/6] Writing the agentcrew block into ${RULES_FILE}…`);

  const snippetPath = path.join(__dirname, '..', '..', 'templates', 'AGENTS.snippet.md');
  const snippet = fs.readFileSync(snippetPath, 'utf8').trim();

  const rulesPath = path.join(projectPath, RULES_FILE);
  const before = fs.existsSync(rulesPath) ? fs.readFileSync(rulesPath, 'utf8') : '';
  let rules = before;

  // Pointers are written after their own rules are carried across, so
  // collapsing three files into one never drops something a human wrote.
  for (const [file, pointer] of Object.entries(POINTERS)) {
    rules = writePointer(projectPath, file, pointer, rules);
  }

  const merged = mergeBlock(rules, snippet);

  if (merged === before) {
    console.log(`  ${RULES_FILE} already up to date.`);
    return;
  }

  fs.writeFileSync(rulesPath, merged);
  console.log(`  Wrote ${RULES_FILE}`);
}

/**
 * Replaces one instruction file with a redirect, returning AGENTS.md's
 * contents with anything that file uniquely held folded in.
 */
function writePointer(projectPath, file, pointer, rules) {
  const target = path.join(projectPath, file);

  if (!fs.existsSync(target)) {
    fs.writeFileSync(target, pointer);
    console.log(`  Wrote ${file} → ${RULES_FILE}`);
    return rules;
  }

  const existing = fs.readFileSync(target, 'utf8');
  if (existing.trim() === pointer.trim()) {
    console.log(`  ${file} already points at ${RULES_FILE}.`);
    return rules;
  }

  // Generated blocks are safe to drop — they are already in AGENTS.md. Prose
  // someone wrote by hand is not, so it moves rather than disappearing.
  const carried = unmanagedContent(existing);
  let next = rules;

  if (carried && !rules.includes(carried)) {
    next = `${rules.replace(/\s*$/, '')}\n\n## Rules folded in from ${file}\n\n${carried}\n`;
    console.log(`  Folded ${file}'s own rules into ${RULES_FILE}.`);
  }

  fs.writeFileSync(target, pointer);
  console.log(`  ${file} now points at ${RULES_FILE}`);
  return next;
}

/**
 * What a file holds beyond the blocks agentcrew and Backlog.md manage.
 *
 * Headings alone don't count — a file whose only survivor is its own title has
 * nothing worth carrying. Exported so the "never lose a hand-written rule"
 * guarantee is directly testable.
 */
function unmanagedContent(contents) {
  const withoutBlocks = stripBlock(contents, START, END).replace(BACKLOG_BLOCK, '');

  const lines = withoutBlocks
    .split('\n')
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .split('\n');

  // The file's own title goes with the file. Dropping it also means two
  // instruction files holding the same rules under different titles fold in
  // once, not twice.
  if (/^#\s/.test(lines[0] || '')) {
    lines.shift();
  }

  const remainder = lines.join('\n').trim();
  const meaningful = remainder
    .split('\n')
    .some((line) => line.trim().length > 0 && !/^#{1,6}\s/.test(line.trim()));

  return meaningful ? remainder : null;
}

function stripBlock(contents, start, end) {
  const startIdx = contents.indexOf(start);
  const endIdx = contents.indexOf(end);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return contents.slice(0, startIdx) + contents.slice(endIdx + end.length);
  }
  return contents
    .split('\n')
    .filter((line) => !line.includes(start) && !line.includes(end))
    .join('\n');
}

/**
 * Replaces the marker-delimited block in `existing`, or appends it if absent.
 * Exported so the idempotency guarantee is directly testable.
 */
function mergeBlock(existing, snippet) {
  const startIdx = existing.indexOf(START);
  const endIdx = existing.indexOf(END);

  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    return existing.slice(0, startIdx) + snippet + existing.slice(endIdx + END.length);
  }

  // A lone or inverted marker — from a hand-edit or an interrupted write —
  // matches neither the replace nor a clean append. Left in place it would
  // never match again, so every future run would append another copy. Strip
  // the stragglers first so this file converges on one block.
  const cleaned = (startIdx !== -1 || endIdx !== -1)
    ? existing.split('\n').filter((line) => !line.includes(START) && !line.includes(END)).join('\n')
    : existing;

  return cleaned.trim().length ? `${cleaned.trim()}\n\n${snippet}\n` : `${snippet}\n`;
}

module.exports = { mergeAgentsMd, mergeBlock, unmanagedContent, TARGETS, RULES_FILE, POINTERS };
