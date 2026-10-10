---
id: TASK-15
title: Provider Plugin Engine & Turn Scheduler
status: To Do
assignee: []
created_date: '2026-10-10 22:31'
labels: []
milestone: m-1
dependencies:
  - TASK-14
priority: high
type: feature
ordinal: 13000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Execute single turns through the unified ProviderPlugin interface, enforcing the 4-turn global concurrency ceiling. Stream live turn events, messages, and tool activity to the browser via SSE and render in the Session inspector view.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 ProviderPlugin interface implemented for qualified CLI adapters
- [ ] #2 Scheduler enforces 4-turn global concurrency limit with safe queueing
- [ ] #3 Loopback SSE stream pushes normalized turn and tool events
- [ ] #4 Session inspector view renders live turn streaming, messages, and tool activity
<!-- AC:END -->
