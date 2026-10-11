---
id: TASK-30
title: Route all chat through ProviderPlugin adapters and TurnScheduler
status: To Do
assignee: []
created_date: '2026-10-11 02:41'
labels:
  - chat
  - architecture
dependencies: []
priority: high
type: feature
ordinal: 28000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: SupervisorServer.generateAgentResponse shells out directly (agy/codex via PtyManager.execute). This bypasses the 4-turn scheduler cap, adapter arg building (delegation suppression, --disable-slash-commands) and event normalization. Extract a deep ChatService module behind the ProviderPlugin interface; supervisor-server should only call it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 generateAgentResponse removed from supervisor-server.js; ChatService owns prompt, failover, parsing
- [ ] #2 Chat turns count against the global concurrency ceiling of 4
- [ ] #3 Uses AgyAdapter/CodexAdapter.buildSpawnArgs, not hand-built command strings
- [ ] #4 Prompt built from roster role contract, not an inline template string
<!-- AC:END -->
