---
id: TASK-20
title: Integration Strategies & GitHub Pull Requests
status: To Do
assignee: []
created_date: '2026-10-10 22:32'
labels: []
milestone: m-1
dependencies:
  - TASK-18
  - TASK-19
priority: high
type: feature
ordinal: 18000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Integrator agents manage task branches using the configured 'iteration branch' or 'task PR' strategy, driving GitHub CLI (gh), running CI checks, and surfacing human/autopilot merge controls.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Iteration branch strategy creates and integrates into iteration/<id>
- [ ] #2 Task PR strategy opens atomic PRs directly to the target branch
- [ ] #3 Integrator reviews diffs, conflict resolution, and runs CI verification
- [ ] #4 Human merge required by default with opt-in autopilot merge mode
<!-- AC:END -->
