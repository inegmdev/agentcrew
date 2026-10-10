---
id: TASK-14
title: 'Workspace Bootstrap, Database & Agent Identities'
status: To Do
assignee: []
created_date: '2026-10-10 22:31'
labels: []
milestone: m-1
dependencies:
  - TASK-13
priority: high
type: feature
ordinal: 12000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Initialize the local ~/.agentcrew SQLite project store and Git repo linkage. Configure and display the 13 persistent agent identities with avatars, roles, and provider/model bindings in a Settings view.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Local SQLite schema initialized in ~/.agentcrew/projects/<id>/agentcrew.db
- [ ] #2 Git repository linked via resolved common Git directory
- [ ] #3 13 persistent agent identities stored and manageable
- [ ] #4 Settings view displays avatars, roles, assigned models, and readiness check
<!-- AC:END -->
