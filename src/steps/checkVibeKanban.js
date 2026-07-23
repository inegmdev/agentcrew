const { runCaptured } = require('../lib/shell');
const { markTool } = require('../lib/state');

function checkVibeKanban() {
  console.log('\n[5/7] Checking Vibe Kanban (ticket board + execution)…');

  const version = runCaptured('npx', ['--yes', 'vibe-kanban', '--version'], { allowFailure: true });
  if (!version) {
    console.log(
      '  Could not reach Vibe Kanban via npx. Check your network/npm registry access\n' +
        '  and try `npx vibe-kanban --version` by hand.'
    );
    markTool('vibeKanban', { installed: false });
    return;
  }

  markTool('vibeKanban', { installed: true, version });
  console.log(`  Vibe Kanban reachable, version: ${version}`);

  console.log(
    '\n  Two things only the Vibe Kanban UI can do (its config surface is a UI\n' +
      '  screen, not a stable file this wizard should edit blind):\n\n' +
      '   1. Start the board:            npx vibe-kanban\n' +
      '   2. Add this project as a board in the UI.\n' +
      '   3. In the project\'s MCP config, register guild as an MCP server so every\n' +
      '      agent Vibe Kanban launches for this project can reach it. guild\'s own\n' +
      '      `init` step (previous step) may have already registered itself with\n' +
      '      MCP clients it detected on this machine — check there first.\n\n' +
      '  Do this once per project; Vibe Kanban remembers it after that.\n'
  );
}

module.exports = { checkVibeKanban };
