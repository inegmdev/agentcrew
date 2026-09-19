# agentcrew

A setup wizard that turns any git repo into one an agent can work
autonomously — a task board, a memory layer, and a planning loop, wired
together and installed with a single command.

```mermaid
flowchart LR
    A["Planning<br/>grill-me → to-prd → to-issues"] -->|"tickets"| B["You pick<br/>what's worth doing"]
    B --> C["Board<br/>Backlog.md"]
    D["Memory<br/>MEMORY.md + short-term log"] -.->|"read at start<br/>written at end"| C
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
| Memory | plain markdown | `docs/memory/` |
| Decisions | `backlog decision` | `backlog/decisions/*.md` |
| Planning | [mattpocock/skills](https://github.com/mattpocock/skills) | `.scratch/<feature>/` |

No database. No server. No account.

The supervisor now being designed adds a local event store outside your repo,
which does not change that rule: intent stays as markdown you own, and the
store holds transcripts and process history. See
[Where this is going](#where-this-is-going).

## Prerequisites

- git, Node.js ≥ 18, npm
- macOS, Linux, or Windows

## Quickstart

From inside the project you want to onboard:

```bash
npx github:inegmdev/agentcrew setup .
```

That's it. No clone, no npm account, nothing to publish — npx fetches
straight from the public repo and runs it.

If you'll use it often, install it once and drop the `npx`:

```bash
npm install -g github:inegmdev/agentcrew

agentcrew setup .        # onboard the project you're standing in
agentcrew update         # re-apply to every project you've onboarded
agentcrew daemon .       # watch the board, keep memory current
```

Onboard as many projects as you like — `update` walks all of them.

## What `setup` does

1. Checks prerequisites and detects which agent CLIs you have (`claude`,
   `gemini`, `kimi`, `codex`, `cursor-agent`).
2. Installs Backlog.md and runs `backlog init`, which writes `CLAUDE.md`,
   `AGENTS.md`, and `GEMINI.md`. Adds a **`Needs Attention`** status — the one
   column that means "a human is needed", whether the work finished or got
   stuck.
3. Scaffolds the memory layer under `docs/memory/`: `MEMORY.md`,
   `MEMORY_SHORTTERM.md`, and `archived/`. A pre-0.5 layout is migrated in
   place — `docs/MEMORY.md` moves, and old `memory/*.md` logs become archived
   sessions.
4. Merges the agentcrew block into `AGENTS.md`, and reduces `CLAUDE.md` and
   `GEMINI.md` to a one-line redirect to it. One file holds the rules, so
   three copies can't drift apart. Rules you wrote by hand in either file are
   folded into `AGENTS.md` first — nothing is dropped.
5. Installs the planning skills.
6. Registers the project in `~/.agentcrew/state.json`.

Every step is idempotent. Re-running never duplicates a block, never
overwrites an existing `MEMORY.md`, never deletes a log, and never touches
your tasks.

## One rules file

```text
AGENTS.md   ←  every rule lives here
CLAUDE.md   →  "All agent rules live in @AGENTS.md — read that file."
GEMINI.md   →  same one-liner
```

Claude Code and Gemini CLI both expand an `@file` reference, so the redirect
loads the real rules rather than hoping the agent follows a hint. Editing
`AGENTS.md` changes what every agent reads.

## The memory layer

Split by **retention**, not by topic — so what loads each session stays flat
no matter how long the project runs. All of it lives in one directory:

```text
docs/memory/
  MEMORY.md              long-term, distilled, ~200 lines
  MEMORY_SHORTTERM.md    archive index + active `## YYYY-MM-DD` sections
  archived/
    session_YYYY_MM_DD.md   retired logs, whole and untouched
```

| Tier | Where | Loaded |
|---|---|---|
| long-term | `docs/memory/MEMORY.md` | every session (kept under ~200 lines) |
| decisions | `backlog decision list` | on demand |
| short-term | `docs/memory/MEMORY_SHORTTERM.md` | recent day sections only |
| archives | `docs/memory/archived/` | on demand, for a past conversation |
| tasks | `backlog task list` | on demand |

Write to the short-term log freely — it's append-only, one `## YYYY-MM-DD`
section per day. Consolidation then promotes anything still true in a month
into `docs/memory/MEMORY.md` and drops the rest.

### 🧹 Cleanup is archiving, not deletion

When the short-term log gets long, old day sections are **moved**, never
dropped:

1. Move them into `docs/memory/archived/session_YYYY_MM_DD.md` — one file per
   archived session, kept whole.
2. Clear those sections from the short-term file's **Active logs**.
3. Link the new file under its **Archive index**.

Git would keep deleted logs too, but nobody ever goes looking there. A linked
archive stays reachable, so past conversations survive with their full context
while what loads each session stays small.

## The daemon

```bash
agentcrew daemon /path/to/project
```

Watches the board and reacts to work moving across it, so the memory layer
maintains itself:

| Task moves to | Daemon does |
|---|---|
| any status | appends the transition under today's section in `MEMORY_SHORTTERM.md` |
| `Needs Attention` | prints a notification — a human is wanted |
| `Done` | runs a consolidation pass |

Consolidation is also available on demand:

```bash
agentcrew consolidate /path/to/project
```

**It writes `docs/memory/MEMORY.proposed.md` and never overwrites `MEMORY.md`.**
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
- **Filling in `docs/memory/MEMORY.md`** — the wizard creates the file with a
  template. What goes in it is yours to write.
- **Archiving the short-term log** — which conversation is over, and where one
  session's context ends, is a judgment call. The workflow is written into
  every onboarded repo's agent instructions, so your agent can do it on
  request; nothing archives on a timer.

## Where this is going

agentcrew is growing from an installer into a **supervisor**: it will own agent
sessions rather than firing them and hoping. The requirement that drives it is
human takeover — you watch the board, see an agent stuck, and take the wheel
mid-task. You cannot do that with a session another program owns.

### The loop it is built around

```mermaid
sequenceDiagram
    actor Dev as You
    participant Board as Board
    participant Sup as Supervisor
    participant CLI as Agent CLI
    participant Store as Event store

    Dev->>Board: promote a task
    Board->>Sup: intent
    Sup->>CLI: spawn with a minted session id
    Sup->>Board: status becomes In Progress
    CLI-->>Sup: stream of events
    Sup->>Store: append every event

    Note over CLI: the agent hits a wall
    CLI-->>Sup: hook push, agent_needs_input
    Sup->>Store: health becomes waiting_for_input
    Sup-->>Dev: surfaced on the board

    alt a nudge is enough
        Sup->>CLI: resume with guidance
    else a human is needed
        Dev->>Sup: take over
        Sup->>CLI: deny further tool calls
        Dev->>CLI: drive the session directly
        Dev->>Sup: release
    end

    CLI-->>Sup: result
    Sup->>Store: ended_by completed
    Sup->>Board: status becomes Done
```

Intent flows one way, from the board into a session. Only coarse status comes
back, written by a single writer, so the two can never disagree about what is
being worked on.

### Where each kind of data lives

```mermaid
flowchart TB
    subgraph git["In your repo, versioned in git"]
        T["backlog/tasks/*.md<br/>intent"]
        D["backlog/decisions/*.md"]
        M["docs/memory/<br/>long-term and short-term"]
    end

    subgraph home["Outside the repo, under ~/.agentcrew"]
        REG["registry<br/>id, path, port, pid"]
        DB[("per-project SQLite<br/>events, sessions, processes")]
        BLOB["blobs/<br/>large tool payloads"]
    end

    subgraph run["Running"]
        SUP["Supervisor<br/>one daemon per project"]
        AD["Adapter<br/>claude, agy, gemini, mock"]
        RT["Runtime<br/>local, worktree, docker, ssh"]
        AG["Agent CLI process"]
    end

    UI["Web UI"]

    T -->|"intent"| SUP
    SUP -->|"coarse status only"| T
    SUP --> AD --> RT --> AG
    AG -->|"stream-json"| AD
    AG -->|"hook pushes"| SUP
    AD -->|"normalised events"| SUP
    SUP -->|"small rows"| DB
    SUP -->|"payloads over the row cap"| BLOB
    DB -.->|"hash reference"| BLOB
    SUP --> REG
    SUP -->|"day sections"| M
    UI -->|"read only"| DB
    UI -->|"discovers projects"| REG
```

Tasks, decisions and memory are intent: hand-edited, reviewed, and yours in
markdown. Transcripts, process rows and heartbeats are events: append-only,
machine-queried, and far too chatty for git. The store sits outside the repo
because `git clean -xdf` would delete it.

What that means in practice:

| Piece | Shape |
|---|---|
| Adapters | one per CLI, normalising into agentcrew's own event schema |
| Runtimes | local first; git worktree, docker and ssh are the same seam later |
| Health | hook pushes, then deterministic signals, then an LLM watchdog, with a wall clock underneath |
| Takeover | a state machine, enforced by denying the agent's tool calls while a human holds it |
| Archive | every conversation and process, with what started it and what ended it |

Two rules it will not bend. **No vendor credential is ever handled, forwarded
or proxied** — the official binaries authenticate themselves, and nothing is
exposed on a port. And **no vendor credentials in CI**: tests run against
mocked CLIs and recorded fixtures, so the suite works on a fork with no secrets
configured.

The full specification, including the event model, the health tiers, the
takeover protocol and the storage layout, is in [`PRODUCT.md`](PRODUCT.md).
It is normative: every task on the board cites it by section. The reasoning
behind it, including what was rejected and why, is in
[`backlog/decisions/`](backlog/decisions/). Start at `decision-3`.

## Status

The board, memory layer, and daemon all work and are verified against real
installs. The supervisor above is **designed, not built** — it sits on the
board as the `Supervisor v1` milestone, `task-1` through `task-10`.

Two things start it, and they run in parallel. `task-10` is a clickable
mockup, so the screens can be argued about before anything is built. `task-1`
is a protocol spike against the real CLIs, because one mechanism the design
depends on is undocumented for the raw CLI. Everything else waits on one of
them.

Not yet built: worktree isolation and agent launching. Moving a task to
`In Progress` is journalled but does not yet spin up a worktree and start an
agent in it.

Only Claude Code's headless flag (`-p`) has been verified first-hand; the
other agents' flags are best-effort defaults and are marked as unverified in
`src/daemon/agents.js`. Gemini CLI is kept deliberately for locked-down
corporate machines even though Google retired it for the consumer tiers, and
ships marked unverified. See `docs/memory/MEMORY.md` for the full
verified/unverified split.
