---
id: TASK-8
title: agentcrew doctor and the first CI workflow
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
labels:
  - testing
  - cli
dependencies: []
references:
  - >-
    backlog/decisions/decision-6 -
    Tests-run-against-mocked-CLIs-no-vendor-credentials-in-CI.md
priority: medium
ordinal: 8000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
doctor --json reporting node version, CLI presence and versions, auth status without values, database and migration state, port availability, hook installation. Workflow runs node --test on ubuntu and windows plus the setup idempotency job. No secrets.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 doctor exits non-zero on a broken install and prints no secret-shaped strings
- [ ] #2 setup run twice produces an empty diff
- [ ] #3 workflow green on both operating systems with no credentials configured
<!-- AC:END -->
