---
id: TASK-32
title: 'Takeover is cosmetic: not tied to the agent''s real session'
status: To Do
assignee: []
created_date: '2026-10-11 02:41'
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
- [ ] #1 Takeover state is tracked per agent identity
- [ ] #2 Takeover actually quiesces that agent's in-flight turn within the 10s soft budget
- [ ] #3 Two-tab takeover conflict returns an error (AT-05)
- [ ] #4 Chat during takeover goes to the agent's own session, shell is a separate explicit mode
<!-- AC:END -->
