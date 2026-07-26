# Changelog

## 0.2.0

Replaced the execution and memory layers. Vibe Kanban required a login for
local issue tracking and its company announced a shutdown; guild was a
single-binary MCP server that could not be installed on a restricted
corporate machine. Both are gone.

**Added**
- Backlog.md as the board — tasks are markdown in your own repo
  (`src/steps/installBacklog.js`). Adds a `Needs Attention` status.
- A markdown memory layer split by retention, not topic
  (`src/steps/scaffoldMemory.js`): `docs/MEMORY.md` long-term,
  `memory/YYYY-MM-DD.md` short-term.
- Windows support: no shell builtins, and `.cmd` shims are handled.

**Changed**
- The agentcrew block is now written to `AGENTS.md`, `CLAUDE.md`, *and*
  `GEMINI.md` — one per agent convention, since they don't share one.
- `setup` now fails early if the target isn't a git repository.
- `update` no longer aborts the whole run when one project is unreachable.
- Prerequisites dropped `curl` and the macOS/Linux gate (both were guild's).

**Removed**
- `src/steps/installGuild.js`, `src/steps/checkVibeKanban.js`,
  `src/adapter/sync-tickets.js` — the last of these was a stub that never
  worked, built against an MCP tool name nobody had confirmed.

**Verified against a real install** (backlog.md v1.48.0), rather than
assumed: non-interactive init, idempotent re-runs (byte-identical output,
tasks untouched), the `Needs Attention` status, and the MCP server's
JSON-RPC handshake. Machine-readable output is `--plain`; there is no
`--json`.

## 0.1.0

Initial scaffold:
- Detects installed agent CLIs (Claude Code, Gemini CLI, Codex, Cursor Agent)
- Installs and initializes guild
- Installs mattpocock/skills, hands off /setup-matt-pocock-skills to the human
- Merges an idempotent AGENTS.md block defining the guild/Vibe Kanban boundary
- Checks Vibe Kanban reachability, prints manual MCP-wiring steps
- Registers projects in ~/.agentcrew/state.json; `agentcrew update` re-runs
  across all of them
- Ships `src/adapter/sync-tickets.js` as a stub with --dry-run — MCP tool
  schema for card creation is not yet confirmed against a live Vibe Kanban
  install
