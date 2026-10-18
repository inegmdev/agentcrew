---
id: TASK-50
title: "Standalone Lightweight Terminal Route (/terminal)"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - terminal
  - server
milestone: m-3
dependencies:   - TASK-49
priority: high
type: feature
ordinal: 48000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Create a dedicated standalone HTTP route `GET /terminal` rendering a full-window xterm.js terminal instance connected to the specified agent PTY session.

**Blocked by:** TASK-49
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Route `GET /terminal?agent=<id>&token=<token>` serves a minimalist full-window terminal page
- [ ] #2 Connects directly to `/api/v1/pty` WebSocket with authentication token
- [ ] #3 Supports terminal resize, mobile virtual keys, theme inheritance, and reconnection
- [ ] #4 Validates agent ownership and token before admitting terminal input
- [ ] #5 Tested with automated browser tests and mock PTY streams
<!-- AC:END -->
