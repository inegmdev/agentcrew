const { which, run, runCaptured } = require('../lib/shell');
const { markTool } = require('../lib/state');

function installGuild(projectPath) {
  console.log('\n[3/7] Installing guild (memory layer)…');

  if (!which('guild')) {
    console.log('  guild not found — installing via the official install script…');
    run('bash', ['-c', 'curl -fsSL https://github.com/mathomhaus/guild/releases/latest/download/install.sh | sh']);
  } else {
    console.log('  guild already installed.');
  }

  const version = runCaptured('guild', ['--version'], { allowFailure: true });
  markTool('guild', { installed: true, version });
  console.log(`  guild version: ${version || 'unknown'}`);

  console.log(
    '\n  Now running `guild init` inside your project. This is guild\'s own guided\n' +
      '  setup — it will detect which MCP clients you have and offer to register\n' +
      '  itself with them. Answer its prompts directly.\n'
  );
  run('guild', ['init'], { cwd: projectPath });
}

module.exports = { installGuild };
