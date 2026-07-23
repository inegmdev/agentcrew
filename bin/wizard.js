#!/usr/bin/env node

const path = require('path');
const { checkPrerequisites } = require('../src/steps/checkPrerequisites');
const { detectAgents } = require('../src/steps/detectAgents');
const { installGuild } = require('../src/steps/installGuild');
const { installSkills } = require('../src/steps/installSkills');
const { checkVibeKanban } = require('../src/steps/checkVibeKanban');
const { mergeAgentsMd } = require('../src/steps/mergeAgentsMd');
const state = require('../src/lib/state');

async function setupProject(projectPath) {
  const resolved = path.resolve(projectPath);
  console.log(`\n=== agentcrew setup: ${resolved} ===`);

  checkPrerequisites();
  detectAgents();
  installGuild(resolved);
  installSkills(resolved);
  mergeAgentsMd(resolved);
  checkVibeKanban();

  console.log('\n[7/7] Registering project…');
  state.registerProject(resolved);
  console.log(`  Registered. State file: ${state.STATE_FILE}`);

  console.log(
    '\n=== Setup script done. Remaining steps need your judgment: ===\n' +
      '  1. Run /setup-matt-pocock-skills inside your agent, in this repo.\n' +
      '  2. Start Vibe Kanban (npx vibe-kanban), add this project, confirm guild\n' +
      '     is registered as an MCP server for it.\n' +
      '  3. Confirm src/adapter/sync-tickets.js\'s tool schema against\n' +
      '     `npx vibe-kanban --mcp` before using it for real.\n'
  );
}

async function updateAll() {
  const s = state.load();
  if (s.projects.length === 0) {
    console.log('No registered projects yet — run `agentcrew setup <path>` first.');
    return;
  }
  console.log(`Updating ${s.projects.length} registered project(s)…`);
  for (const project of s.projects) {
    await setupProject(project.path);
  }
}

async function main() {
  const [command, arg] = process.argv.slice(2);

  if (command === 'setup') {
    if (!arg) {
      console.error('Usage: agentcrew setup <path-to-project>');
      process.exit(1);
    }
    await setupProject(arg);
  } else if (command === 'update') {
    await updateAll();
  } else {
    console.log(
      'Usage:\n' +
        '  agentcrew setup <path-to-project>   Onboard a new project\n' +
        '  agentcrew update                    Re-run setup for every registered project\n'
    );
  }
}

main().catch((err) => {
  console.error(`\nagentcrew stopped: ${err.message}`);
  process.exit(1);
});
