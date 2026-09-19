---
id: TASK-7
title: 'Takeover: state machine, enforcement, and forced interrupt'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:40'
labels:
  - supervisor
  - ux
milestone: m-0
dependencies:
  - TASK-4
references:
  - >-
    backlog/decisions/decision-5 -
    Interrupts-are-in-band-first-signals-are-a-per-OS-runtime-concern.md
priority: medium
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
auto to pausing to human_owned to releasing. PreToolUse deny as enforcement while human owned. Forced interrupt in band first, per-OS hard kill in the runtime layer. Every transition an event naming the actor.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 supervisor cannot send input while human_owned
- [ ] #2 user abort leaves a resumable session
- [ ] #3 hard kill leaves no orphan processes on either OS
<!-- AC:END -->
