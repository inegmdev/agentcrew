---
id: TASK-43
title: "Legacy Project Default Roster Seeder"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - workspace
  - migration
milestone: m-3
dependencies:   - TASK-42
priority: medium
type: feature
ordinal: 41000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Ensure existing projects (such as the main agentcrew workspace) are automatically populated with the standard 13-agent roster during migration without manual hiring.

**Blocked by:** TASK-42
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Database startup detects unpopulated or existing workspaces and seeds the standard 13-agent roster
- [ ] #2 Preserves any previously established provider session IDs and conversation history
- [ ] #3 Does not duplicate agents on subsequent server restarts
- [ ] #4 Test suite passes with 100% green status on fresh and migrated workspaces
<!-- AC:END -->
