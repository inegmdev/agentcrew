---
id: TASK-21
title: Popup Scope Change Engine
status: Done
assignee: []
created_date: '2026-10-10 22:32'
updated_date: '2026-10-10 22:57'
labels: []
milestone: m-1
dependencies:
  - TASK-16
  - TASK-18
priority: high
type: feature
ordinal: 19000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Submitting a requirement or DoD change mid-iteration mints a Backlog popup ticket (P-xxx). The PO compiles an impact analysis (affected, reusable, discarded work, delay), pausing affected tasks while unaffected tasks continue, requiring operator sign-off.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Scope modification mid-iteration mints a Backlog popup ticket (P-xxx)
- [x] #2 PO compiles impact analysis detailing reusable vs discarded effort and delays
- [x] #3 Affected tasks paused safely while unaffected assignments continue
- [x] #4 Operator sign-off mandatory before revised commitment is active
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented PopupScopeChangeEngine minting P-xxx tickets on mid-iteration scope modifications. Computes impact analysis (reusable vs discarded effort, delay estimate), pauses affected worktrees, and requires operator approval before unpausing tasks with revised commitments.
<!-- SECTION:FINAL_SUMMARY:END -->
