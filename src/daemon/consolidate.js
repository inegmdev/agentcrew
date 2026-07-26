const fs = require('fs');
const path = require('path');
const { runCaptured } = require('../lib/shell');
const { resolveAgent, headlessArgs } = require('./agents');
const { isoDate } = require('./journal');

// How many days of logs to feed the consolidation pass. Anything older has
// either been promoted already or has earned being forgotten.
const WINDOW_DAYS = 7;

const PROMPT = `You are consolidating a software project's memory.

Below is the project's current long-term memory (MEMORY.md), followed by
recent short-term daily logs.

Rewrite MEMORY.md so that:
- anything in the daily logs that will still matter in a month is folded in
- anything already captured is not duplicated
- entries that are now false or obsolete are removed
- it stays under 200 lines, distilled, not a log
- the existing structure and headings are preserved where they still fit

Output ONLY the new MEMORY.md content. No preamble, no code fences.`;

/**
 * Collects the recent daily logs that consolidation should consider.
 */
function recentLogs(projectPath, now = new Date(), windowDays = WINDOW_DAYS) {
  const dir = path.join(projectPath, 'memory');
  const logs = [];

  for (let i = 0; i < windowDays; i++) {
    const day = new Date(now.getTime() - i * 86400000);
    const file = path.join(dir, `${isoDate(day)}.md`);
    if (fs.existsSync(file)) {
      logs.push({ date: isoDate(day), contents: fs.readFileSync(file, 'utf8') });
    }
  }

  return logs.reverse();
}

/**
 * Runs a consolidation pass and writes the result to a *proposal* file rather
 * than to MEMORY.md itself.
 *
 * This is the deliberate asymmetry in the memory layer: appending to a daily
 * log is safe and happens automatically, but consolidation is lossy by design
 * — it drops entries that did not earn their place. An agent silently
 * rewriting the project's accumulated knowledge is the one failure here that
 * would be expensive and hard to notice, so the output lands next to
 * MEMORY.md for a human (or a PR) to accept.
 */
function consolidate(projectPath, options = {}) {
  const agent = resolveAgent(options.agent);
  if (!agent) {
    return { ok: false, reason: 'no agent CLI available to run consolidation' };
  }

  const memoryPath = path.join(projectPath, 'docs', 'MEMORY.md');
  if (!fs.existsSync(memoryPath)) {
    return { ok: false, reason: 'docs/MEMORY.md not found — run agentcrew setup first' };
  }

  const logs = recentLogs(projectPath, options.now);
  if (logs.length === 0) {
    return { ok: false, reason: 'no recent daily logs to consolidate' };
  }

  const input = [
    PROMPT,
    '\n===== CURRENT MEMORY.md =====\n',
    fs.readFileSync(memoryPath, 'utf8'),
    '\n===== RECENT DAILY LOGS =====\n',
    ...logs.map((l) => `--- ${l.date} ---\n${l.contents}`),
  ].join('\n');

  const output = runCaptured(agent.bin, headlessArgs(agent, input), {
    cwd: projectPath,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (!output.trim()) {
    return { ok: false, reason: `${agent.bin} returned nothing` };
  }

  const proposalPath = path.join(projectPath, 'docs', 'MEMORY.proposed.md');
  fs.writeFileSync(proposalPath, output.endsWith('\n') ? output : `${output}\n`);

  return {
    ok: true,
    agent: agent.bin,
    proposalPath,
    daysConsidered: logs.length,
  };
}

module.exports = { consolidate, recentLogs, WINDOW_DAYS, PROMPT };
