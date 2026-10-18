---
id: TASK-45
title: "Slack-Style Navigation Rail (Channels & Direct DMs)"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - ui
  - chat
milestone: m-3
dependencies:   - TASK-44
  - TASK-42
priority: high
type: feature
ordinal: 43000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Build the Slack-style sub-sidebar containing Channels (#team-activity, #pr-reviews, #alerts) and Direct Messages listing all hired specialist agents with live activity dots.

**Blocked by:** TASK-44, TASK-42
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Sub-sidebar renders Channels section with #team-activity, #pr-reviews, #alerts
- [ ] #2 Direct Messages section lists all hired agents with avatar badges and live status dots (working, waiting, idle, stuck)
- [ ] #3 Unread message counters rendered next to channels and agent DMs
- [ ] #4 Clicking any channel or DM switches the central view smoothly
- [ ] #5 Keyboard navigation support for hopping between channels and agents
<!-- AC:END -->
