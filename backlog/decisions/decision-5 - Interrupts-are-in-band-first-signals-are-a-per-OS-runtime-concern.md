---
id: decision-5
title: Interrupts are in-band first; signals are a per-OS runtime concern
date: '2026-09-19 16:15'
status: accepted
---
## Context

Takeover needs a way to stop an agent mid-task, and the obvious mechanism does
not port.

On POSIX the model is clean and documented: `SIGINT` ends the current turn,
while `SIGTERM` exits with code 143, leaves the turn unfinished but resumable,
terminates the process tree of any running shell command, and runs `SessionEnd`
hooks.

On Windows none of that holds. Node ignores the signal argument and force-kills
the process, so `SIGINT` degrades to the equivalent of `SIGKILL`. Delivering a
real Ctrl+C needs `GenerateConsoleCtrlEvent` against a new process group, which
Node cannot do without native code, and killing a tree needs `taskkill /T /F`.

The project targets Windows and Linux equally, so a signal-first design would
ship two different products.

## Decision

Three mechanisms, in this order.

1. **In-band interrupt, primary and portable.** Feature-detect from the
   `capabilities` array in the `system/init` event, for example
   `interrupt_receipt_v1` and `interrupt_cancel_queued_v1`, rather than
   comparing version strings. This is the path the vendor SDKs use over the
   same stdio channel, and it also cancels queued messages.
2. **Soft freeze, fully portable.** Return a `PreToolUse` deny while the
   session is `human_owned`. The turn stays alive and the agent simply cannot
   act. This doubles as enforcement for decision-3's takeover state machine.
3. **Hard kill, per-OS, in the runtime layer and never in an adapter.** POSIX
   escalates `SIGINT`, `SIGTERM`, `SIGKILL` against the process group of a
   detached child. Windows calls `taskkill /PID <pid> /T /F`.

Both interrupt strengths are recorded as events naming the actor and the
reason, per decision-3's forensics fields.

**This decision is contingent on a spike.** The stdin interrupt message is
undocumented for the raw CLI and there is an open upstream feature request for
it. Verify it against current `claude` and `agy` builds before building on it.

## Consequences

- The `runtime` axis from decision-3 earns its keep on day one, not when docker
  arrives.
- If the spike fails, Windows gets abort-and-resume where POSIX gets
  end-the-turn. That is a real behavioural difference and it goes in the docs
  rather than being discovered by a user.
- Every abort leaves a resumable session, because the session id is ours and
  `--resume` takes it back.
- A test that proves no orphan processes survive a hard kill is part of the
  adapter contract suite in decision-6, and it must run on both operating
  systems.
