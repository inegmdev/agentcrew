---
id: TASK-54
title: "Tauri v2 Scaffold & Node.js Sidecar Lifecycle Manager"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - desktop
  - tauri
  - rust
milestone: m-3
dependencies:   - TASK-44
priority: medium
type: feature
ordinal: 52000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Configure Tauri v2 desktop application shell in `src-tauri` that spawns and lifecycle-manages the Node.js supervisor daemon as an embedded sidecar.

**Blocked by:** TASK-44
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Tauri v2 initialized in `src-tauri` with cargo configuration and desktop window settings
- [ ] #2 Rust main entrypoint spawns `agentcrew server` sidecar process and checks loopback health
- [ ] #3 Rust shell terminates Node.js daemon and child PTY process groups cleanly on window close/quit
- [ ] #4 Single-instance lock prevents conflicting daemon instances
- [ ] #5 Builds lightweight desktop binary (~20MB) with minimal memory footprint
<!-- AC:END -->
