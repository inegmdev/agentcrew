---
id: TASK-47
title: "Channel @agent Mention Parser & Background Turn Dispatch"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - chat
  - scheduler
  - agents
milestone: m-3
dependencies:   - TASK-46
priority: high
type: feature
ordinal: 45000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Enable mentioning agents in #team-activity (e.g. '@Dev-1 please test PR #19'), parsing mentions, triggering autonomous turns via TurnScheduler, and streaming replies into the feed.

**Blocked by:** TASK-46
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Parser extracts `@<agent-id>` or `@<role>` mentions from room messages
- [ ] #2 Dispatches an autonomous turn to the targeted agent with room context via TurnScheduler
- [ ] #3 Agent response streams back into #team-activity with typing indicator and agent avatar
- [ ] #4 Multiple mentions in one prompt queue separate coordinated turns
- [ ] #5 Tests verify mention extraction, turn admission, and streaming channel response
<!-- AC:END -->
