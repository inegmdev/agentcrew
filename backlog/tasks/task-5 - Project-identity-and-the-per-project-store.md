---
id: TASK-5
title: Project identity and the per-project store
status: To Do
assignee: []
created_date: '2026-09-19 16:17'
updated_date: '2026-09-19 16:51'
labels:
  - storage
milestone: m-0
dependencies: []
references:
  - >-
    backlog/decisions/decision-4 -
    State-split-intent-in-markdown-events-in-a-per-project-database-outside-the-repo.md
  - PRODUCT.md
priority: high
ordinal: 1500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
The store and project identity, per PRODUCT.md §8. Built before the supervisor
because the supervisor is its first caller.

Build:
  src/supervisor/store.js   open, migrate, and the read/write paths for §8.3
  src/supervisor/blobs.js   the row cap, spill and retrieval of §8.4
  project identity resolution per §8.2

Use node:sqlite per §8.3. Bump the engines field in package.json to >=22 and the
README prerequisite to match, per §14.3. WAL on, one writer.

Identity: a UUID v4 in .git/agentcrew-project-id, resolved through
git rev-parse --git-common-dir so worktrees map to their parent. Non-git folders
fall back per §8.2.

Do not decide: the DDL, the paths, the row cap, the retention window, or where the
id lives. All are given in §8. The DDL in §8.3 is known to execute against the
bundled SQLite as written.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 the §8.3 DDL is applied on open and re-opening an existing database is a no-op
- [ ] #2 id survives git clean -xdf and a directory move, proven by a test that performs both
- [ ] #3 two clones of one repo resolve to different project ids and different databases
- [ ] #4 a payload over the 8 KiB cap spills to blobs/ and reads back byte-identical
- [ ] #5 a missing project path is reported unreachable and nothing is deleted
- [ ] #6 engines and the README prerequisite both say Node >= 22
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 node --test passes locally; no test skipped or disabled to get there
- [ ] #2 PRODUCT.md amended in the same commit if the build had to diverge from it, with the reason
- [ ] #3 no new runtime dependency added to package.json
<!-- DOD:END -->
