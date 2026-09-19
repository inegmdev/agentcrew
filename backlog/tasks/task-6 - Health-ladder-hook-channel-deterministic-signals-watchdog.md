---
id: TASK-6
title: 'Health ladder: hook channel, deterministic signals, watchdog'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:40'
labels:
  - supervisor
  - health
milestone: m-0
dependencies:
  - TASK-4
references:
  - >-
    backlog/decisions/decision-3 -
    agentcrew-is-the-orchestrator-a-session-supervisor-over-CLI-adapters.md
priority: medium
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Install hooks that push Notification, Stop and SessionEnd to the daemon and exit immediately. Deterministic tier on the event stream. LLM watchdog on escalation only. Wall clock as the liveness net, above the CLI's own background wait ceiling.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 agent_needs_input surfaces on the board without polling
- [ ] #2 a killed session is reconciled via the child-written nonce, not the pid
- [ ] #3 watchdog tests run in virtual time
<!-- AC:END -->
