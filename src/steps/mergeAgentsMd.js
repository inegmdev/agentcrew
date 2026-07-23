const fs = require('fs');
const path = require('path');

const START = '<!-- agentcrew:start -->';
const END = '<!-- agentcrew:end -->';

function mergeAgentsMd(projectPath) {
  console.log("\n[6/7] Merging the agentcrew block into AGENTS.md…");

  const snippetPath = path.join(__dirname, '..', '..', 'templates', 'AGENTS.snippet.md');
  const snippet = fs.readFileSync(snippetPath, 'utf8').trim();

  const targetPath = path.join(projectPath, 'AGENTS.md');
  let existing = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, 'utf8') : '';

  const startIdx = existing.indexOf(START);
  const endIdx = existing.indexOf(END);

  if (startIdx !== -1 && endIdx !== -1) {
    // Replace the previously-managed block in place — safe to re-run.
    existing = existing.slice(0, startIdx) + snippet + existing.slice(endIdx + END.length);
  } else {
    // Append, with a blank line separator if the file already has content.
    existing = existing.trim().length ? `${existing.trim()}\n\n${snippet}\n` : `${snippet}\n`;
  }

  fs.writeFileSync(targetPath, existing);
  console.log(`  Wrote ${targetPath}`);
}

module.exports = { mergeAgentsMd };
