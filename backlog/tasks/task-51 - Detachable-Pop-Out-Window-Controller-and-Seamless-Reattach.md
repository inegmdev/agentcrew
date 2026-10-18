---
id: TASK-51
title: "Detachable Pop-Out Window Controller & Seamless Reattach"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - terminal
  - ui
milestone: m-3
dependencies:   - TASK-50
priority: high
type: feature
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Add a `[Pop Out ↗]` button to any terminal pane that spawns an independent browser window via window.open, updating the inline pane with a reattach control without interrupting the PTY.

**Blocked by:** TASK-50
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Terminal header contains `[Pop Out ↗]` button
- [ ] #2 Spawns independent window targeting `/terminal?agent=<id>&token=<token>`
- [ ] #3 Inline pane transforms into 'Terminal Detached to External Window' card with '[Reattach]' button
- [ ] #4 Closing the popup window or clicking '[Reattach]' restores inline terminal seamlessly without dropping PTY session
- [ ] #5 Cross-window synchronization validated via BroadcastChannel / WebSocket
<!-- AC:END -->
