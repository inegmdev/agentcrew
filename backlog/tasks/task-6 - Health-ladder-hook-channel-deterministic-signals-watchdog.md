---
id: TASK-6
title: 'Health ladder: hook channel, deterministic signals, watchdog'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - supervisor
  - health
milestone: m-0
dependencies:
  - TASK-4
references:
  - >-
    backlog/decisions/decision-3 -
    agentcrew-is-the-orchestrator-a-session-supervisor-over-CLI-adapters.md
  - PRODUCT.md
priority: medium
ordinal: 6000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The health ladder of PRODUCT.md §6, all four tiers.

Build src/supervisor/hooks.js, which installs the hook configuration into the
session's settings and runs the receiving endpoint, and src/supervisor/health.js,
which owns the state machine of §6.1 and the tiers of §6.2.

Hooks post to the daemon's loopback port carrying the nonce, per §6.4, and do
nothing else inline. A hook failure is logged and never fails the session.

Thresholds are given in §6.2 and §6.3: three identical tool inputs, five turns with
no file change, fifteen minutes of silence, a sixty second watchdog cap. Read them
from config with those defaults; do not invent new ones.

Every verdict writes health.changed carrying tier and evidence, so the thresholds
can later be tuned from recorded history.

Tier 2 is advisory and must degrade cleanly: with no model configured, tiers 0, 1
and 3 still work, per §15.1.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 agent_needs_input reaches the board through the hook channel with no polling
- [ ] #2 each tier of §6.2 has a test proving it fires on its own signal and not on the others
- [ ] #3 a killed session is reconciled through the child-written nonce, never the pid alone
- [ ] #4 watchdog tests run in virtual time and the suite adds no measurable wall-clock delay
- [ ] #5 with tier 2 unconfigured the other three tiers still produce verdicts
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
