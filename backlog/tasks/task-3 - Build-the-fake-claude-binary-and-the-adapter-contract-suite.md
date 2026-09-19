---
id: TASK-3
title: Build the fake claude binary and the adapter contract suite
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - testing
  - adapters
milestone: m-0
dependencies:
  - TASK-1
references:
  - >-
    backlog/decisions/decision-6 -
    Tests-run-against-mocked-CLIs-no-vendor-credentials-in-CI.md
  - PRODUCT.md
priority: high
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The fake CLI binary and the contract suite every adapter must pass, per PRODUCT.md
§12.2 and §12.3.

Build test/fakes/bin/claude.js: a Node script accepting the real flag surface of
§9.3, honouring --session-id, and emitting a scripted stream-json sequence read from
a fixture named by an environment variable. It must be able to hang, exit 143,
ignore SIGINT, and spawn a child that outlives it, selected by the same mechanism.

Build test/contract/adapter.test.js implementing the six checks of §12.3 verbatim.
It takes an adapter factory and a fake binary path, so task-9 adds a CLI by calling
it rather than editing it.

Every behaviour of the fake traces to a line in a fixture recorded by task-1. Do not
invent output shapes; §12.1 exists because a mock written from documentation only
confirms your own assumptions.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 the fake binary reproduces each of the four task-1 fixtures faithfully
- [ ] #2 the six contract checks of PRODUCT.md §12.3 are implemented and pass
- [ ] #3 the suite is parameterised by adapter factory and binary path, with no per-CLI branches inside it
- [ ] #4 the orphan check actually asserts no surviving child after interrupt level 3
- [ ] #5 the suite passes on ubuntu and on windows
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
