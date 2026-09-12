---
id: decision-1
title: Hermes Agent replaces the agentcrew daemon as the orchestrator
date: '2026-09-12 12:57'
status: proposed
---
## Context

`src/daemon/` watches `backlog/tasks/*.md`, journals status transitions and
proposes memory consolidation. It does not launch agents, isolate worktrees,
or nudge a stalled worker. Those are the remaining gaps in MEMORY.md.

Closing them is not a cron. A nudge needs somewhere to land, which means
persistent per-worker sessions, delivery targets and failure tracking. That is
session management, and building it is the whole product, not a weekend.

NousResearch/hermes-agent already ships it: a gateway that ticks the scheduler
every 60s and runs due jobs in isolated sessions, `deliver=bot-chat:<profile>`
which posts cron output into a worker's canonical chat as a real incoming
message it then acts on, a per-job `failure_streak` that escalates to a review
nudge, isolated profiles under `~/.hermes/profiles/<name>/`, seven terminal
backends, and a dashboard on 127.0.0.1:9119.

It stores its board in SQLite (`hermes_cli.kanban_db`: tasks, task_links,
task_comments, task_events) under WAL with `BEGIN IMMEDIATE` and
compare-and-swap on critical fields, because a multi-agent board needs atomic
claims.

An earlier design proposed monkey-patching four functions of that module to
redirect them at the `backlog` CLI. Rejected: it covers one of four tables,
discards the CAS that makes claiming safe, targets a private module that any
release can refactor, and its `register()` swallows exceptions so a failed
hook silently falls back to SQLite.

## Decision

Adopt Hermes as the orchestration layer and retire `src/daemon/`'s scheduling
ambitions. Keep markdown as the record by fixing the direction of flow rather
than by replacing Hermes storage.

```text
backlog/tasks/*.md   ──intent──>  Hermes task  ──runs──>  result
  (record, in git)                (execution, ephemeral)
       ^                                                   |
       +──────────── bridge writes status back ────────────+
                       single writer, one way
```

- Backlog.md answers "what should be done". Hermes answers "what is running
  right now". Different questions, so they cannot disagree the way decision 1
  in MEMORY.md warns about.
- Status in markdown is written only by the bridge, never by hand and never by
  Hermes directly.
- Integrate only through documented extension points: plugins, model
  providers, skills, cron, gateway. No patching of private modules.
- An autonomous worker that hits a merge-conflicted task file stops and
  escalates. Conflict resolution stays the human's job.

## Consequences

- agentcrew becomes two-tier. The full tier needs Python, a gateway daemon and
  a global npm package. The corporate machine from MEMORY.md decision 4 has
  Gemini only and no install rights, so it gets the degraded tier: board,
  memory and instructions, no orchestration. This is accepted openly rather
  than discovered later.
- Upstream breakage is now a real risk. It is bounded because the integration
  uses public extension points, and because losing Hermes costs the
  orchestrator, never the tasks.
- Hermes passes the selection criterion only while markdown stays the record.
  If the record ever moves into `kanban.db`, this decision is void.
- `src/daemon/` keeps the parts Hermes does not cover: memory consolidation
  into `MEMORY.proposed.md`, and the markdown side of the bridge.
