---
id: TASK-53
title: "Clickable Decision Card UI & Option Submission Workflow"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - ui
  - chat
milestone: m-3
dependencies:   - TASK-52
priority: high
type: feature
ordinal: 51000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Render interactive decision cards inside the chat feed with clickable option buttons, allowing the operator to click a choice or type custom guidance to resume the turn.

**Blocked by:** TASK-52
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Chat feed renders decision card with oceanic styling, question title, and option buttons
- [ ] #2 Includes 'Custom Response...' expander for freeform instructions
- [ ] #3 Clicking an option submits the chosen text directly to the agent's active turn/PTY
- [ ] #4 Card transforms into an answered state showing the selected option
- [ ] #5 Clears the `waiting_for_input` status badge immediately upon submission
<!-- AC:END -->
