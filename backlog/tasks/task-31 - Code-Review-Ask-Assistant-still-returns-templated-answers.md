---
id: TASK-31
title: Code Review 'Ask Assistant' still returns templated answers
status: Done
assignee: []
created_date: '2026-10-11 02:41'
updated_date: '2026-10-12 01:08'
labels:
  - chat
  - review
dependencies: []
priority: high
type: bug
ordinal: 29000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: agent.ask in supervisor-server.js still synthesizes canned text by keyword (arch/test/risk) and only greps git log. The Takeover chat now uses real CLIs; the review drawer does not, which is the same 'feels like a template' problem. PR data in the drawer is static analytics-dashboard-data.js.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 agent.ask answers come from the provider CLI with PR diff/title/author as context
- [x] #2 Canned keyword branches deleted
- [x] #3 Drawer shows provider error (not fake text) when providers fail
<!-- AC:END -->
