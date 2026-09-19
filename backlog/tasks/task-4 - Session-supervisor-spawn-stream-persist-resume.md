---
id: TASK-4
title: 'Session supervisor: spawn, stream, persist, resume'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - supervisor
milestone: m-0
dependencies:
  - TASK-2
  - TASK-3
  - TASK-5
references:
  - >-
    backlog/decisions/decision-4 -
    State-split-intent-in-markdown-events-in-a-per-project-database-outside-the-repo.md
  - PRODUCT.md
priority: high
ordinal: 4000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The session supervisor: the first vertical slice that runs a real task. Local
runtime plus the claude adapter only.

Build src/runtime/local.js per §10, src/adapters/claude.js per §9.1 and §9.3, and
src/supervisor/session.js tying them to the store from task-5.

Flow: mint a session id, spawn through the runtime, stream stream-json through the
adapter, normalise to §5 envelopes, persist through the store, and resume by id
after a restart. Set CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS to 300000 per §6.3. Never
pass --bare, per §6.4.

Adapters normalise and nothing else: no store writes, no health decisions, no board
writes. That separation is what lets task-9 add a CLI cheaply.

Do not decide: the adapter interface, the runtime interface, session identity, or
which flags to pass. §9.1, §9.2, §10 and §9.3 give all four.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 a task run end to end produces a replayable event stream that validates against task-2
- [ ] #2 resume by session id continues the same session after the daemon restarts, with seq unbroken
- [ ] #3 payloads over the row cap land in blobs, not in the events table
- [ ] #4 the claude adapter passes the task-3 contract suite unchanged
- [ ] #5 the background wait ceiling is set explicitly and asserted in a test
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
