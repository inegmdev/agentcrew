const { which } = require('../lib/shell');
const { markTool } = require('../lib/state');

// Anything that can read AGENTS.md / CLAUDE.md / GEMINI.md and drive the
// `backlog` CLI belongs here. Nothing in the stack is tied to a specific one.
const KNOWN_AGENT_CLIS = [
  { bin: 'claude', label: 'Claude Code' },
  { bin: 'gemini', label: 'Gemini CLI' },
  { bin: 'kimi', label: 'Kimi CLI' },
  { bin: 'codex', label: 'Codex CLI' },
  { bin: 'cursor-agent', label: 'Cursor Agent' },
];

function detectAgents() {
  console.log('\n[2/6] Detecting installed coding agent CLIs…');

  const found = [];
  for (const agent of KNOWN_AGENT_CLIS) {
    if (which(agent.bin)) {
      found.push(agent);
      console.log(`  Found: ${agent.label} (\`${agent.bin}\`)`);
    }
  }

  if (found.length === 0) {
    console.log(
      '  No known agent CLIs found on PATH. Setup will still complete — the board\n' +
        '  and memory layer are just files — but you need at least one agent\n' +
        '  installed to actually work tickets.'
    );
  } else {
    console.log(
      `  ${found.length} available. Nothing here hardcodes one: the board and the\n` +
        `  memory layer are plain markdown, readable by any of them.`
    );
  }

  markTool('agentClis', { detected: found.map((a) => a.bin) });
  return found;
}

module.exports = { detectAgents, KNOWN_AGENT_CLIS };
