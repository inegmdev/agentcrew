#!/usr/bin/env node
/**
 * Bridges the planning skills' output to Vibe Kanban's board.
 *
 * to-issues (via setup-matt-pocock-skills, local-markdown mode) writes one
 * file per ticket under .scratch/<feature>/, with a `Status:` line near the
 * top. This script reads those files and creates a Vibe Kanban card for each
 * one whose status matches your "ready for an AFK agent" triage label.
 *
 * TODO — verify before removing --dry-run:
 *   The MCP tool name and argument shape below (`vk_create_card`) are this
 *   wizard's best-documented guess, not something confirmed against your
 *   specific installed Vibe Kanban version. Run:
 *     npx vibe-kanban --mcp
 *   and inspect its advertised tool list/schema before trusting this in
 *   anything but --dry-run.
 */

const fs = require('fs');
const path = require('path');

function parseArgs(argv) {
  const args = { dryRun: false, projectPath: process.cwd(), readyLabel: 'ready-for-agent' };
  for (const arg of argv) {
    if (arg === '--dry-run') args.dryRun = true;
    else if (arg.startsWith('--ready-label=')) args.readyLabel = arg.split('=')[1];
    else args.projectPath = arg;
  }
  return args;
}

function readTickets(scratchDir) {
  if (!fs.existsSync(scratchDir)) return [];
  const tickets = [];
  for (const feature of fs.readdirSync(scratchDir)) {
    const featureDir = path.join(scratchDir, feature);
    if (!fs.statSync(featureDir).isDirectory()) continue;
    for (const file of fs.readdirSync(featureDir)) {
      if (!file.endsWith('.md')) continue;
      const filePath = path.join(featureDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const statusMatch = content.match(/^Status:\s*(.+)$/m);
      const titleMatch = content.match(/^#\s*(.+)$/m);
      tickets.push({
        filePath,
        feature,
        title: titleMatch ? titleMatch[1].trim() : file.replace(/\.md$/, ''),
        status: statusMatch ? statusMatch[1].trim() : 'unknown',
        body: content,
      });
    }
  }
  return tickets;
}

async function createCard(ticket) {
  // TODO — verify tool name + arg shape against `npx vibe-kanban --mcp`.
  // Sketch of the call, left unexecuted until confirmed:
  //
  //   await mcpClient.callTool('vk_create_card', {
  //     title: ticket.title,
  //     description: ticket.body,
  //     source_path: ticket.filePath,
  //   });
  throw new Error(
    'createCard() is a stub — confirm the MCP tool schema first, then implement ' +
      'the actual MCP client call here. See the TODO at the top of this file.'
  );
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scratchDir = path.join(args.projectPath, '.scratch');
  const tickets = readTickets(scratchDir);

  const ready = tickets.filter((t) => t.status.includes(args.readyLabel));

  console.log(`Found ${tickets.length} ticket file(s), ${ready.length} marked "${args.readyLabel}".`);

  for (const ticket of ready) {
    if (args.dryRun) {
      console.log(`  [dry-run] Would create card: "${ticket.title}" (from ${ticket.filePath})`);
    } else {
      console.log(`  Creating card: "${ticket.title}"…`);
      await createCard(ticket);
    }
  }

  if (!args.dryRun && ready.length > 0) {
    console.log('\nDone.');
  } else if (args.dryRun) {
    console.log('\nDry run only — nothing was created. Re-run without --dry-run once createCard() is implemented.');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
