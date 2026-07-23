const { which } = require('../lib/shell');
const { markTool } = require('../lib/state');

// Add to this list as Vibe Kanban adds more supported executors.
const KNOWN_AGENT_CLIS = [
  { bin: 'claude', label: 'Claude Code' },
  { bin: 'gemini', label: 'Gemini CLI' },
  { bin: 'codex', label: 'Codex CLI' },
  { bin: 'cursor-agent', label: 'Cursor Agent' },
];

function detectAgents() {
  console.log('\n[2/7] Detecting installed coding agent CLIs…');

  const found = [];
  for (const agent of KNOWN_AGENT_CLIS) {
    if (which(agent.bin)) {
      found.push(agent);
      console.log(`  Found: ${agent.label} (\`${agent.bin}\`)`);
    }
  }

  if (found.length === 0) {
    console.log(
      '  No known agent CLIs found on PATH. Vibe Kanban needs at least one executor —\n' +
        '  install Claude Code, Gemini CLI, or Codex before running tickets.'
    );
  } else {
    console.log(
      `  This wizard doesn't hardcode one — Vibe Kanban will offer whichever of these\n` +
        `  ${found.length} you have installed as interchangeable executors per task.`
    );
  }

  markTool('agentClis', { detected: found.map((a) => a.bin) });
  return found;
}

module.exports = { detectAgents, KNOWN_AGENT_CLIS };
