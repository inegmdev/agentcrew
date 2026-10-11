---
id: decision-8
title: Proposed technical baseline for the AI Team Workspace
date: '2026-10-10 21:33'
status: proposed
---
## Context

Decision-7 accepts the product direction. Implementers also need a coherent
technical design without mistaking new engineering choices for interview decisions.
The detailed baseline is [docs/TRD.md](../../docs/TRD.md); this record captures
its major proposed choices and why. Status remains **proposed**.

## Decision

Propose the following implementation baseline:

- One supervisor per project serves the local browser application. HTTP JSON
  commands and replayable SSE avoid a separate deployment for the v1 UI.
- Node 24 for the future platform; existing CommonJS modules remain usable.
  React/TypeScript/Vite for the dashboard bundle; local CSS/sprites for the room.
  This changes neither package.json nor installed runtime requirements today.
- node:sqlite in a single database worker, WAL, durable command/outbox records,
  normalized events, rebuildable projections, blob/archive storage outside Git.
- Persistent agent identity separate from assignment, internal conversation ID,
  provider-native conversation/turn IDs, and OS process identity.
- Provider plugin contract with actual capability evidence. Codex app-server is
  a candidate transport; other provider transports must be established by spikes.
  A future REST provider must supply the whole agent/session contract, not only
  forward text completion requests.
- Runtime process lifecycle separate from Git worktree placement and provider
  protocol. Worktree isolation does not imply a security sandbox.
- Fixed workflow engine enforces revision-bound gates; scheduler uses assignment
  leases/fencing and shared provider capacity. Waiting for reviews does not reserve
  a running slot when the process is quiescent.
- Serialized artifact bridge and Backlog CLI operations; stable correlation,
  readback, and reconciliation cover filesystem/DB/external side-effect gaps.
- gh owns GitHub authentication; repository integration handles PR/check/merge
  operations and reconciles uncertain results using current remote state.
- Protected loopback UI with origin validation, local session authorization,
  CSRF defenses, safe Markdown rendering, and bounded inputs/event queues.
- Credential-free CI with fake provider processes, recorded/sanitized fixtures,
  local Git tests, browser tests, and Windows/Linux execution. Authenticated
  provider qualification is separate and mandatory.

Exact schemas, state transitions, operation budgets, API contracts, test coverage,
and verification gates are in the TRD. They are proposed design defaults, not
measured behavior of an implemented system.

## Consequences

This keeps the framework independent of provider protocols while avoiding a
fully generic plugin platform. The first real adapters test whether the chosen
interface hides enough provider-specific complexity.

The database/file/GitHub operation journal increases implementation work but
makes failures observable and replay safe. Exactly-once external execution is
not promised; uncertain effects are reconciled before another attempt.

A bundled UI is simpler for one project than the prior separate multi-database
reader. Multi-project aggregation may require a later ADR; it is not designed
into the v1 release requirement.

The runtime-floor and library selections require implementation-time dependency,
packaging, platform, and performance checks before adoption. Failed provider
capability spikes require a recorded correction rather than invented flags or
silent scope reduction. Acceptance of decision-7 does not automatically accept
this proposed technical record.
