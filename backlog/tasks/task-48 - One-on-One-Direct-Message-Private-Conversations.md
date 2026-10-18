---
id: TASK-48
title: "1:1 Direct Message Private Conversations"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - chat
  - ui
  - providers
milestone: m-3
dependencies:   - TASK-45
priority: high
type: feature
ordinal: 46000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Provide dedicated 1:1 Slack-style chat threads for every hired agent, preserving private conversation history, persona prompt instructions, and persistent provider sessions.

**Blocked by:** TASK-45
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Selecting an agent under Direct Messages opens their 1:1 conversation view
- [ ] #2 Messages in 1:1 thread are isolated from the shared #team-activity feed
- [ ] #3 Maintains persistent provider session ID across multi-turn messages (TASK-29)
- [ ] #4 Composer supports Chat and Shell input modes with `!` shortcut
- [ ] #5 Unit and integration tests verify 1:1 thread isolation and provider routing
<!-- AC:END -->
