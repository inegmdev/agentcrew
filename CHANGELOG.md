# Changelog

## Unreleased

Architecture only. No runtime code changed; this is the design record for the
turn from installer to supervisor, plus the board it will be built on.

**Added**
- `PRODUCT.md`, the normative specification: use cases, event model, health
  tiers, takeover protocol, storage layout, adapter and runtime interfaces, UI
  surfaces, testing contract, and the constraints that do not bend. Every task
  on the board cites it by section, so an agent picking one up has the
  decisions already made. Where it and a decision record disagree, the decision
  wins and the spec is wrong.
- agentcrew now dogfoods its own board. `backlog init --integration-mode none`
  writes `backlog/config.yml` and nothing else, so the repo gets a board and
  a decisions directory without a second set of agent instruction files.
- `decision-3` — **agentcrew is the orchestrator.** A session supervisor over
  CLI adapters. Human takeover of a running session is the forcing
  requirement: you cannot hand a person a session another program owns.
  Covers the adapter/runtime split, the four-tier health ladder, the takeover
  state machine, and forensics fields that ship as schema in phase one because
  causality cannot be backfilled.
- `decision-4` — **intent versus events.** Tasks, decisions and memory stay as
  markdown in the repo. Transcripts, process rows and heartbeats go to a
  per-project SQLite store under `~/.agentcrew/`, never inside the project,
  because `git clean -xdf` deletes it. Project identity is a UUID inside
  `.git/`, which survives a clean and a move, stays distinct per clone, and is
  never committed.
- `decision-5` — **interrupts are in-band first.** Signals do not port: POSIX
  has SIGINT to end a turn and SIGTERM to kill, while Node on Windows ignores
  the signal and force-kills. So the portable path is an in-band interrupt
  with feature detection, a `PreToolUse` deny as the soft freeze, and a per-OS
  hard kill isolated in the runtime layer.
- `decision-6` — **mocked CLIs, no vendor credentials in CI.** Fake binaries
  and recorded fixtures drive everything; drift detection moves to a
  maintainer's machine as a fixture refresh. Gemini CLI is kept as a mocked
  adapter for locked-down corporate machines, shipped unverified.
- The `Supervisor v1` milestone, `task-1` through `task-10`. Two entry points
  run in parallel: `task-10`, a clickable mockup driven by a hand-written
  sample event stream, and `task-1`, a protocol spike against real `claude`
  and `agy` builds. The mockup comes before the schema deliberately, so the
  screens and the event shape are designed against each other rather than the
  screens being fitted to whatever the schema turned out to be.

**Changed**
- `decision-1` marked **superseded**. Adopting Hermes Agent as the orchestrator
  was the right instinct about not rebuilding a tested scheduler, and the wrong
  conclusion once takeover became a requirement. The rejection of the
  `hermes_cli.kanban_db` monkey patch stands on its original grounds.
- `decision-2` revised and accepted. The earlier version hedged that any
  subprocess wrapper would be single-user by construction. There is now no
  listener at all, so account sharing is designed out rather than warned about.
- MEMORY.md decision 4 corrected: the constraint on a corporate machine is
  **which agent CLI is permitted and present**, not install rights. Nothing in
  the stack needs admin.
- Short-term memory archived per its own policy: the August and 2026-09-12
  sections moved into `docs/memory/archived/` and linked from the index.

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
