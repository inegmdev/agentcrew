---
id: TASK-7
title: 'Takeover: state machine, enforcement, and forced interrupt'
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - supervisor
  - ux
milestone: m-0
dependencies:
  - TASK-4
references:
  - >-
    backlog/decisions/decision-5 -
    Interrupts-are-in-band-first-signals-are-a-per-OS-runtime-concern.md
  - PRODUCT.md
priority: medium
ordinal: 7000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Takeover, per PRODUCT.md §7, including the forced interrupt.

Build src/supervisor/takeover.js implementing the four states of §7.1, enforcement
through PreToolUse deny per §7.2, and the three interrupt levels of §7.3.

Enforcement is the point: while human_owned the supervisor must be unable to send
input, not merely trusted not to. The pausing state has a ten second budget before
escalating to level 3.

Level 3 belongs in src/runtime/local.js, not in any adapter: POSIX signals the
process group, Windows shells out to taskkill /T /F. Feature-detect level 2 from
system/init.capabilities; never compare version strings.

If task-1 found no in-band interrupt, level 2 falls back to SIGINT on POSIX and
Windows gets abort-and-resume. Document that divergence in the README rather than
hiding it.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 a test proves the supervisor cannot send input while human_owned
- [ ] #2 operator abort leaves a session that resumes by id with seq unbroken
- [ ] #3 interrupt level 3 leaves no orphan process on either operating system
- [ ] #4 every state transition writes the matching takeover event with actor human
- [ ] #5 pausing escalates to level 3 after its ten second budget
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
