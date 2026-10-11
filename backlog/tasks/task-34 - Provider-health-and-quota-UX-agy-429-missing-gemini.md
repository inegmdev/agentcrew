---
id: TASK-34
title: 'Provider health and quota UX (agy 429, missing gemini)'
status: To Do
assignee: []
created_date: '2026-10-11 02:41'
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
- [ ] #1 readiness endpoint runs adapter.probe() and reports real availability
- [ ] #2 UI badge per provider shows available / quota-limited with reset time
- [ ] #3 Agent reply labels which provider actually answered when failover occurs
- [ ] #4 Gemini adapter gets a runner or is marked unavailable for its agents
<!-- AC:END -->
