---
id: TASK-10
title: 'Clickable mockup of the board, the session view and takeover'
status: To Do
assignee: []
created_date: '2026-09-19 16:40'
labels:
  - mockup
  - ux
milestone: m-0
dependencies: []
references:
  - >-
    backlog/decisions/decision-3 -
    agentcrew-is-the-orchestrator-a-session-supervisor-over-CLI-adapters.md
priority: high
ordinal: 500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Front-load the feedback loop. A static HTML mockup, no backend, driven by a hand-written sample event stream rather than lorem ipsum, so the screens and the schema are designed against each other. Covers: board with health per task, live session transcript, the stuck state with its evidence, and the takeover handoff. The sample stream it is built on becomes the seed for task-2 and the first fixture for task-3.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 board view shows every health state: working, waiting_for_input, rate_limited, stuck, crashed, done
- [ ] #2 session view renders a transcript from the sample event stream, including a tool call and a permission request
- [ ] #3 stuck state shows why it was flagged and what the proposed nudge is
- [ ] #4 takeover shown as a state change, not a button: paused, human owned, released
- [ ] #5 sample event stream committed as JSON and referenced by task-2
- [ ] #6 opens from the filesystem with no build step and no dependencies
<!-- AC:END -->
