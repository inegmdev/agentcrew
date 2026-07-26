const { run } = require('../lib/shell');
const { markTool } = require('../lib/state');

function installSkills(projectPath) {
  console.log('\n[6/6] Installing planning skills (grill-me / to-prd / to-issues)…');

  run('npx', ['--yes', 'skills@latest', 'add', 'https://github.com/mattpocock/skills'], {
    cwd: projectPath,
  });

  markTool('mattpocockSkills', { installed: true });

  console.log(
    '\n  Skill files are installed. One step this wizard genuinely cannot do for you:\n' +
      '  `/setup-matt-pocock-skills` is a prompt-driven skill — it reads your repo,\n' +
      '  asks judgment calls, and writes AGENTS.md accordingly. That needs an LLM,\n' +
      '  not a shell script.\n\n' +
      '  >>> Open your agent of choice in this project now and run:\n' +
      '  >>>   /setup-matt-pocock-skills\n\n' +
      '  When it asks for the issue tracker, choose "local markdown". Tickets land\n' +
      '  in .scratch/<feature>/, and you promote the ones you want to work on into\n' +
      '  the board with `backlog task create`.\n'
  );
}

module.exports = { installSkills };
