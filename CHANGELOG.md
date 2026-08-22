# Changelog

## 0.5.0

Restructured the memory layer around one directory and made cleanup a defined
workflow. Short-term memory was one file per day, spread between `docs/` and
`memory/`, and "delete the old ones" was the only cleanup story — so old
context was either kept forever or lost to a `rm`.

**Changed**
- The whole memory layer now lives under `docs/memory/`:
  `MEMORY.md` (long-term), `MEMORY_SHORTTERM.md` (short-term),
  `MEMORY.proposed.md` (consolidation output), `archived/` (retired logs).
- Short-term memory is **one file with `## YYYY-MM-DD` sections**, not one
  file per day. An agent reads recent sections in a single read.
- The daemon journals transitions into today's section of
  `docs/memory/MEMORY_SHORTTERM.md`; consolidation reads its recent sections
  and writes `docs/memory/MEMORY.proposed.md`.

**Added**
- **One rules file.** The agentcrew block now goes into `AGENTS.md` only;
  `CLAUDE.md` and `GEMINI.md` become a one-line redirect to it
  (`All agent rules live in @AGENTS.md`). Both CLIs expand `@file`, so the
  redirect imports the rules rather than hinting at them, and three copies of
  the same rules can no longer drift. Rules a human wrote in either file are
  folded into `AGENTS.md` before it is replaced, so nothing is lost.
- A short-term memory **cleanup & archiving policy** in the agentcrew block,
  so every onboarded repo tells its agent the same thing: never delete daily
  logs — move them into `docs/memory/archived/session_YYYY_MM_DD.md`, clear
  them from **Active logs**, and link them under **Archive index**. The
  archive keeps past conversations whole and reachable.
- `templates/MEMORY_SHORTTERM.template.md` and `templates/ARCHIVED.readme.md`.
- `src/lib/memory.js` — memory paths, day-section parsing, archive-index
  insertion, shared by the setup step and the daemon.
- Migration on re-run: `agentcrew update` moves `docs/MEMORY.md` (and any
  pending proposal) into `docs/memory/`, and archives each legacy
  `memory/YYYY-MM-DD.md` as an indexed session. Nothing is deleted, and a
  second run is a no-op.

**Design notes**
- Archiving is markdown policy, not a CLI command. Which conversation is over
  is a judgment call, and enforcement stays agent-agnostic (decision 4) rather
  than depending on a tool a corporate machine may not let you install.
- Consolidation still reads only the active logs. Archived sessions are out of
  scope by design — pulling them back in would undo the archiving.

## 0.4.0

One-line install. The capability was already there — `bin/` and a shebang
have been in place since 0.1.0 — but the README told you to clone the repo
and invoke `node bin/wizard.js`, so nobody would have found it.

**Added**
- Documented the actual one-liner:
  `npx github:inegmdev/agentcrew setup .` — no clone, no npm account,
  nothing published. Verified end-to-end against the public repo.
- `repository`, `homepage`, `bugs` and `keywords` in package.json.
- A `files` allowlist, so packaging is explicit rather than "whatever
  isn't gitignored". Templates are read at runtime, so they are included
  deliberately and that is now verified.

**Changed**
- README uses the installed `agentcrew` command everywhere instead of
  `node bin/wizard.js`.
- `.gitignore` covers `*.tgz` so packing in-tree can't be committed.

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
