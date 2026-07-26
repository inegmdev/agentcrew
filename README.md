# agentcrew

A setup wizard that turns any git repo into one an agent can work
autonomously — a task board, a memory layer, and a planning loop, wired
together and installed with a single command.

```mermaid
flowchart LR
    A["Planning<br/>grill-me → to-prd → to-issues"] -->|"tickets"| B["You pick<br/>what's worth doing"]
    B --> C["Board<br/>Backlog.md"]
    D["Memory<br/>MEMORY.md + daily logs"] -.->|"read at start<br/>written at end"| C
    E["GitHub Issues<br/>intake"] -->|"one-way"| C
```

## The rule everything here follows

**No login walls. No hosted services in the critical path. Your data in a
format you own.**

This project previously used a board that required an account for local
issue tracking, then shut down. It was open source — that wasn't enough.
The question that matters is *"can this take my data with it when it dies?"*

Everything here is markdown in your own repo. If every tool in this stack were
abandoned tomorrow, you would lose some nice terminal UIs and keep every task,
decision, and note.

## What gets installed

| Layer | Tool | Where your data lives |
|---|---|---|
| Board | [Backlog.md](https://github.com/MrLesk/Backlog.md) | `backlog/tasks/*.md` |
| Memory | plain markdown | `docs/MEMORY.md`, `memory/*.md` |
| Decisions | `backlog decision` | `backlog/decisions/*.md` |
| Planning | [mattpocock/skills](https://github.com/mattpocock/skills) | `.scratch/<feature>/` |

No database. No server. No account.

## Prerequisites

- git, Node.js ≥ 18, npm
- macOS, Linux, or Windows

## Quickstart

```bash
git clone <your-fork-url> agentcrew
cd agentcrew
node bin/wizard.js setup /path/to/your/project
```

Run it against as many projects as you like. Then:

```bash
node bin/wizard.js update    # re-applies everything to every registered project
```

## What `setup` does

1. Checks prerequisites and detects which agent CLIs you have (`claude`,
   `gemini`, `kimi`, `codex`, `cursor-agent`).
2. Installs Backlog.md and runs `backlog init`, which writes `CLAUDE.md`,
   `AGENTS.md`, and `GEMINI.md` so every agent gets the same instructions.
   Adds a **`Needs Attention`** status — the one column that means "a human
   is needed", whether the work finished or got stuck.
3. Scaffolds the memory layer: `docs/MEMORY.md` and `memory/`.
4. Merges the agentcrew block into all three agent instruction files.
5. Installs the planning skills.
6. Registers the project in `~/.agentcrew/state.json`.

Every step is idempotent. Re-running never duplicates a block, never
overwrites an existing `MEMORY.md`, and never touches your tasks.

## The memory layer

Split by **retention**, not by topic — so what loads each session stays flat
no matter how long the project runs.

| Tier | Where | Loaded |
|---|---|---|
| long-term | `docs/MEMORY.md` | every session (kept under ~200 lines) |
| decisions | `backlog decision list` | on demand |
| short-term | `memory/YYYY-MM-DD.md` | today + yesterday only |
| tasks | `backlog task list` | on demand |

Write to the daily log freely — it's append-only and disposable. Consolidation
then promotes anything still true in a month into `docs/MEMORY.md` and drops
the rest. Deleting old logs is safe, because git keeps them.

## The daemon

```bash
node bin/wizard.js daemon /path/to/project
```

Watches the board and reacts to work moving across it, so the memory layer
maintains itself:

| Task moves to | Daemon does |
|---|---|
| any status | appends the transition to `memory/<today>.md` |
| `Needs Attention` | prints a notification — a human is wanted |
| `Done` | runs a consolidation pass |

Consolidation is also available on demand:

```bash
node bin/wizard.js consolidate /path/to/project
```

**It writes `docs/MEMORY.proposed.md` and never overwrites `MEMORY.md`.**
That asymmetry is deliberate: appending to a log is safe, but consolidation
is *lossy by design* — it drops what didn't earn its place. An agent silently
rewriting your accumulated knowledge is the one failure here that would be
expensive and hard to notice, so a human accepts it.

The daemon holds no state of its own. Everything it produces is a file in
your repo, so stopping it loses automation, never data — which is the only
reason it's allowed to exist.

This follows [OpenClaw's memory model](https://docs.openclaw.ai/concepts/memory).
Cline's Memory Bank is the better-known alternative, but it splits by topic
and reads every file on every task — which gets more expensive as a project
grows, rather than staying flat.

## Tasks vs. GitHub issues

```text
GitHub Issues  →  intake. Bugs, requests, anything a human files.
      │
      │  one-way, manual, when you decide to work it
      ↓
Backlog.md     →  execution. In-repo, offline, versioned with the code.
```

Nothing syncs back. Two systems that both claim to know "what's being worked
on" will eventually disagree, and then neither can be trusted.

## Known manual steps (deliberate, not gaps)

- **`/setup-matt-pocock-skills`** — a prompt-driven skill. It reads your repo
  and makes judgment calls; that needs an LLM, not a shell script.
- **Filling in `docs/MEMORY.md`** — the wizard creates the file with a
  template. What goes in it is yours to write.

## Status

The board, memory layer, and daemon all work and are verified against real
installs. Not yet built: **worktree isolation and agent launching** — moving
a task to `In Progress` is journalled but does not yet spin up a worktree and
start an agent in it.

Only Claude Code's headless flag (`-p`) has been verified first-hand; the
other agents' flags are best-effort defaults and are marked as unverified in
`src/daemon/agents.js`. See `docs/MEMORY.md` for the full verified/unverified
split.
