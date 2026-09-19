---
id: TASK-4
title: 'Session supervisor: spawn, stream, persist, resume'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:40'
labels:
  - supervisor
milestone: m-0
dependencies:
  - TASK-2
  - TASK-3
references:
  - >-
    backlog/decisions/decision-4 -
    State-split-intent-in-markdown-events-in-a-per-project-database-outside-the-repo.md
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Local runtime plus claude adapter. Mint a session id, spawn with stream-json in and out, normalise events, persist to the per-project database, resume by id. Sole writer, WAL, blobs for large payloads.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 a task run end to end produces a replayable event stream in the database
- [ ] #2 resume continues the same session after a restart
- [ ] #3 large tool payloads land in blobs, not in the events table
<!-- AC:END -->
