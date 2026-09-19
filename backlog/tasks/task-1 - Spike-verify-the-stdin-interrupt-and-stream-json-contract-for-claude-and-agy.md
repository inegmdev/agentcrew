---
id: TASK-1
title: 'Spike: verify the stdin interrupt and stream-json contract for claude and agy'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - spike
  - adapters
milestone: m-0
dependencies: []
references:
  - >-
    backlog/decisions/decision-5 -
    Interrupts-are-in-band-first-signals-are-a-per-OS-runtime-concern.md
  - PRODUCT.md
priority: high
ordinal: 1000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Answer the protocol questions the design rests on, against real builds, before any
supervisor code exists. PRODUCT.md §7.3 level 2 and §9.3 are provisional until this
lands.

Write findings to docs/spikes/2026-09-cli-protocol.md, one section per question
below, each with the command run and the raw output quoted. Record the streams
themselves to test/fixtures/streams/ as .jsonl, one file per scenario, named for the
scenario.

Questions, in order:
  1. Does --session-id <uuid> get honoured and echoed back in system/init?
  2. Does --resume <uuid> continue that session, and does our seq counter need to
     account for anything the CLI replays?
  3. What exactly is in system/init.capabilities? Is interrupt_receipt_v1 present?
  4. Does an in-band interrupt message on stdin end the turn? If yes, record the
     exact message shape. If no, say so plainly; §7.3 already has the fallback.
  5. On POSIX: does SIGINT end the turn and SIGTERM exit 143, as documented?
  6. On Windows: what actually happens for each of level 2 and level 3?

Scenarios to record as fixtures, per PRODUCT.md §12.4: a rate-limit retry storm, an
agent_needs_input stop, a crash mid-turn, a tool-call loop.

Do not build anything. If a question cannot be answered, write down what was tried
and why it failed; that is a valid result and it changes §7.3, not the plan.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 docs/spikes/2026-09-cli-protocol.md answers all six questions for claude and for agy, with commands and raw output
- [ ] #2 system/init.capabilities is captured verbatim for both CLIs
- [ ] #3 the in-band interrupt is confirmed working with its exact message shape, or confirmed absent with evidence
- [ ] #4 Windows behaviour is recorded for interrupt level 2 and level 3 separately
- [ ] #5 the four fixtures of PRODUCT.md §12.4 are committed under test/fixtures/streams/
- [ ] #6 PRODUCT.md §7.3 and §9.3 updated to match what was found
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
