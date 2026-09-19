# Short-term memory

Append-only working log. One `## YYYY-MM-DD` section per day, newest at the
bottom. Write here freely and without judgement — cheap to add, cheap to throw
away.

Agents read the **recent** sections at session start, not the whole file. That
window is the point: it keeps session cost flat no matter how long the project
runs.

## 🧹 Archiving

This file is cleaned up periodically, never truncated:

1. Move old day sections into a new file in `docs/memory/archived/`, named
   `session_YYYY_MM_DD.md`.
2. Clear those sections from **Active logs** below.
3. Link the new file under **Archive index**.

The archive keeps the complete, untouched context of past conversations —
deleting is what this policy exists to prevent.

## Archive index

<!-- One link per archived session, newest last. -->

_Nothing archived yet._

## Active logs

<!-- Day sections follow. Append today's notes under `## YYYY-MM-DD`. -->

## 2026-08-21

- 22:27 memory layer restructured → docs/memory/ (MEMORY.md, MEMORY_SHORTTERM.md, archived/); archiving policy added to the agentcrew block; 0.5.0
- 22:27 migration lives in scaffoldMemory.js — legacy docs/MEMORY.md moves, memory/*.md logs become indexed archives; verified idempotent

## 2026-08-22

- 00:40 AGENTS.md is now the only rules file; CLAUDE.md/GEMINI.md are one-line @AGENTS.md redirects, hand-written rules folded in before replacement

## 2026-09-12

- grilled an incoming design doc: CLIProxyAPI + Hermes Agent + a `.hermes/plugins/backlog-kanban` monkey patch of `hermes_cli.kanban_db` → backlog CLI
- verified real: Hermes Agent, its dashboard (127.0.0.1:9119), project plugins gated by `HERMES_ENABLE_PROJECT_PLUGINS`, and `hermes_cli.kanban_db`
- `kanban_db` owns tasks + task_links + task_comments + task_events, WAL, `BEGIN IMMEDIATE`, CAS on claims. Patching 4 functions leaves the rest on SQLite → split brain, and claim loses atomicity (two workers, one task)
- doc repeats the `--json` error MEMORY.md decision 5 was written about (`--plain` only), and names the package `@mrlesk/backlog` instead of `backlog.md`
- open decision: this overlaps `src/daemon/` entirely. Either Hermes replaces our daemon or we don't take Hermes. Two orchestrators = decision 1's failure mode
- CLIProxyAPI fails the selection criterion (login wall + undocumented upstream in the critical path) and conflicts with decision 4 (corporate machine, Gemini only, no install rights)
- terms sweep: Anthropic bans subscription OAuth in third-party tools (4 Apr 2026, enforced server-side, 400 + billed as extra usage); Google banned third-party tools/proxies on Antigravity quota and killed Gemini CLI for free/Pro/Ultra (18 Jun 2026); OpenAI subs are personal-use, programmatic access outside the API restricted
- but `claude -p` headless is documented and still draws on subscription limits, so a **subprocess** wrapper is a different animal from a credential proxy — the credential never leaves the official client. Caveats: team sharing of one endpoint is account sharing, sustained automated traffic can trip abuse classifiers
- bigger objection to wrapping a CLI as `/v1/chat/completions` is technical, not legal: stateless completions replay history through a full agent loop, and the CLI runs its own tools instead of emitting `tool_calls`, so Hermes's tool protocol breaks silently. Delegation ≠ completion endpoint
- agentcrew now dogfoods its own board: `backlog init --integration-mode none` → `backlog/config.yml` + `backlog/decisions/`. Wrote decision-1 (Hermes replaces the daemon) and decision-2 (never proxy credentials), both `proposed`
- installed backlog.md resolved to **1.52.0**; MEMORY.md's verified-facts block still says 1.48.0. Re-spike before trusting those notes

## 2026-09-19

Design session. Direction reversed from decision-1: **we build the orchestrator, not Hermes.**
The forcing function is human takeover of a running session — you cannot hand a human a
session another program owns internally. Numbered points as discussed:

- **#1** adapters normalise into *our own* event schema; an OpenAI-compatible facade is an
  optional output adapter later, never in the hot path. Chat-completions cannot carry
  permission requests, tool events, session ids or cost, which are the health signals.
- **#2** no message hashing. Both `claude` and `agy` accept `--session-id <uuid>` and
  `--resume`, so we mint the id and use it as the primary key.
- **#3** stuck ladder, cheapest first: hook pushes (`Notification` with `agent_needs_input`,
  `permission_prompt`, `idle_prompt`; `Stop`; `SessionEnd`) → deterministic stream analysis →
  LLM watchdog → wall-clock as the liveness net under everything.
  Busy is a supervisor-owned flag: input is queued, never rejected, so there is no
  backpressure to read. Feed it from `--replay-user-messages` acks, turn `result` events, hooks.
  Health is an enum, not a boolean: working / waiting_for_input / rate_limited / stuck /
  crashed / done. `system/api_retry` carries the rate-limit and auth categories.
  Traps: **never `--bare`** (skips hook discovery, kills tier 0); keep our timeout above
  `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS` (10 min default) or we fight the CLI; check a
  child-written nonce, not the pid, because pids get reused.
- **#4** transport is the CLI's own stdio (`--input-format stream-json`), not the Agent SDK.
- **#5** two axes: `adapter` (which CLI) vs `runtime` (local / worktree / docker / ssh).
  Conflating them means rewriting every adapter when docker lands.
- **#6** DB lives at `~/.agentcrew/projects/<id>/`, never in the repo (`git clean -xdf`).
  Project identity = a uuid inside `.git/` (survives clean and moves, distinct per clone,
  never committed); resolve via `git rev-parse --git-common-dir` for worktrees.
  Orphans are marked `unreachable`, never auto-deleted; UI offers relocate or typed-confirm
  delete. One daemon per project, sole writer, own port in the registry, lock file.
  Events table holds small rows only; large payloads spill to content-addressed blobs.
- **#7** interrupts: signals are **not** portable. POSIX has SIGINT (ends the turn) and
  SIGTERM (exit 143, turn unfinished but resumable). On Windows Node ignores the signal and
  force-kills. So: in-band interrupt first (feature-detect `interrupt_receipt_v1` in
  `system/init.capabilities`), `PreToolUse` deny as the portable soft freeze, per-OS hard kill
  in the runtime layer. **Spike the stdin interrupt before building on it** — undocumented,
  open feature request upstream.
- **#8** full tier only. Corrects MEMORY.md decision 4: nothing needs admin
  (`npm config set prefix ~/.local`). Real corporate blockers are no Node, TLS-intercepting
  proxies, account policy, endpoint protection killing daemons, port binding. The constraint
  is *which CLI is permitted*, not install rights.
- **#9** order: claude, then agy. Gemini CLI is dead for free/Pro/Ultra; API-key path unverified.
- **#10** forensics: ship the *schema* in phase 1, the explorer UI later. `started_by` and
  `ended_by` as `{reason, actor, caused_by}`, and `caused_by` on every event. Causality cannot
  be backfilled. Do not poll `ps`; `PostToolUse`/`PostToolUseFailure` give tool-level truth.
- **#11/#12/#13** testing: fake CLI binaries + recorded fixtures, contract suite per adapter,
  injected clock/ids/fs root, `agentcrew doctor --json` as the user-facing CI gate, idempotency
  job. No live credentials in CI at all.

Repo state: no tests, no `.github/`, zero dependencies. Use `node:test` and keep it that way.
