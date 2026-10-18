---
id: TASK-55
title: "Tauri Native Multi-Window Terminal Spawner & Desktop Alerts"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - desktop
  - tauri
  - terminal
milestone: m-3
dependencies:   - TASK-51
  - TASK-54
priority: medium
type: feature
ordinal: 53000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Enhance Tauri desktop app with native OS window management for detached terminals, system tray controls, and native desktop notifications.

**Blocked by:** TASK-51, TASK-54
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 `[Pop Out ↗]` in Tauri invokes `WebviewWindowBuilder` to create true native OS windows with OS borders
- [ ] #2 Native system tray icon displays active agent count and quick-access menu (Open Dashboard, Quit)
- [ ] #3 Native OS desktop notifications fire when an agent reaches `waiting_for_input` or finishes a task
- [ ] #4 Clicking notification focuses the application window and navigates to the relevant agent/channel
- [ ] #5 Verified on Linux desktop with clean window management and exit handling
<!-- AC:END -->
