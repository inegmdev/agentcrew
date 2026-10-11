---
id: TASK-29
title: 'Real agent conversations: persistent per-agent provider sessions'
status: Done
assignee: []
created_date: '2026-10-11 02:41'
labels:
  - chat
  - providers
dependencies: []
priority: high
type: feature
ordinal: 27000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Finding: each chat message is a one-shot 'agy --print' / 'codex exec' call, so agents have no memory of earlier messages (Alice cannot follow up on her own risk answer). Adapters already expose resumeFrom/--conversation but nothing stores the session id.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Each agent identity keeps a provider session id in the per-project store
- [x] #2 Follow-up chat message resumes that session (agy --conversation / codex exec resume)
- [x] #3 Contract test with mocked CLI proves 2nd message carries the resume id
- [x] #4 Takeover release keeps the session so context survives handback
<!-- AC:END -->
