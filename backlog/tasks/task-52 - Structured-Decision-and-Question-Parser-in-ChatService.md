---
id: TASK-52
title: "Structured Decision & Question Parser in ChatService"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - chat
  - parser
  - ai
milestone: m-3
dependencies:   - TASK-47
priority: high
type: feature
ordinal: 50000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Parse agent replies to detect structured multiple-choice questions or clarification requests, emitting a typed `agent.clarification_requested` event.

**Blocked by:** TASK-47
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Parser identifies choice patterns (e.g. `[?] Question? - (A) Option 1 - (B) Option 2` or JSON clarification blocks)
- [ ] #2 Extracts question text, structured options array, and optional recommended choice
- [ ] #3 Emits `agent.clarification_requested` event over SSE with structured payload
- [ ] #4 Sets agent state to `waiting_for_input` until a choice is selected
- [ ] #5 Unit tests verify parsing of various agent prompt response formats
<!-- AC:END -->
