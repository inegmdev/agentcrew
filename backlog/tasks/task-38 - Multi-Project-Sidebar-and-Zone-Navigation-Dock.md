---
id: TASK-38
title: "Multi-Project Sidebar & Zone Navigation Dock"
status: Done
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:36'
labels:
  - ui
  - workspace
milestone: m-3
dependencies:   - TASK-37
priority: high
type: feature
ordinal: 36000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Render a sleek leftmost vertical dock in the dashboard displaying registered projects organized by collapsible zones (Work, Personal, Side Projects) with instant switching.

**Blocked by:** TASK-37
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Leftmost dock renders project icons/initials grouped into Work, Personal, and Side zones
- [x] #2 Active project has an oceanic glow badge and indicator
- [x] #3 Clicking a project switches workspace context immediately without requiring server restart
- [x] #4 Includes a prominent [+] button to open the project setup wizard
- [x] #5 Responsive collapsed state with tooltips on desktop and mobile
<!-- AC:END -->
