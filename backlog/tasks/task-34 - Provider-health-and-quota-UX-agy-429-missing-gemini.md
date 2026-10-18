---
id: TASK-34
title: 'Provider health and quota UX (agy 429, missing gemini)'
status: Done
assignee: []
created_date: '2026-10-11 02:41'
updated_date: '2026-10-18 21:48'
completed_date: '2026-10-18 21:48'
resolution: completed
merged_pr: '#19'
labels:
  - providers
  - ux
dependencies: []
priority: medium
type: feature
ordinal: 32000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: agy hit RESOURCE_EXHAUSTED (429, resets ~9 min) and chat silently moved to codex; gemini CLI is not installed so QA-1/QA-2 can never answer; /api/v1/readiness hardcodes all three providers as 'ready'. Chat now surfaces raw stderr which is accurate but ugly.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 readiness endpoint runs adapter.probe() and reports real availability
- [x] #2 UI badge per provider shows available / quota-limited with reset time
- [x] #3 Agent reply labels which provider actually answered when failover occurs
- [x] #4 Gemini adapter gets a runner or is marked unavailable for its agents
<!-- AC:END -->

## Implementation Summary
- Integrated real `adapter.probe()` in `/api/v1/readiness` returning capability and operational availability per provider.
- Added provider UI badges distinguishing available, unavailable, and quota-limited (with reset timers).
- Strict primary provider routing with opt-in backup per agent; replies clearly label the responding provider.
- Marked Gemini explicitly unavailable pending qualified delegation-guard verification.
- Verified in `test/providers/gemini-adapter.test.js`, `test/server/http-api.test.js`, and `test/workspace/manager.test.js`.

