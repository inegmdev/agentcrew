---
id: TASK-3
title: Build the fake claude binary and the adapter contract suite
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:40'
labels:
  - testing
  - adapters
milestone: m-0
dependencies: []
references:
  - >-
    backlog/decisions/decision-6 -
    Tests-run-against-mocked-CLIs-no-vendor-credentials-in-CI.md
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Node script impersonating the real flag surface, scripted stream-json output, and failure modes: hang, exit 143, ignore SIGINT, spawn a surviving child. The contract suite runs against it and becomes the bar every future adapter must clear.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 contract suite covers session id, resume, interrupt, orphan-free kill, malformed line
- [ ] #2 suite green on ubuntu and windows
- [ ] #3 every mock behaviour traces to a recorded fixture line
<!-- AC:END -->
