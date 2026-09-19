---
id: TASK-2
title: Define the agentcrew event schema and forensics fields
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
labels:
  - schema
dependencies: []
references:
  - >-
    backlog/decisions/decision-3 -
    agentcrew-is-the-orchestrator-a-session-supervisor-over-CLI-adapters.md
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The spine from decision-3. Event envelope with caused_by on every row, started_by and ended_by as {reason, actor, caused_by}, and the health enum. JSON Schema so fixtures and mock output can both be validated.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 JSON Schema committed and validating the recorded fixtures
- [ ] #2 caused_by present on every event type
- [ ] #3 health enum covers working, waiting_for_input, rate_limited, stuck, crashed, done
<!-- AC:END -->
