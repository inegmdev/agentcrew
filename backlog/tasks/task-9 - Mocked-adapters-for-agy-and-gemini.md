---
id: TASK-9
title: Mocked adapters for agy and gemini
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - adapters
milestone: m-0
dependencies:
  - TASK-3
references:
  - >-
    backlog/decisions/decision-6 -
    Tests-run-against-mocked-CLIs-no-vendor-credentials-in-CI.md
  - PRODUCT.md
priority: low
ordinal: 9000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The second and third adapters, per PRODUCT.md §9.3. The real deliverable is proof
that the contract suite was the right abstraction.

Build src/adapters/agy.js and src/adapters/gemini.js against the task-3 contract
suite, plus their fake binaries. Record agy fixtures from a real run first, per
§12.1.

Gemini is kept deliberately for locked-down corporate machines where it may be the
only permitted CLI, and ships marked unverified until someone records a real
session. Mark it in code and in the README; do not quietly present it as supported.

Also build src/adapters/mock.js and wire --adapter mock as a shipped feature per
§12.5, so an operator can try agentcrew with no credentials at all.

If an adapter cannot pass the contract suite without changing the suite, stop and
say so: that means §9.1 is wrong, which is a spec decision, not an implementation
one.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 the agy adapter passes the contract suite with no change to the suite itself
- [ ] #2 agy fixtures are recorded from a real run, not written from documentation
- [ ] #3 the gemini adapter is present and marked unverified in code and in the README
- [ ] #4 --adapter mock runs a full session with no credentials present
- [ ] #5 no adapter needed a per-CLI branch inside shared supervisor code
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
