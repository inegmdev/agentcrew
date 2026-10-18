---
id: TASK-46
title: "Shared #team-activity Room Backend & Message Store"
status: To Do
assignee: []
created_date: '2026-10-18 23:25'
updated_date: '2026-10-18 23:25'
labels:
  - chat
  - backend
  - sse
milestone: m-3
dependencies:   - TASK-45
priority: high
type: feature
ordinal: 44000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
**What to build:** Implement a shared team activity room message store in SQLite, providing REST endpoints and SSE broadcasting for collaborative agent and operator messages.

**Blocked by:** TASK-45
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 SQLite table `room_messages` created (id, project_id, channel, sender_type: agent/human, sender_id, text, metadata, timestamp)
- [ ] #2 GET /api/v1/room/messages retrieves paginated message history for a channel
- [ ] #3 POST /api/v1/room/messages appends a new message and broadcasts `room.message` over SSE
- [ ] #4 Agents can post milestone summaries, PR readiness, and review handoffs into the room
- [ ] #5 Contract tests verify message ordering, project scoping, and SSE broadcast delivery
<!-- AC:END -->
