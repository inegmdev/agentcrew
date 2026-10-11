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
dashboards. Opened PR #7 for AI Team Workspace documentation.

Executed full TDD implementation across all 12 tasks in milestone m-1 (TASK-13
through TASK-24). Built ProviderPlugin adapters (agy, Codex, Gemini), MockCLI test
harness, WorkspaceManager with 13 agent identities, TurnScheduler with 4-concurrency
limit, TakeoverController, RequirementsManager, TaskLifecycleManager with Architect
gates, QualityVerificationManager with commit-bound approvals, IntegrationStrategyManager,
PopupScopeChangeEngine, VirtualTeamRoom, ObservabilityEngine, and IterationRunner.
All 31 unit, contract, and integration tests passing green.

Executed full TDD implementation for milestone m-2 (TASK-25, TASK-26, TASK-27):
built SupervisorServer HTTP/SSE daemon implementing TRD §12 (/api/v1/workspace,
/readiness, /settings, /agents, /tasks, /popups, /metrics, /commands, /events),
interactive Web UI single-page dashboard bundle in src/server/public/ with
4x4 isometric Virtual Team Room, Kanban board, takeover console, and observability,
and added `agentcrew server [port]` CLI command to bin/wizard.js and npm run server.
All 49 unit, contract, and integration tests passing green.

Implemented authentic 2.5D pixel-art isometric virtual room in `src/server/public/pixel-room.js`
with PixelRoomRenderer: 6x6 isometric floor tiles, office walls, window skyline,
water cooler, potted plants, server rack, 13 custom workstation desks with glowing screens,
custom pixel avatars with role-themed attire, animated speech/activity bubbles,
and interactive hover/click inspector. 50 tests passing green.

Revamped Web UI dashboard with Impeccable design standards: left sidebar navigation
with brand header and stream telemetry; dual theme support (light as default, dark
toggleable) with CSS design tokens and localStorage persistence; theme-adaptive
PixelRoomRenderer palettes (light parquet/office walls vs dark cyber-office); and
creative free SVG vector icons throughout sidebar and full-screen view headers.
All 50 unit and integration tests passing green.

Integrated complete modern Analytics Dashboard style & data architecture:
built typed `src/server/public/analytics-dashboard-data.ts` and `.js` with all 13
agent identities, KPI metrics with sparklines and rolling slot-machine values,
SVG activity & commit chart, searchable repositories/worktrees grid, and
Code Review queue with docked/sliding PR details panel (problem, approach, stats)
and interactive AI Assistant Q&A composer with thinking shimmer. Added Settings
appearance accent color switcher (blue, violet, teal, amber). All 51 tests passing green.

Configured `docs/assets/logo.jpeg` as the official web application logo and favicon:
added JPEG MIME type mapping to `SupervisorServer`, updated `.brand-icon` and
`<link rel="icon">` in `index.html`, and added test assertions. 52 tests passing green.

Closed GitHub Issue #8 (Spec: AI Team Workspace v1) following merge of PR #7 to main.
Added `agentcrew iterate [goal]` CLI command in `bin/wizard.js` orchestrating full 13-agent
iteration lifecycles. Connected interactive operator command execution bar in Web UI
Takeover Console (`session.exec`) streaming outputs directly to the terminal log.
All 53 unit, contract, and workflow tests passing green.
