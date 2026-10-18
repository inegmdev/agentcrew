---
id: TASK-32
title: 'Takeover is cosmetic: not tied to the agent''s real session'
status: Done
assignee: []
created_date: '2026-10-11 02:41'
updated_date: '2026-10-18 21:48'
completed_date: '2026-10-18 21:48'
resolution: completed
merged_pr: '#19'
labels:
  - takeover
dependencies: []
priority: high
type: bug
ordinal: 30000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: TakeoverController is a single global state machine (not per agent) and requestTakeover just waits 20ms. The PTY opened on takeover is a fresh bash, not the agent's conversation, and takeover never pauses real work. Contradicts PRD-CTRL-02 / TRD 8.1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Takeover state is tracked per agent identity
- [x] #2 Takeover actually quiesces that agent's in-flight turn within the 10s soft budget
- [x] #3 Two-tab takeover conflict returns an error (AT-05)
- [x] #4 Chat during takeover goes to the agent's own session, shell is a separate explicit mode
<!-- AC:END -->

## Implementation Summary
- Refactored `TakeoverController` to track per-agent session tokens and state machines with explicit quiescence checks and process group signaling.
- Enforced single-owner takeover with concurrent session rejection (`takeover_conflict` / AT-05).
- Integrated real agent PTY terminal session (`AgentTerminal` / `PtyManager`) retaining conversation context.
- Separated Chat turns from explicit Shell mode execution with human authorization checks.
- Verified in `test/session/takeover-controller.test.js`, `test/session/agent-terminal.test.js`, and `test/server/agent-tui-websocket.test.js`.

