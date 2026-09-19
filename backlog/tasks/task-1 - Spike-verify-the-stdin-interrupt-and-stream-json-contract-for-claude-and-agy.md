---
id: TASK-1
title: 'Spike: verify the stdin interrupt and stream-json contract for claude and agy'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
labels:
  - spike
  - adapters
dependencies: []
references:
  - >-
    backlog/decisions/decision-5 -
    Interrupts-are-in-band-first-signals-are-a-per-OS-runtime-concern.md
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Before any supervisor code. Confirm on current builds: --session-id is honoured and echoed in system/init; --resume continues it; capabilities array is present; an in-band interrupt message ends the turn; SIGINT vs SIGTERM behave as documented on POSIX; what Windows actually does. Record the raw streams as the first fixtures.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 system/init capabilities array captured for both CLIs
- [ ] #2 in-band interrupt confirmed working or confirmed absent, with evidence
- [ ] #3 Windows behaviour for each interrupt path recorded
- [ ] #4 raw stream-json transcripts committed as fixtures
<!-- AC:END -->
