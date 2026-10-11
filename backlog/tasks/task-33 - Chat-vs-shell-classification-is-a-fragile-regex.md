---
id: TASK-33
title: Chat vs shell classification is a fragile regex
status: To Do
assignee: []
created_date: '2026-10-11 02:41'
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
- [ ] #1 Explicit Chat/Shell mode toggle in the Takeover Console, default Chat
- [ ] #2 Single shared classifier (or none) used by WebSocket and session.exec
- [ ] #3 Test: 'find the riskiest module' is sent to chat, '!git status' runs in shell
<!-- AC:END -->
