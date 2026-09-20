---
id: TASK-11
title: Build the dependencies (Gantt) mockup screen
status: Done
assignee: []
created_date: '2026-09-20 20:58'
updated_date: '2026-09-20 21:04'
labels:
  - mockup
  - ux
milestone: m-0
dependencies: []
references:
  - >-
    backlog/decisions/decision-4 -
    State-split-intent-in-markdown-events-in-a-per-project-database-outside-the-repo.md
  - PRODUCT.md
priority: medium
ordinal: 550
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Fourth mockup screen, per PRODUCT.md §11.5. task-10 shipped Board, Session and Forensics only; this adds the one PRODUCT.md §11 surface it didn't cover, because task-to-task dependencies weren't modeled yet when task-10 was scoped.

Build:
  mockups/dependencies.html   per §11.5, matching the token system and nav already shared by the other three screens

Extend mockups/sample-events.js with a dependencies map, task_id -> array of task_ids it depends on, mirroring Backlog.md's own --depends-on field (this repo's own board already uses it). Do not invent a new supervisor event type for this — dependencies are intent-side, read from the board, not the event stream.

Do not decide: the section contract (§11.5 already fixes what must show), the token system or nav (already established by board/session/forensics), the sample data shape for sessions/events (unchanged).
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 dependencies.html exists, opens from file:// with no server and no build step, matches the existing token system and nav
- [x] #2 a task with two upstream dependencies shows both edges, one still in flight and one done
- [x] #3 an unclaimed task with no session renders as a marker, not a bar
- [x] #4 a downstream task blocked on an incomplete dependency reads visibly different from one that's unblocked
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 node --test passes locally; no test skipped or disabled to get there
- [x] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [x] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
