---
id: TASK-10
title: 'Clickable mockup of the board, the session view and takeover'
status: In Progress
assignee:
  - '@claude'
created_date: '2026-09-19 16:40'
updated_date: '2026-09-19 20:52'
labels:
  - mockup
  - ux
milestone: m-0
dependencies: []
references:
  - >-
    backlog/decisions/decision-3 -
    agentcrew-is-the-orchestrator-a-session-supervisor-over-CLI-adapters.md
  - PRODUCT.md
priority: high
ordinal: 500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Build the three mockup screens before anything else, so the screens and the event
model are designed against each other rather than the screens being fitted to a
schema that already shipped.

Spec: PRODUCT.md §11 for all three screens, §11.4 for presentation rules, §5.1 and
§5.2 for the shape of the sample data, §6.1 for the health states that must appear.

Build exactly:
  mockups/board.html        per §11.1
  mockups/session.html      per §11.2
  mockups/forensics.html    per §11.3
  mockups/sample-events.js  assigns globalThis.SAMPLE_EVENTS, per §11.4

The sample stream is hand-written and must contain, in one session: session.started,
three turns, a tool.requested plus tool.completed pair, a permission.requested that
is denied, a health.changed to waiting_for_input at tier 0, a nudge.sent, a
takeover.acquired and takeover.released pair, and session.ended. Every envelope
carries seq, actor and caused_by per §5.1 so the forensics screen has a real chain
to walk.

Do not decide: the file layout, the event field names, the health state names, or
whether to use a framework. All are fixed by the spec. Open a browser on the file
and iterate on layout only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 the three files above exist and open directly from file:// with no server and no build step
- [x] #2 board screen shows all six health states of PRODUCT.md §6.1, visually distinct
- [x] #3 session screen renders the transcript from SAMPLE_EVENTS including the tool call and the denied permission request
- [x] #4 a stuck row shows its tier and evidence per §6.2 and the proposed nudge text
- [x] #5 takeover is shown as the four states of §7.1, not as a button
- [x] #6 forensics screen walks caused_by from the last event to its root, per §5.3
- [x] #7 sample-events.js is the single source of the sample data; nothing is duplicated into test/
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 node --test passes locally; no test skipped or disabled to get there
- [x] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [x] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
