---
id: TASK-5
title: Project identity and the per-project store
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
labels:
  - storage
dependencies: []
references:
  - >-
    backlog/decisions/decision-4 -
    State-split-intent-in-markdown-events-in-a-per-project-database-outside-the-repo.md
priority: medium
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
UUID inside .git/ resolved via git rev-parse --git-common-dir, registry under ~/.agentcrew, one daemon per project with a lock file and a recorded port. Unreachable projects surfaced, never auto-deleted.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 id survives git clean -xdf and a directory move
- [ ] #2 two clones of one repo get separate databases
- [ ] #3 a missing path is marked unreachable with relocate and delete offered
<!-- AC:END -->
