#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { checkPrerequisites } = require('../src/steps/checkPrerequisites');
const { detectAgents } = require('../src/steps/detectAgents');
const { installBacklog } = require('../src/steps/installBacklog');
const { scaffoldMemory } = require('../src/steps/scaffoldMemory');
const { mergeAgentsMd } = require('../src/steps/mergeAgentsMd');
const { installSkills } = require('../src/steps/installSkills');
const { startDaemon } = require('../src/daemon');
const { consolidate } = require('../src/daemon/consolidate');
const state = require('../src/lib/state');

async function setupProject(projectPath) {
  const resolved = path.resolve(projectPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(`No such directory: ${resolved}`);
  }
  if (!fs.existsSync(path.join(resolved, '.git'))) {
    throw new Error(
      `Not a git repository: ${resolved}\n` +
        'The board and memory layer are files that live in the repo, so it needs one.'
    );
  }

  console.log(`\n=== agentcrew setup: ${resolved} ===`);

  checkPrerequisites();
  detectAgents();
  installBacklog(resolved);
  scaffoldMemory(resolved);
  mergeAgentsMd(resolved);
  installSkills(resolved);

  state.registerProject(resolved);
  console.log(`\n  Registered in ${state.STATE_FILE}`);

  console.log(
    '\n=== Setup done. Two steps left that need a human: ===\n' +
      '  1. Run /setup-matt-pocock-skills inside your agent, in this repo.\n' +
      '  2. Fill in docs/MEMORY.md — what this project is, and why it is built\n' +
      '     the way it is. Everything else grows from there.\n\n' +
      '  Then: `backlog board` for the TUI, or `backlog browser` for the web UI.\n'
  );
}

async function updateAll() {
  const s = state.load();
  if (s.projects.length === 0) {
    console.log('No registered projects yet — run `agentcrew setup <path>` first.');
    return;
  }

  console.log(`Updating ${s.projects.length} registered project(s)…`);

  const failures = [];
  for (const project of s.projects) {
    try {
      await setupProject(project.path);
    } catch (err) {
      // One unreachable project (deleted, unmounted drive) shouldn't stop the
      // rest from updating.
      console.error(`\n  Skipped ${project.path}: ${err.message}`);
      failures.push(project.path);
    }
  }

  if (failures.length) {
    console.log(`\nFinished with ${failures.length} skipped:`);
    failures.forEach((f) => console.log(`  - ${f}`));
    // Exit non-zero so a scheduled `agentcrew update` can tell a partial run
    // from a clean one. The remaining projects were still updated.
    process.exitCode = 1;
  }
}

function runDaemon(projectPath) {
  const resolved = path.resolve(projectPath || '.');
  console.log(`\n=== agentcrew daemon: ${resolved} ===`);

  const daemon = startDaemon(resolved, { consolidateOnDone: true });

  console.log('  Ctrl-C to stop. Nothing here is load-bearing — stopping the');
  console.log('  daemon loses automation, never data.\n');

  const shutdown = () => {
    daemon.stop();
    console.log('\n  Stopped.');
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function runConsolidate(projectPath) {
  const resolved = path.resolve(projectPath || '.');
  console.log(`\n=== agentcrew consolidate: ${resolved} ===`);

  const result = consolidate(resolved);
  if (!result.ok) {
    throw new Error(result.reason);
  }

  console.log(`  Considered ${result.daysConsidered} day(s) of logs via ${result.agent}.`);
  console.log(`  Proposal: ${result.proposalPath}`);
  console.log('\n  Nothing was overwritten. Diff it against docs/MEMORY.md and');
  console.log('  replace that file only if you agree with what was dropped.\n');
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
  } else if (command === 'daemon') {
    runDaemon(arg);
  } else if (command === 'consolidate') {
    runConsolidate(arg);
  } else {
    console.log(
      'Usage:\n' +
        '  agentcrew setup <path-to-project>   Onboard a new project\n' +
        '  agentcrew update                    Re-run setup for every registered project\n' +
        '  agentcrew daemon [path]             Watch the board; journal and consolidate\n' +
        '  agentcrew consolidate [path]        Propose a distilled MEMORY.md now\n'
    );
  }
}

main().catch((err) => {
  console.error(`\nagentcrew stopped: ${err.message}`);
  process.exit(1);
});
