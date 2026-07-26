# Changelog

## 0.3.0

Added the daemon, so the memory layer maintains itself.

**Added**
- `agentcrew daemon [path]` watches `backlog/tasks/*.md` and reacts to status
  transitions: journals every move to `memory/<today>.md`, notifies on
  `Needs Attention`, and consolidates on `Done`.
- `agentcrew consolidate [path]` runs a consolidation pass on demand.
- `src/daemon/agents.js` maps each agent CLI to its non-interactive
  invocation. Only Claude Code's `-p` is verified first-hand; the rest are
  marked `verified: false` and can be overridden per machine.

**Design notes**
- Consolidation writes `docs/MEMORY.proposed.md` and never overwrites
  `docs/MEMORY.md`. Appending to a log is safe; consolidation is lossy by
  design, so a human accepts the drop.
- The daemon holds no state of its own. Its baseline is read from disk at
  startup rather than persisted, so restarts never replay old transitions —
  and transitions that happen while it is stopped are missed, deliberately.
- `fs.watch` gives latency, a 30s sweep gives correctness. `fs.watch` is
  unreliable on network mounts and some container filesystems, so the two
  run together.

**Not built yet**
- Worktree isolation and agent launching on `In Progress`.
- Auto-commit of journal appends, and PRs for consolidation proposals.

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
