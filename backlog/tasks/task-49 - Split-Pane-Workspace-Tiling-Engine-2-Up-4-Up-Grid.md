---
id: TASK-49
title: "Split-Pane Workspace Tiling Engine (2-Up / 4-Up Grid)"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - ui
  - workspace
  - terminal
milestone: m-3
dependencies:   - TASK-45
priority: high
type: feature
ordinal: 47000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Build a split-pane tiling engine allowing the user to view 1, 2 (columns/rows), or 4 workspace panes side by side, binding each pane to an agent terminal or room feed.

**Blocked by:** TASK-45
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Top-bar split control buttons for 1-pane, 2-column, 2-row, and 4-grid layouts
- [ ] #2 Each pane features a header dropdown to assign any active agent terminal or channel
- [ ] #3 Panes resize smoothly and persist layout preferences in local storage
- [ ] #4 Active pane receives focus with dark sea blue accent outline
- [ ] #5 UI tests verify layout switching and pane assignment
<!-- AC:END -->
