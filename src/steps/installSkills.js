const { run } = require('../lib/shell');
const { markTool } = require('../lib/state');

function installSkills(projectPath) {
  console.log('\n[4/7] Installing planning skills (grill-me / to-prd / to-issues)…');

  run('npx', ['--yes', 'skills@latest', 'add', 'https://github.com/mattpocock/skills'], {
    cwd: projectPath,
  });

  markTool('mattpocockSkills', { installed: true });

  console.log(
    '\n  Skill files are installed. One step this wizard genuinely cannot do for you:\n' +
      '  `/setup-matt-pocock-skills` is a prompt-driven skill — it reads your repo,\n' +
      '  asks judgment calls (issue tracker, triage labels, domain docs), and writes\n' +
      '  AGENTS.md accordingly. That needs an LLM, not a shell script.\n\n' +
      '  >>> Open your agent of choice in this project now and run:\n' +
      '  >>>   /setup-matt-pocock-skills\n\n' +
      '  When asked for the issue tracker, choose "local markdown" — this wizard\'s\n' +
      '  adapter script (src/adapter/sync-tickets.js) expects tickets to land in\n' +
      '  .scratch/<feature>/ before it syncs them into Vibe Kanban.\n'
  );
}

module.exports = { installSkills };
