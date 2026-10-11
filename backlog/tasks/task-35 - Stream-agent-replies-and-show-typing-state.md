---
id: TASK-35
title: Stream agent replies and show typing state
status: To Do
assignee: []
created_date: '2026-10-11 02:41'
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
- [ ] #1 Chat output streams token/line events over the PTY WebSocket
- [ ] #2 Agent shows thinking state in the pixel room while a turn is running
- [ ] #3 Failed or timed-out turn ends the thinking state
<!-- AC:END -->
