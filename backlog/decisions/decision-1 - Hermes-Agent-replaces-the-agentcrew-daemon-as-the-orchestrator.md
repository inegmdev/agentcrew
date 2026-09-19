---
id: decision-1
title: Hermes Agent replaces the agentcrew daemon as the orchestrator
date: '2026-09-12 12:57'
status: superseded
---
## Context

`src/daemon/` watches `backlog/tasks/*.md`, journals status transitions and
proposes memory consolidation. It does not launch agents, isolate worktrees,
or nudge a stalled worker.

Closing those gaps is not a cron. A nudge needs somewhere to land, which means
persistent per-worker sessions, delivery targets and failure tracking.
NousResearch/hermes-agent already ships all of it: a gateway scheduler,
`deliver=bot-chat:<profile>` into a live worker's chat, per-job
`failure_streak` escalation, isolated profiles, seven terminal backends and a
dashboard.

This decision proposed adopting Hermes as that layer and retiring the daemon's
scheduling ambitions, keeping markdown as the record by fixing a one-way flow
from backlog intent to Hermes execution and back.

## Decision

**Superseded by decision-3.** Do not adopt Hermes.

The requirement that broke it is human takeover of a running session. Hermes
keeps sessions inside its own profiles and delivers to a bot chat, so there is
no handle to give a person mid-task. Once agentcrew must own the session
lifecycle to support takeover, Hermes's scheduler and delivery machinery stop
paying for themselves.

The rejection of the `hermes_cli.kanban_db` monkey patch still stands, for the
reasons recorded below.

## Consequences

Kept from this decision, and carried into decision-3 and decision-4:

- Markdown stays the record. Direction of flow is fixed and single-writer.
- Never patch a private module of a dependency. Public extension points only.
- An autonomous worker that hits a merge-conflicted task file stops and
  escalates rather than resolving it.

Dropped:

- The two-tier product split. agentcrew is full tier only, see decision-3.
- The claim that a corporate machine lacks install rights. It does not; the
  real constraint is which agent CLI is permitted and present.

Rejected here and still rejected: patching four functions of
`hermes_cli.kanban_db` to redirect them at the `backlog` CLI. It covers one of
four tables, discards the compare-and-swap that makes claiming safe, targets a
private module, and its `register()` swallows exceptions so a failed hook
silently falls back to SQLite.
