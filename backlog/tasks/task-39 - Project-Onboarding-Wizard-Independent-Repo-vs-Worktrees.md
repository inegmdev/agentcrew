---
id: TASK-39
title: "Project Onboarding Wizard (Independent Repo vs. Worktrees)"
status: Done
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:36'
labels:
  - ui
  - workspace
  - wizard
milestone: m-3
dependencies:   - TASK-38
priority: high
type: feature
ordinal: 37000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Create an interactive step-by-step project onboarding modal allowing the user to select directory path and choose between Independent Repo and Multi-Worktree operating mode.

**Blocked by:** TASK-38
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Modal allows entering project name, local folder path, and zone selection
- [x] #2 Presents interactive radio cards for project mode: Independent Repo vs Multi-Worktree with visual explanations
- [x] #3 Validates directory path and git status via API before submission
- [x] #4 Submitting creates project and immediately advances to Specialist Store setup
- [x] #5 UI tests verify validation, error states, and project creation flow
<!-- AC:END -->
