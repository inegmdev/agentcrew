const fs = require('fs');
const path = require('path');

const START = '<!-- agentcrew:start -->';
const END = '<!-- agentcrew:end -->';

// One file per agent, because they don't share a convention: Claude Code reads
// CLAUDE.md, Gemini CLI reads GEMINI.md, and AGENTS.md is the cross-agent
// standard everything else follows. Backlog.md's own init creates all three,
// so by the time this runs they normally exist already.
const TARGETS = ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md'];

/**
 * Writes the agentcrew block into every agent instruction file.
 *
 * Idempotent: the block is delimited by markers and replaced in place on
 * re-run, so `agentcrew update` never appends a second copy. Content outside
 * the markers — including Backlog.md's own managed block — is preserved.
 */
function mergeAgentsMd(projectPath) {
  console.log('\n[5/6] Merging the agentcrew block into agent instruction files…');

  const snippetPath = path.join(__dirname, '..', '..', 'templates', 'AGENTS.snippet.md');
  const snippet = fs.readFileSync(snippetPath, 'utf8').trim();

  for (const target of TARGETS) {
    const targetPath = path.join(projectPath, target);
    const existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';
    const merged = mergeBlock(existing, snippet);

    if (merged === existing) {
      console.log(`  ${target} already up to date.`);
      continue;
    }

    fs.writeFileSync(targetPath, merged);
    console.log(`  Wrote ${target}`);
  }
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

module.exports = { mergeAgentsMd, mergeBlock, TARGETS };
