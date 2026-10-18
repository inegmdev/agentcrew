---
id: TASK-33
title: Chat vs shell classification is a fragile regex
status: Done
assignee: []
created_date: '2026-10-11 02:41'
updated_date: '2026-10-18 21:48'
completed_date: '2026-10-18 21:48'
resolution: completed
merged_pr: '#19'
labels:
  - chat
  - takeover
dependencies: []
priority: medium
type: bug
ordinal: 31000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: input is classified as shell if it starts with ls|cd|git|find|make|which|... so natural language like 'find the riskiest module' or 'make a plan' runs as a shell command, and 'Hi' only avoided bash by luck. Same regex is duplicated in the WebSocket handler and session.exec.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Explicit Chat/Shell mode toggle in the Takeover Console, default Chat
- [x] #2 Single shared classifier (or none) used by WebSocket and session.exec
- [x] #3 Test: 'find the riskiest module' is sent to chat, '!git status' runs in shell
<!-- AC:END -->

## Implementation Summary
- Created centralized input resolver `src/session/input-mode.js` with `resolveInputMode()`.
- Added UI mode selector in Takeover Console defaulting to Chat; supports explicit mode toggle and `!` prefix escape for single shell execution.
- Replaced fragile command regexes across WebSocket handlers and `session.exec` endpoints.
- Verified in `test/session/input-mode.test.js` and `test/server/session-input-mode.test.js`.

