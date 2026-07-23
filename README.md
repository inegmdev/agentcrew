# agentcrew

A setup wizard that wires together three separate open-source tools into one
working system for planning, tracking, and remembering agent-driven
engineering work:

- **grill-me / to-prd / to-issues** (mattpocock/skills) — the planning loop.
  You get grilled with questions until there's shared understanding, that
  becomes a PRD, and the PRD gets cut into vertical-slice tickets.
- **Vibe Kanban** — the board. Owns tickets, spins up an isolated git
  worktree per task, and launches whichever coding agent CLI you point it at
  in streaming mode. You can open any running session and take over the
  moment it needs you.
- **guild** — the memory. A local MCP server any agent can read an "Oath"
  (standing principles) and relevant "Lore" (past decisions) from at the
  start of a session, and write new Lore to at the end.

This repo does **not** replace any of those three tools. It installs them,
wires the interfaces between them, and gives you one command to re-run when
you improve the setup later.

## Design decisions baked into this wizard

- **Agent-agnostic.** Vibe Kanban already supports Claude Code, Gemini CLI,
  Codex, and others as interchangeable executors, invoked as a streamed CLI
  subprocess per task. This wizard detects whichever of those you have
  installed — it doesn't hardcode one.
- **Vibe Kanban owns tasks. guild owns only memory.** guild has its own
  Quest/task primitive, which would compete with Vibe Kanban's board as a
  second source of truth. This setup deliberately wires guild for
  `lore`/`oath`/`brief` only, and never touches `quest_accept` /
  `quest_fulfill`. See `templates/AGENTS.snippet.md` for the exact
  instruction every agent gets.
- **One machine, many projects.** State lives in `~/.agentcrew/state.json`
  — a registry of every project you've onboarded. `agentcrew update` loops
  over all of them, so improvements to this wizard propagate everywhere
  without you re-running setup by hand per repo.
- **Planning → board bridge is explicit, not magic.** `to-issues` natively
  writes to GitHub, GitLab, or local markdown (`.scratch/<feature>/`) — not
  to Vibe Kanban. Rather than trust a freeform-prose "Other tracker"
  description, this wizard keeps `to-issues` on local markdown (its
  well-tested path) and installs a small, inspectable adapter script
  (`src/adapter/sync-tickets.js`) that turns those files into Vibe Kanban
  cards. Run it with `--dry-run` first — always.

## Prerequisites

- macOS or Linux (guild's installer targets these)
- Node.js ≥ 18 and npm
- git
- curl

The wizard checks all of these before doing anything and tells you exactly
what's missing.

## Quickstart

```bash
git clone <your-fork-url> agentcrew
cd agentcrew
node bin/wizard.js setup /path/to/your/project
```

Run it again against a second project to onboard it too — nothing here is
global-only:

```bash
node bin/wizard.js setup /path/to/another/project
```

## What `setup` actually does, per project

1. Checks prerequisites, detects which agent CLIs you have (`claude`,
   `gemini`, `codex`).
2. Installs `guild` if missing, then runs `guild init` in the target repo —
   this is guild's own interactive setup; answer its prompts directly.
3. Installs the mattpocock skills into the target repo.
4. **Hands off to you** to run `/setup-matt-pocock-skills` inside your agent
   in that repo — this is a prompt-driven skill, not a script, so an LLM
   has to run it, not this wizard.
5. Merges a short, marker-delimited block into the repo's `AGENTS.md`
   telling every agent how to use guild (and how *not* to use its Quest
   board).
6. Registers the project in `~/.agentcrew/state.json`.
7. Verifies `npx vibe-kanban` is reachable and prints the exact next steps
   for adding the project + registering guild as an MCP server in Vibe
   Kanban's UI (this part is a UI step, not a file this wizard should guess
   at editing blind).

## Updating an existing setup

```bash
node bin/wizard.js update
```

Re-runs the idempotent steps (skills, guild init, AGENTS.md merge) across
every registered project. Nothing here deletes guild's or Vibe Kanban's
SQLite data — both live outside this repo's reach entirely.

## The adapter script

```bash
node src/adapter/sync-tickets.js /path/to/project --dry-run
```

Reads `.scratch/<feature>/*.md` issue files and shows what cards it would
create in Vibe Kanban. The MCP tool name it calls (`vk_create_card`) is
marked with a `TODO: verify` comment in the source — confirm it against
`npx vibe-kanban --mcp`'s actual tool list for your installed version before
dropping `--dry-run`.

## Known manual steps (on purpose, not an oversight)

- Running `/setup-matt-pocock-skills` and `/grill-me` — these require an
  LLM's judgment, not a deterministic script.
- Adding guild as an MCP server inside Vibe Kanban's own UI — Vibe Kanban's
  config surface is a UI screen, not a stable file format this wizard
  should edit blind.
- Confirming the adapter script's MCP tool schema against your installed
  Vibe Kanban version.
