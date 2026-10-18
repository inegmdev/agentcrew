---
id: TASK-35
title: Stream agent replies and show typing state
status: Done
assignee: []
created_date: '2026-10-11 02:41'
updated_date: '2026-10-18 21:48'
completed_date: '2026-10-18 21:48'
resolution: completed
merged_pr: '#19'
labels:
  - chat
  - ux
dependencies: []
priority: medium
type: feature
ordinal: 33000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: replies take 5-10s per message (new CLI process) with no feedback in the terminal; the pixel room only shows a bubble after the answer lands. Adapters already target stream-json/jsonl.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Chat output streams token/line events over the PTY WebSocket
- [x] #2 Agent shows thinking state in the pixel room while a turn is running
- [x] #3 Failed or timed-out turn ends the thinking state
<!-- AC:END -->

## Implementation Summary
- Enabled incremental stdout line streaming via `PtyManager` and `ChatService`.
- Added PTY WebSocket chat turn stream frames (`chat_delta`, `chat_end`) to stream real-time output.
- Dispatched SSE thinking lifecycle events (`agent.thinking_started`, `agent.thinking_ended`) to render agent typing state in UI and team room.
- Ensured idempotent cleanup of thinking state on completion, failure, timeout, or socket disconnect.
- Verified in `test/chat/chat-service.test.js` and `test/server/agent-tui-websocket.test.js`.

