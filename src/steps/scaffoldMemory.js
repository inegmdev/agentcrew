const fs = require('fs');
const path = require('path');
const { markTool } = require('../lib/state');

const TEMPLATE = path.join(__dirname, '..', '..', 'templates', 'MEMORY.template.md');

const MEMORY_README = `# Short-term memory

Append-only daily logs: \`YYYY-MM-DD.md\`, one per day.

Write here freely and without judgement — cheap to add, cheap to throw away.
Agents read **today's and yesterday's** files at session start, and nothing
older. That window is the whole point: it keeps session cost flat no matter
how long the project runs.

Consolidation is **manual today**: periodically read back over recent logs,
copy anything still true in a month up into \`docs/MEMORY.md\`, and delete the
rest. Deleting is safe — git keeps every log forever.

(Automating this is planned but not built. Until it is, nothing promotes
itself.)

| Tier | Where | Loaded |
|---|---|---|
| long-term | \`docs/MEMORY.md\` | always |
| decisions | \`backlog decision list\` | on demand |
| short-term | \`memory/YYYY-MM-DD.md\` | today + yesterday |
| tasks | \`backlog task list\` | on demand |
`;

/**
 * Creates the memory layer in the target project: a long-term MEMORY.md and
 * the short-term memory/ directory.
 *
 * Never overwrites an existing MEMORY.md — by the time this re-runs, the file
 * is the project's accumulated knowledge and clobbering it would be the single
 * most destructive thing this wizard could do.
 */
function scaffoldMemory(projectPath) {
  console.log('\n[4/6] Scaffolding the memory layer…');

  const docsDir = path.join(projectPath, 'docs');
  const memoryDir = path.join(projectPath, 'memory');
  const memoryFile = path.join(docsDir, 'MEMORY.md');
  const memoryReadme = path.join(memoryDir, 'README.md');

  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(memoryDir, { recursive: true });

  if (fs.existsSync(memoryFile)) {
    console.log('  docs/MEMORY.md exists — left untouched.');
  } else {
    fs.copyFileSync(TEMPLATE, memoryFile);
    console.log('  Created docs/MEMORY.md from template.');
  }

  if (fs.existsSync(memoryReadme)) {
    console.log('  memory/README.md exists — left untouched.');
  } else {
    fs.writeFileSync(memoryReadme, MEMORY_README);
    console.log('  Created memory/ with README.');
  }

  markTool('memoryLayer', { scaffolded: true });
}

module.exports = { scaffoldMemory };
