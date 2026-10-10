---
id: TASK-23
title: Observability Dashboard & Diagnostic Retrospectives
status: To Do
assignee: []
created_date: '2026-10-10 22:32'
labels: []
milestone: m-1
dependencies:
  - TASK-18
  - TASK-20
  - TASK-21
priority: medium
type: feature
ordinal: 21000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Compute and display iteration metrics (cycle time, blocked time, human wait time, rework counts, and stacked agent utilization timelines). Diagnostic engine evaluates repeated failures and runs post-iteration retrospectives assigned to the PO.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Observability view computes cycle time, blocked time, and QA pass rates
- [ ] #2 Agent utilization timeline distinguishes executing, queued, human-wait, and idle
- [ ] #3 Diagnostic engine analyzes recurring failure patterns with event links
- [ ] #4 Post-iteration retrospective generated as PO assignment
<!-- AC:END -->
