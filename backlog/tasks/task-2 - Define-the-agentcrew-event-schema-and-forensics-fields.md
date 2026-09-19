---
id: TASK-2
title: Define the agentcrew event schema and forensics fields
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - schema
milestone: m-0
dependencies:
  - TASK-10
references:
  - >-
    backlog/decisions/decision-3 -
    agentcrew-is-the-orchestrator-a-session-supervisor-over-CLI-adapters.md
  - PRODUCT.md
priority: high
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Turn PRODUCT.md §5 into code. The spec is normative and complete: this task
implements it, it does not design it.

Build src/supervisor/events.js exporting:
  EVENT_TYPES     the closed list from §5.2
  ACTORS          the list from §5.1
  START_REASONS   and END_REASONS from §5.3
  newEvent(...)   mints id and seq, stamps ts
  validate(event) returns {ok, errors}; hand-written, no schema library, per §14.3

Validation must reject an unknown type, a gap or repeat in seq, a missing actor, a
caused_by that names no known event in the session, and a payload that exceeds the
row cap of §8.4 without having been spilled.

Do not decide: field names, type names, reason vocabularies, id format or casing.
All are fixed in §5. If the spike (task-1) found something §5 cannot express, change
§5 first in its own commit, then implement.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 src/supervisor/events.js implements §5.1, §5.2 and §5.3 with no dependency
- [ ] #2 validate() rejects each of the five failure cases named in the description, one test each
- [ ] #3 mockups/sample-events.js validates clean against it
- [ ] #4 the four recorded fixtures from task-1 validate clean once normalised
- [ ] #5 ids sort lexicographically in creation order
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
