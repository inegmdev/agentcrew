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

- [session_2026_08_22](archived/session_2026_08_22.md) — memory layer moved
  under `docs/memory/`; AGENTS.md became the only rules file (0.5.0).
- [session_2026_09_12](archived/session_2026_09_12.md) — grill session on the
  CLIProxyAPI + Hermes design doc; produced decision-1 and decision-2.

## Active logs

<!-- Day sections follow. Append today's notes under `## YYYY-MM-DD`. -->

## 2026-09-19

Design session that reversed decision-1: **we build the orchestrator, not
Hermes.** The forcing requirement is human takeover of a running session, which
is impossible when another program owns the session internally.

The full argument now lives in `backlog/decisions/`, so read decision-3 through
decision-6 rather than re-deriving it here. What is worth keeping loose:

- Both `claude` and `agy` expose the same shape: `--session-id <uuid>`,
  `--resume`, `--input-format stream-json`, `--output-format stream-json`, and
  lifecycle hooks. That convergence is what makes one supervisor viable.
- `Notification` hook types include `agent_needs_input`, `permission_prompt`
  and `idle_prompt`, so "the agent is stuck asking a question" arrives as a
  push rather than an inference.
- Traps found while reading the docs, all recorded in decision-3: never pass
  `--bare` (it skips hook discovery); keep the watchdog above
  `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`; check a child-written nonce rather
  than a pid.
- Terms sweep stands: no vendor credentials anywhere near CI, and no exposed
  endpoint at all (decision-2, decision-6).

**Written up and committed:** decision-1 superseded, decision-2 revised and
accepted, decision-3 to decision-6 written and accepted, board seeded with
task-1 through task-9 where task-1 is the gating spike. MEMORY.md decision 4
corrected (permitted CLI, not install rights) and distilled back under its
line cap. Gemini stays as a mocked adapter for legacy corporate users, shipped
unverified until someone records a real session.
