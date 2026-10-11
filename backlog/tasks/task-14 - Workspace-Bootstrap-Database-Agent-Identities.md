---
id: TASK-14
title: 'Workspace Bootstrap, Database & Agent Identities'
status: Done
assignee: []
created_date: '2026-10-10 22:31'
updated_date: '2026-10-10 22:51'
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
- [x] #1 Local SQLite schema initialized in ~/.agentcrew/projects/<id>/agentcrew.db
- [x] #2 Git repository linked via resolved common Git directory
- [x] #3 13 persistent agent identities stored and manageable
- [x] #4 Settings view displays avatars, roles, assigned models, and readiness check
<!-- AC:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented WorkspaceManager utilizing node:sqlite DatabaseSync to initialize ~/.agentcrew project databases. Seeds the 13 persistent agent identities across all required roles (BA, PO, Architect, 4 Devs, 4 Testers, 2 Integrators) and provides readiness verification.
<!-- SECTION:FINAL_SUMMARY:END -->
