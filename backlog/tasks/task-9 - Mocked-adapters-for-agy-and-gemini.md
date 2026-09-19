---
id: TASK-9
title: Mocked adapters for agy and gemini
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
labels:
  - adapters
dependencies:
  - TASK-3
references:
  - >-
    backlog/decisions/decision-6 -
    Tests-run-against-mocked-CLIs-no-vendor-credentials-in-CI.md
priority: low
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Second and third adapters against the contract suite. agy fixtures recorded from a real run. Gemini kept for legacy corporate users and shipped marked unverified until someone records a real session.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 agy adapter passes the contract suite unchanged
- [ ] #2 gemini adapter present, marked unverified, excluded from supported claims
- [ ] #3 no adapter needed a change to the contract suite to pass
<!-- AC:END -->
