---
id: TASK-42
title: "Specialist Hiring & Provider Assignment Workflow"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - store
  - agents
  - ui
milestone: m-3
dependencies:   - TASK-41
priority: high
type: feature
ordinal: 40000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Implement the hiring dialog where users name the agent, select primary/backup CLI subscription (agy, codex, gemini), and provision the agent into the project roster.

**Blocked by:** TASK-41
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Clicking 'Hire' opens assignment modal with agent name field (e.g. Dev-1, QA-1)
- [ ] #2 Dropdown selectors for primary provider and opt-in backup provider with qualified status badges
- [ ] #3 POST /api/v1/projects/:id/agents provisions the agent in SQLite and initializes conversation memory
- [ ] #4 Broadcasts agent.hired event over SSE to update the UI roster dynamically
- [ ] #5 Integration test verifies end-to-end hiring and roster persistence
<!-- AC:END -->
