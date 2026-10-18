---
id: TASK-37
title: "Multi-Project Registry Schema & Isolation API"
status: Done
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:28'
completed_date: '2026-10-18 23:28'
resolution: completed
labels:
  - workspace
  - database
  - api
milestone: m-3
dependencies: []
priority: high
type: feature
ordinal: 35000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Provide a persistent SQLite multi-project registry and isolation API so AgentCrew can manage multiple independent repositories and folders without global workspace conflicts.

**Blocked by:** None (can start immediately)
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 SQLite schema includes a `projects` table (id, name, path, mode: independent vs multi_worktree, zone: work/personal/side, is_active, created_at)
- [x] #2 GET /api/v1/projects lists all registered projects and their active status
- [x] #3 POST /api/v1/projects registers a new project path, validates directory existence, and initializes project identity
- [x] #4 POST /api/v1/projects/:id/activate switches active project workspace context atomically
- [x] #5 Automated tests verify project isolation and database integrity in WorkspaceManager
<!-- AC:END -->

## Implementation Summary
- Implemented central master registry SQLite database (`registry.db`) in `WorkspaceManager` with schema containing `id`, `name`, `path`, `mode`, `zone`, `is_active`, and `created_at`.
- Added `listProjects()`, `registerProject()`, `activateProject()`, and `getActiveProject()` methods in `WorkspaceManager` enforcing path validation, path normalization, mode (`independent` vs `multi_worktree`), and zone (`work`, `personal`, `side`).
- Added REST endpoints in `SupervisorServer`:
  - `GET /api/v1/projects`: returns list of registered projects with their active status.
  - `POST /api/v1/projects`: registers new project path with validation and 201 response.
  - `POST /api/v1/projects/:id/activate`: atomically switches active project context, updates server project/repo context, and broadcasts `project.activated` event over SSE.
- Added comprehensive unit and contract tests in `test/workspace/manager.test.js` and `test/server/http-api.test.js` verifying project registration, validation, activation, and multi-project session isolation.

