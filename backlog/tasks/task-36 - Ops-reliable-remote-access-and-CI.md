---
id: TASK-36
title: 'Ops: reliable remote access and CI'
status: To Do
assignee: []
created_date: '2026-10-11 02:41'
labels:
  - ops
dependencies: []
priority: low
type: chore
ordinal: 34000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: free localtunnel relays returned 502 and rejected WebSocket upgrades, which caused the earlier 'Bad Gateway' JSON error; direct LAN (192.168.100.50:3000) is reliable. No .github/workflows exists, so 'run the repo CI before PR' is currently just npm test. Also this session's code was committed straight to main instead of via PRs.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Document LAN/cloudflared access in README and drop localtunnel advice
- [ ] #2 Server binds 0.0.0.0 only when --host is passed (default 127.0.0.1)
- [ ] #3 Minimal CI workflow runs npm test on PRs (coordinate with TASK-8)
- [ ] #4 Branch protection or convention: no direct pushes to main
<!-- AC:END -->
