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


## 2026-10-11

Implemented the documentation plan from the October design interview; application
implementation remains future work. Added detailed `docs/PRD.md` and `docs/TRD.md`:
role contracts, setup/settings, session control, handoffs, popup change tracking,
worktrees/integration, memory/skills, dashboard suite, metrics, diagnostics, and
requirement-to-test traceability.

Preserved the September `PRODUCT.md` body under
`docs/archive/PRODUCT-supervisor-2026-09-19.md`. `PRODUCT.md` now preserves its old
numbered headings as mappings into the new documents; README distinguishes the
built installer/watcher from the proposed workspace.

Corrections to September assumptions: provider protocols are not interchangeable;
internal session IDs differ from native IDs; Gemini streaming output does not prove
interactive control. Earlier claims about provider retirement/account terms are
historical and must be freshly verified before use. Human takeover allows
human-directed tools. Frontend dependencies are allowed; full autopilot may apply
memory proposals, while diagnostic governing-rule changes still need human approval.

Provider requirement is now agy + Codex + Gemini; no authenticated provider tests or
Gemini install performed during documentation work. Proposed engineering defaults
(Node 24, React/TypeScript/Vite, HTTP/SSE, database worker) are labeled proposals,
not interview-selected technology. Existing package/runtime behavior is unchanged.

Backlog CLI absent from PATH. Temporary Backlog.md 1.52.0 installation used for task
and decision records; its bookkeeping requires writes under `.git/backlog.md`.
Existing untracked `package-lock.json` is unrelated and left untouched.

Decision-7 records accepted product changes and explicit supersessions of
September assumptions; decision-8 records the proposed technical baseline.
Documentation task: task-12. Validation passed: local links/anchors, balanced
code fences, all 54 requirement mappings and 16 acceptance scenarios, all 57
legacy numbered headings preserved, historical spec body byte-for-byte in the
archive, long-term memory at 200 lines, and `git diff --check`. No application
tests/CI run: documentation-only changes and no existing suite/workflow.

Verified PRD and TRD documents against the Codex design transcript; confirmed
full coverage of team contracts, provider qualifications, popup tickets, and
dashboards. Opening PR for AI Team Workspace documentation.
